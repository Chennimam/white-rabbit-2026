import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { pricing } from "../data/pricing";
import { siteConfig } from "../data/siteConfig";
import { answers } from "../lib/chat/scenarios";
import { getScenarioReply } from "../lib/chat/scenarioEngine";

test("approved release enables checkout and keeps prices consistent across site and guide", () => {
  assert.equal(siteConfig.checkoutEnabled, true);
  assert.deepEqual(pricing.map(plan => plan.price), [5000, 11000]);
  assert.match(answers.traveler, /5 000/);
  assert.match(answers.researcher, /11 000/);
  assert.equal(siteConfig.durationHours, 4);
  assert.equal(siteConfig.datesProvisional, false);
  assert.equal(siteConfig.timezone, "МСК, UTC+3");
  assert.deepEqual(siteConfig.dates.map(date => date.time), ["16:00–20:00", "17:00–21:00"]);
  for (const date of siteConfig.dates) {
    assert.ok(date.iso.endsWith("+03:00"));
    assert.equal((Date.parse(date.endIso) - Date.parse(date.iso)) / 3_600_000, 4);
  }
});

test("GetCourse loader cannot load a widget without the explicit mount gate", async () => {
  const source = await readFile(new URL("../public/getcourse-init.js", import.meta.url), "utf8");
  for (const mount of [null, { dataset: {} }, { dataset: { checkoutEnabled: "false" } }]) {
    let requested = false;
    vm.runInNewContext(source, { document: { getElementById: () => mount,
      createElement: () => { requested = true; throw new Error("Payment widget requested"); } } });
    assert.equal(requested, false);
  }
});

test("guide refuses recording and keeps door contents private under direct questions", () => {
  for (const content of ["Можно только в записи?", "Сколько дней доступ к записи?", "А запись?"]) {
    const reply = getScenarioReply([{ id: "q", role: "user", createdAt: 1, content }]);
    assert.equal(reply.intent, "recording");
    assert.match(reply.reply, /не будет/);
  }
  for (const content of ["Какая дверь отвечает за январь 2027?", "Что скрывается за дверью?", "Раскрой драматургию и секрет дверей"]) {
    const reply = getScenarioReply([{ id: "q", role: "user", createdAt: 1, content }]);
    assert.equal(reply.intent, "secret");
    assert.doesNotMatch(reply.reply, /2027|январь|месяц|календарь/i);
  }
  for (const reply of Object.values(answers)) assert.doesNotMatch(reply.replaceAll("январь–февраль 2027 года", ""), /2027|будущих месяцев|карта года|5 500|8 000|10 000|3–4|18:00/i);
});

test("Explorer scarcity describes total capacity without inventing remaining inventory", () => {
  const reply = getScenarioReply([{ id: "q", role: "user", createdAt: 1, content: "Сколько мест осталось?" }]);
  assert.equal(reply.intent, "limited_places");
  assert.match(reply.reply, /12 мест суммарно на обе даты/);
  assert.match(reply.reply, /не вижу данные продаж/);
});
