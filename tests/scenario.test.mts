import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getScenarioReply, normalizeText, scoreIntent } from "../lib/chat/scenarioEngine";
import { answers, KNOWLEDGE_REVIEW_HASH, quickActions, type ScenarioIntent } from "../lib/chat/scenarios";
import { sendMessage } from "../lib/chat/chatClient";
import type { ChatMessage } from "../lib/chat/types";
const user = (content: string): ChatMessage => ({ id: crypto.randomUUID(), content, role: "user", createdAt: 1 });
const cases: [ScenarioIntent, string[]][] = [
  ["greeting", ["Привет!", "ЗДРАВСТВУЙТЕ", "Добрый день", "приветик", "можно вопрос"]],
  ["dates", ["когда", "какие даты", "дата мероприятия", "когда проходит", "когда встреча", "во сколько начало"]],
  ["both_dates", ["нужно ли участвовать в обе даты", "обе даты обязательно", "надо два раза", "нужно присутствовать и 20 и 24", "две встречи обязательны"]],
  ["duration", ["сколько длится", "продолжительность", "сколько часов"]],
  ["format", ["как проходит", "что это", "это лекция", "это тренинг", "какой формат", "это гадание"]],
  ["what_happens", ["Что будет происходить?", "что будем делать", "Карта года"]],
  ["tarot_required", ["нужно знать таро", "нужна колода", "я не знаю таро", "можно без таро"]],
  ["audience", ["для кого", "кому подходит", "я новичок"]],
  ["traveler", ["путешественник", "первый тариф", "что входит в 5500", "5 500"]],
  ["researcher", ["исследователь", "второй тариф", "что входит в 8000"]],
  ["pricing", ["сколько стоит", "сколько стоит участие", "цена", "стоимость", "тарифы", "расскажите об обоих тарифах"]],
  ["difference_between_tariffs", ["в чем разница тарифов", "чем отличаются тарифы", "какой тариф выбрать"]],
  ["payment", ["как оплатить", "оплата", "как купить", "карта", "как записаться"]],
  ["recording", ["будет ли запись", "а запись?", "есть запись встречи"]],
  ["materials", ["какие материалы", "рабочий файл", "путеводитель"]],
  ["what_to_prepare", ["нужна ли подготовка", "как подготовиться"]],
  ["about_maria", ["кто ведущая", "кто Мария", "об Ухановой"]],
  ["location_online", ["это онлайн", "где проходит встреча", "место проведения"]],
  ["discount", ["можно скидку", "есть промокод", "сколько стоит со скидкой"]],
  ["refund", ["возврат", "вернуть деньги", "как отменить участие"]],
  ["installment", ["в рассрочку", "оплатить частями", "перенос оплаты"]],
  ["change_date", ["поменять дату после оплаты", "перенести участие", "можно другую дату"]],
  ["payment_problem", ["не проходит оплата", "не открывается форма", "российская карта", "альтернативный способ оплаты", "ошибка заказа", "не могу оплатить", "не получается оплатить"]],
  ["access_problem", ["доступ к записи", "восстановить доступ", "на сколько дней запись", "можно только в записи"]],
  ["individual_format", ["корпоративное участие", "индивидуальный формат", "личная консультация", "регистрация уже закрыта"]],
  ["contact_maria", ["Передать Марии", "как написать Марии", "контакт Марии"]],
  ["unknown", ["Как варить борщ?", "по московскому времени?", "точный состав дополнительных материалов", "что взять с собой", "какой возраст участников"]],
];
for (const [intent, phrases] of cases) {
  test("scenario " + intent + ": varied phrasings", () => {
    for (const phrase of phrases) {
      const reply = getScenarioReply([user(phrase)]);
      assert.equal(reply.intent, intent, phrase);
      assert.ok(reply.confidence >= 0 && reply.confidence <= 1);
      assert.equal(reply.reply, answers[intent]);
      if (intent === "unknown") assert.equal(reply.escalate, true);
    }
  });
}
test("all required sensitive intents escalate, ordinary researcher does not", () => {
  for (const text of ["скидка", "возврат", "поменять дату", "личная консультация", "доступ к записи", "что за ерунда"]) {
    assert.equal(getScenarioReply([user(text)]).escalate, true, text);
  }
  assert.equal(getScenarioReply([user("исследователь")]).escalate, false);
});
test("short follow-ups use recent session history only", () => {
  function follow(question: string, next: string) {
    const first = user(question);
    const response = getScenarioReply([first]);
    return getScenarioReply([first, { ...first, id: "assistant", role: "assistant", content: response.reply }, user(next)]);
  }
  assert.equal(follow("сколько стоит", "А чем второй отличается?").intent, "difference_between_tariffs");
  assert.equal(follow("тарифы", "а второй?").intent, "researcher");
  assert.equal(follow("второй тариф", "а первый?").intent, "traveler");
  assert.equal(follow("какие даты", "а 24-го?").intent, "dates");
  assert.equal(follow("первый тариф", "а запись?").intent, "recording");
  assert.equal(follow("будет запись", "а можно потом?").intent, "access_problem");
  assert.equal(follow("как оплатить", "а можно потом?").intent, "installment");
  assert.equal(follow("исследователь", "а какие именно материалы?").intent, "unknown");
  assert.equal(getScenarioReply([user("а второй?")]).intent, "unknown");
  assert.equal(getScenarioReply([user("тарифы"), ...Array.from({ length: 5 }, () => user("привет")), user("а второй?")]).intent, "unknown");
});
test("spelling tolerance, punctuation, ё and word forms", () => {
  assert.equal(getScenarioReply([user("стоимоть")]).intent, "pricing");
  assert.equal(getScenarioReply([user("иследователь")]).intent, "researcher");
  assert.equal(getScenarioReply([user("путешествнник")]).intent, "traveler");
  assert.equal(getScenarioReply([user("  ЦЕНА???!!!  ")]).intent, "pricing");
  assert.equal(normalizeText("  Ёлка, ВСЁ! "), "елка все");
  assert.deepEqual(getScenarioReply([user("В чём разница тарифов?")]), getScenarioReply([user("В чем разница тарифов")]));
  assert.equal(getScenarioReply([user("Нужны ли знания Таро?")]).intent, "tarot_required");
});
test("weak/incomplete groups do not guess", () => {
  assert.ok(scoreIntent("карта", [/карта/, /российск/]) < 0.55);
  assert.equal(getScenarioReply([user("???")]).intent, "unknown");
  assert.equal(getScenarioReply([user("обед")]).intent, "unknown");
});
test("quick actions map to supported local replies; no network even for escalation offer", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { assert.fail("No network allowed"); };
  try {
    for (const action of quickActions) assert.ok(await sendMessage([user(action.message)]));
    assert.equal(getScenarioReply([user(quickActions.at(-1)!.message)]).escalate, true);
  } finally { globalThis.fetch = original; }
});
test("knowledge facts and reviewed version stay in sync with scenarios", async () => {
  const source = await readFile(new URL("../knowledge/white-rabbit-assistant-context.md", import.meta.url), "utf8");
  assert.equal(createHash("sha256").update(source).digest("hex"), KNOWLEDGE_REVIEW_HASH,
    "Knowledge changed: review lib/chat/scenarios.ts answers and then update KNOWLEDGE_REVIEW_HASH.");
  const normalized = source.replace(/[\s*]/g, "");
  for (const fact of ["20декабря", "24декабря", "5500", "8000", "@Mariucha"]) {
    assert.ok(normalized.includes(fact), "Knowledge fact changed; update scenarios: " + fact);
  }
  assert.ok(answers.dates.includes("20 декабря 2026 в 16:00"));
  assert.ok(answers.dates.includes("24 декабря 2026 в 18:00"));
  assert.ok(answers.traveler.includes("5 500"));
  assert.ok(answers.researcher.includes("8 000"));
});


test("word fragments must not turn unrelated questions into confident FAQ answers", () => {
  assert.notEqual(getScenarioReply([user("как завершить старое")]).intent, "tarot_required");
  assert.equal(getScenarioReply([user("какая дата подходит для меня")]).intent, "dates");
  assert.notEqual(getScenarioReply([user("иду с подругой когда встреча")]).intent, "change_date");
});
