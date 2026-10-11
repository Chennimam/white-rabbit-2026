import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { sendMessage } from "../lib/chat/chatClient";
import { parseHistory, sessionHistoryStore, HISTORY_KEY } from "../lib/chat/historyStore";
import type { ChatHistoryStore, ChatMessage } from "../lib/chat/types";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.test" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const { renderHook, act, cleanup, render, fireEvent } = await import("@testing-library/react");
const { useChat } = await import("../lib/chat/useChat");
const { ChatMessageList } = await import("../components/chat/ChatMessageList");
afterEach(cleanup);
const user: ChatMessage = { id: "u1", role: "user", content: "Когда встреча?", createdAt: 1 };
const assistant: ChatMessage = { id: "a1", role: "assistant", content: "Ответ", createdAt: 2 };
function memoryStore(seed: ChatMessage[] = []) {
  let saved = seed;
  const store: ChatHistoryStore = { async load() { return saved; }, async save(messages) { saved = [...messages]; } };
  return { store, read: () => saved };
}
const flush = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

test("local chat adapter answers without fetch and rejects invalid input", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { assert.fail("Unexpected network call"); };
  try {
    assert.ok((await sendMessage([user])).includes("20 декабря"));
    await assert.rejects(sendMessage([]), /invalid_request/);
    await assert.rejects(sendMessage([{ ...user, content: "x".repeat(4001) }]), /invalid_request/);
  } finally { globalThis.fetch = original; }
});

test("session history survives remount, new session is empty, legacy local history removed", async () => {
  window.localStorage.setItem("white-rabbit:chat:v1", JSON.stringify([user]));
  window.sessionStorage.clear();
  assert.deepEqual(await sessionHistoryStore.load(), []);
  assert.equal(window.localStorage.getItem("white-rabbit:chat:v1"), null);
  await sessionHistoryStore.save([user, assistant]);
  const first = renderHook(() => useChat(sendMessage, sessionHistoryStore));
  await flush(); first.unmount();
  const second = renderHook(() => useChat(sendMessage, sessionHistoryStore));
  await flush();
  assert.deepEqual(second.result.current.messages, [user, assistant]);
  second.unmount();
  assert.ok(window.sessionStorage.getItem(HISTORY_KEY));
  const originalWindow = globalThis.window;
  const fresh = new JSDOM("", { url: "https://example.test" });
  Object.assign(globalThis, { window: fresh.window });
  try { assert.deepEqual(await sessionHistoryStore.load(), []); }
  finally { Object.assign(globalThis, { window: originalWindow }); fresh.window.close(); }
});

test("corrupt storage, duplicates, system roles and oversized input are rejected", () => {
  assert.deepEqual(parseHistory("broken-json"), []);
  assert.deepEqual(parseHistory('{"messages":[]}'), []);
  assert.deepEqual(parseHistory(JSON.stringify([user, user, { ...user, id: "s", role: "system" },
    { ...user, id: "bad", content: "x".repeat(4001) }, { ...user, id: "time", createdAt: -1 }, assistant])), [user, assistant]);
});

test("hydration preserves stored history instead of overwriting it with a greeting", async () => {
  const memory = memoryStore([user, assistant]);
  const { result } = renderHook(() => useChat(sendMessage, memory.store));
  await flush();
  assert.equal(result.current.ready, true);
  assert.deepEqual(result.current.messages, [user, assistant]);
  assert.deepEqual(memory.read(), [user, assistant]);
});

test("sending and typing, duplicate-send guard, persistence and draft handling", async () => {
  let resolveReply!: (reply: string) => void;
  let calls = 0;
  const transport = () => { calls++; return new Promise<string>((resolve) => { resolveReply = resolve; }); };
  const memory = memoryStore();
  const { result } = renderHook(() => useChat(transport, memory.store));
  await flush();
  act(() => result.current.setDraft("  Привет  "));
  act(() => { result.current.send(); result.current.send(); });
  assert.equal(calls, 1);
  assert.equal(result.current.status, "sending");
  assert.equal(result.current.draft, "");
  assert.equal(result.current.messages.at(-1)?.content, "Привет");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 180)); });
  assert.equal(result.current.status, "typing");
  await act(async () => resolveReply("Ответ"));
  await flush();
  assert.equal(result.current.status, "idle");
  assert.equal(memory.read().at(-1)?.content, "Ответ");
  assert.equal(result.current.messages.filter((m) => m.role === "user").length, 1);
});

test("error and retry preserve one user message and recover", async () => {
  let calls = 0;
  const transport = async () => { if (++calls === 1) throw new Error("Offline"); return "Получилось"; };
  const memory = memoryStore();
  const { result } = renderHook(() => useChat(transport, memory.store));
  await flush();
  act(() => result.current.setDraft("Вопрос"));
  await act(async () => result.current.send());
  assert.equal(result.current.status, "error");
  await act(async () => result.current.retry());
  assert.equal(result.current.status, "idle");
  assert.equal(result.current.messages.filter((m) => m.role === "user").length, 1);
  assert.equal(result.current.messages.at(-1)?.content, "Получилось");
});

test("denied sessionStorage does not prevent chat use", async () => {
  const store: ChatHistoryStore = { async load() { throw new Error("Denied"); }, async save() { throw new Error("Quota"); } };
  const transport = async () => "Ответ";
  const { result } = renderHook(() => useChat(transport, store));
  await flush();
  assert.equal(result.current.ready, true);
  assert.equal(result.current.storageUnavailable, true);
  act(() => result.current.setDraft("Вопрос"));
  await act(async () => result.current.send());
  assert.equal(result.current.messages.at(-1)?.content, "Ответ");
});

test("message output is text, not executable HTML; system messages remain invisible", () => {
  const output = '<img src=x onerror="alert(1)"><script>alert(1)</script>';
  const { container } = render(createElement(ChatMessageList, { messages: [
    { ...assistant, content: output }, { id: "s", role: "system", content: "Server instructions", createdAt: 0 },
  ], status: "idle" }));
  assert.equal(container.querySelector("img, script"), null);
  assert.ok(container.textContent?.includes(output));
  assert.ok(!container.textContent?.includes("Server instructions"));
});


test("input rejects empty sends, supports Enter and preserves Shift+Enter and IME", async () => {
  const { ChatInput } = await import("../components/chat/ChatInput");
  let sends = 0;
  const inputRef = { current: null };
  const props = { value: "", onChange: () => {}, onSend: () => { sends++; }, disabled: false, inputRef };
  const view = render(createElement(ChatInput, props));
  assert.equal((view.getByRole("button") as HTMLButtonElement).disabled, true);
  view.rerender(createElement(ChatInput, { ...props, value: "Вопрос" }));
  const field = view.getByRole("textbox");
  fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
  fireEvent.keyDown(field, { key: "Enter", isComposing: true });
  assert.equal(sends, 0);
  fireEvent.keyDown(field, { key: "Enter" });
  assert.equal(sends, 1);
  view.rerender(createElement(ChatInput, { ...props, value: "Вопрос", disabled: true }));
  fireEvent.keyDown(field, { key: "Enter" });
  assert.equal(sends, 1);
});

test("dialog focuses input, handles cancel and restores focus; viewport resize keeps input region bounded", async () => {
  const { ChatWindow } = await import("../components/chat/ChatWindow");
  const prototype = dom.window.HTMLDialogElement.prototype;
  prototype.showModal = function () { this.setAttribute("open", ""); };
  prototype.close = function () { this.removeAttribute("open"); };
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false }) });
  const viewport = new dom.window.EventTarget() as InstanceType<typeof dom.window.EventTarget> & { height: number; offsetTop: number };
  viewport.height = 844; viewport.offsetTop = 0;
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  const launcher = document.createElement("button"); document.body.append(launcher); launcher.focus();
  let closed = false;
  const chat = { messages: [assistant], status: "idle" as const, draft: "", setDraft: () => {}, ready: true,
    storageUnavailable: false, send: () => {}, retry: () => {} };
  const view = render(createElement(ChatWindow, { chat, onClose: () => { closed = true; } }));
  assert.equal(document.activeElement, view.getByRole("textbox"));
  assert.equal(document.body.style.overflow, "hidden");
  const dialog = view.getByRole("dialog");
  viewport.height = 320; viewport.offsetTop = 35;
  act(() => viewport.dispatchEvent(new dom.window.Event("resize")));
  assert.equal(dialog.style.getPropertyValue("--chat-vv-height"), "320px");
  assert.equal(dialog.style.getPropertyValue("--chat-vv-top"), "35px");
  assert.equal(dialog.dataset.compact, "true");
  fireEvent(dialog, new dom.window.Event("cancel", { cancelable: true }));
  assert.equal(closed, true);
  view.unmount();
  assert.equal(document.activeElement, launcher);
  assert.equal(document.body.style.overflow, "");
  launcher.remove();
});


test("escalation UI sends nothing before review and explicit confirmation", async () => {
  const { ChatEscalation } = await import("../components/chat/ChatEscalation");
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    const payload = JSON.parse(init!.body as string);
    assert.deepEqual(payload, { question: "Перенести дату?", context: "", contact: "", consent: true });
    return Response.json({ ok: true });
  };
  try {
    const view = render(createElement(ChatEscalation, { question: "Перенести дату?" }));
    assert.equal(calls, 0);
    fireEvent.click(view.getByRole("button", { name: "Передать Марии" }));
    assert.equal(calls, 0);
    assert.equal((view.getByRole("button", { name: "Подтвердить и отправить" }) as HTMLButtonElement).disabled, true);
    fireEvent.submit(view.getByRole("form"));
    assert.equal(calls, 0);
    fireEvent.click(view.getByRole("checkbox"));
    await act(async () => {
      fireEvent.submit(view.getByRole("form"));
      fireEvent.submit(view.getByRole("form"));
    });
    assert.equal(calls, 1);
    assert.ok(view.getByRole("status").textContent?.includes("Вопрос передан Марии"));
  } finally { globalThis.fetch = original; }
});

test("escalation failure shows safe fallback and cancellation revokes consent", async () => {
  const { ChatEscalation } = await import("../components/chat/ChatEscalation");
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("private-error", { status: 503 });
  try {
    const view = render(createElement(ChatEscalation, { question: "Перенести дату?" }));
    fireEvent.click(view.getByRole("button", { name: "Передать Марии" }));
    fireEvent.click(view.getByRole("checkbox"));
    await act(async () => fireEvent.submit(view.getByRole("form")));
    assert.ok(view.getByRole("alert").textContent?.includes("Не получилось передать сообщение автоматически"));
    assert.ok(!view.container.textContent?.includes("private-error"));
    fireEvent.click(view.getByRole("button", { name: "Отмена" }));
    fireEvent.click(view.getByRole("button", { name: "Передать Марии" }));
    assert.equal((view.getByRole("checkbox") as HTMLInputElement).checked, false);
  } finally { globalThis.fetch = original; }
});


test("welcome quick actions submit user messages; unknown answer offers Telegram consent UI", async () => {
  const { ChatWindow } = await import("../components/chat/ChatWindow");
  const { UNKNOWN_REPLY } = await import("../lib/chat/scenarios");
  const submitted: string[] = [];
  const chat = { messages: [{ ...assistant, id: "welcome", content: "Привет, чем я могу тебе помочь?" }],
    status: "idle" as const, draft: "", setDraft: () => {}, ready: true,
    storageUnavailable: false, send: (text?: string) => { if (text) submitted.push(text); }, retry: () => {} };
  const view = render(createElement(ChatWindow, { chat, onClose: () => {} }));
  fireEvent.click(view.getByRole("button", { name: "Даты" }));
  assert.deepEqual(submitted, ["Какие даты мероприятия?"]);
  view.rerender(createElement(ChatWindow, { chat: { ...chat, messages: [user, { ...assistant, content: UNKNOWN_REPLY }] }, onClose: () => {} }));
  assert.equal(view.queryByRole("button", { name: "Даты" }), null);
  assert.ok(view.getByRole("button", { name: "Передать Марии" }));
});

test("quick send is recorded as an ordinary user message", async () => {
  const memory = memoryStore();
  const { result } = renderHook(() => useChat(sendMessage, memory.store));
  await flush();
  await act(async () => result.current.send("Сколько стоит участие?"));
  assert.equal(result.current.messages.at(-2)?.content, "Сколько стоит участие?");
  assert.ok(result.current.messages.at(-1)?.content.includes("5 500"));
});
