import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.test" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
const { render, cleanup, fireEvent } = await import("@testing-library/react");
const { ParticipationSelection, PlanCTA } = await import("../components/ParticipationSelection");
const { Registration } = await import("../components/Registration");
afterEach(cleanup);

test("approved live tariff CTA selects the matching form and price without submitting an order", () => {
  const view = render(createElement(ParticipationSelection, { children: [
    createElement(PlanCTA, { key: "link", planId: "explorer", href: "#order", children: "Выбрать Исследователя" }),
    createElement(Registration, { key: "registration" }),
  ] }));
  fireEvent.click(view.getByRole("link", { name: "Выбрать Исследователя" }));
  const explorer = view.getByRole("radio", { name: /Исследователь/ }) as HTMLInputElement;
  assert.equal(explorer.checked, true);
  assert.match(view.container.querySelector('.selection-status')!.textContent!, /11\s000/);
  assert.equal(view.container.querySelector<HTMLElement>('.getcourse-order')?.dataset.widgetId, "1690990");
  assert.match(view.container.textContent!, /24 декабря 2026 — 17:00–21:00 МСК/);
  assert.equal(view.container.querySelector('input[name="participation-date"]'), null);
  fireEvent.click(view.getByRole("radio", { name: /Путешественник/ }));
  assert.equal(explorer.checked, false);
  assert.match(view.container.querySelector('.selection-status')!.textContent!, /5\s000/);
  assert.equal(view.container.querySelector<HTMLElement>('.getcourse-order')?.dataset.widgetId, "1690986");
  assert.equal(view.container.querySelector<HTMLElement>('.getcourse-order')?.dataset.registrationMode, "live");
  assert.equal(view.container.querySelector('iframe'), null);
  assert.equal(view.container.querySelector('a[href*="widget?id="]')?.getAttribute('href'), "https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=1690986");
});
