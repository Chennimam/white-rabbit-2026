import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.test" });
class PointerEvent extends dom.window.MouseEvent {
  readonly pointerType: string;
  constructor(type: string, init: MouseEventInit & { pointerType?: string } = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? "mouse";
  }
}
Object.defineProperty(dom.window, "PointerEvent", { value: PointerEvent });
Object.defineProperty(dom.window, "matchMedia", { value: (media: string) => ({
  matches: true, media, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
}) });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element, SVGElement: dom.window.SVGElement, PointerEvent,
  MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const { render, cleanup, fireEvent } = await import("@testing-library/react");
const { TwelveDoors } = await import("../components/TwelveDoors");
const { ThirteenthDoor } = await import("../components/ThirteenthDoor");
const { ParticipationSelection } = await import("../components/ParticipationSelection");
afterEach(cleanup);

test("thirteenth door touch can toggle motion without sticky hover", () => {
  const view = render(createElement(ParticipationSelection, { children: createElement(ThirteenthDoor) }));
  const door = view.getByRole("button", { name: "Тринадцатая дверь — проявить свет и вопрос" });
  fireEvent.pointerOver(door, { pointerType: "touch" });
  assert.equal(door.classList.contains("is-illuminated"), false);
  fireEvent.click(door);
  assert.equal(door.classList.contains("is-illuminated"), true);
  fireEvent.click(door);
  assert.equal(door.classList.contains("is-illuminated"), false);
});

test("thirteenth door mouse hover ends on leave and Escape clears a pinned state", () => {
  const view = render(createElement(ParticipationSelection, { children: createElement(ThirteenthDoor) }));
  const door = view.getByRole("button", { name: "Тринадцатая дверь — проявить свет и вопрос" });
  fireEvent.pointerOver(door, { pointerType: "mouse" });
  assert.equal(door.classList.contains("is-illuminated"), true);
  fireEvent.pointerOut(door, { pointerType: "mouse", relatedTarget: document.body });
  assert.equal(door.classList.contains("is-illuminated"), false);
  fireEvent.click(door);
  fireEvent.keyDown(door, { key: "Escape" });
  assert.equal(door.getAttribute("aria-pressed"), "false");
  assert.equal(door.classList.contains("is-illuminated"), false);
});

test("touch can reveal and dismiss a question without leaving sticky mouse hover", () => {
  const view = render(createElement(TwelveDoors));
  const first = view.container.querySelector<HTMLButtonElement>(".portal-card")!;
  fireEvent.pointerOver(first, { pointerType: "touch" });
  assert.equal(first.classList.contains("is-awake"), false);
  fireEvent.click(first);
  assert.equal(first.getAttribute("aria-pressed"), "true");
  assert.equal(first.classList.contains("is-awake"), true);
  fireEvent.click(first);
  assert.equal(first.getAttribute("aria-pressed"), "false");
  assert.equal(first.classList.contains("is-awake"), false);
});

test("pointer and keyboard selection replace a stale hover with exactly one question", () => {
  const view = render(createElement(TwelveDoors));
  const cards = [...view.container.querySelectorAll<HTMLButtonElement>(".portal-card")];
  fireEvent.pointerOver(cards[0], { pointerType: "mouse" });
  fireEvent.pointerDown(cards[1], { pointerType: "touch" });
  fireEvent.click(cards[1]);
  assert.deepEqual(cards.filter(x => x.classList.contains("is-awake")), [cards[1]]);
  fireEvent.pointerOver(cards[0], { pointerType: "mouse" });
  fireEvent.keyDown(cards[2], { key: "Enter" });
  assert.deepEqual(cards.filter(x => x.classList.contains("is-awake")), [cards[2]]);
});

test("chess composition pairs every approved door with a dark question cell", () => {
  const view = render(createElement(TwelveDoors));
  const pairs = [...view.container.querySelectorAll(".portal-pair")];
  assert.equal(pairs.length, 12);
  assert.equal(view.container.querySelectorAll(".portal-cell").length, 24);
  for (const pair of pairs) {
    const door = pair.querySelector(".portal-light .portal-card")!;
    const question = pair.querySelector(".portal-dark .portal-question")!;
    assert.ok(door);
    assert.equal(pair.querySelectorAll(".portal-dark .portal-card").length, 0);
    assert.equal(door.getAttribute("aria-describedby"), question.id);
  }
});

test("mouse hover is temporary and Escape clears a pinned choice", () => {
  const view = render(createElement(TwelveDoors));
  const cards = [...view.container.querySelectorAll<HTMLButtonElement>(".portal-card")];
  assert.equal(cards.length, 12);
  fireEvent.pointerOver(cards[0], { pointerType: "mouse" });
  assert.equal(cards[0].classList.contains("is-awake"), true);
  assert.equal(cards[0].getAttribute("aria-pressed"), "false");
  fireEvent.pointerOut(cards[0], { pointerType: "mouse", relatedTarget: document.body });
  assert.equal(cards[0].classList.contains("is-awake"), false);
  fireEvent.click(cards[1]);
  assert.equal(cards[1].classList.contains("is-awake"), true);
  fireEvent.pointerOver(cards[0], { pointerType: "mouse" });
  assert.equal(cards[0].classList.contains("is-awake"), true);
  assert.equal(cards[1].classList.contains("is-awake"), false);
  fireEvent.pointerOut(cards[0], { pointerType: "mouse", relatedTarget: document.body });
  assert.equal(cards[1].classList.contains("is-awake"), true);
  fireEvent.keyDown(cards[1], { key: "Escape" });
  assert.equal(cards[1].getAttribute("aria-pressed"), "false");
  assert.equal(cards[1].classList.contains("is-awake"), false);
  for (const card of cards) assert.ok(document.getElementById(card.getAttribute("aria-describedby")!));
});
