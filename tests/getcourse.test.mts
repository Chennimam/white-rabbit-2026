import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { getVerifiedForm, getcourseForms, getRegistrationMode, type GetCourseForm } from "../data/getcourse";

const base: GetCourseForm = { widgetId: "123", scriptElementId: "sample-widget", offers: [
  { date: "2026-12-20", productId: "1", offerId: "1", groups: [] },
  { date: "2026-12-24", productId: "2", offerId: "2", groups: [] },
], verifiedPriceRub: 5000, reviewed: true };
test("GetCourse selection fails closed for missing, unreviewed and stale-price forms", () => {
  const forms = { traveler: base, explorer: { ...base, widgetId: "456", verifiedPriceRub: 11000 } };
  assert.equal(getVerifiedForm("traveler", false, forms), null);
  assert.equal(getVerifiedForm(null, true, forms), null);
  assert.equal(getVerifiedForm("traveler", true, { traveler: null, explorer: null }), null);
  assert.equal(getVerifiedForm("traveler", true, forms), base);
  assert.equal(getVerifiedForm("explorer", true, forms)?.verifiedPriceRub, 11000);
  assert.equal(getVerifiedForm("explorer", true, { ...forms, explorer: { ...forms.explorer, verifiedPriceRub: 10000 } }), null);
  assert.equal(getVerifiedForm("traveler", true, { ...forms, traveler: { ...base, reviewed: false } }), null);
  assert.equal(getVerifiedForm("traveler", true, { ...forms, traveler: { ...base, offers: [] } }), null);
  assert.equal(getVerifiedForm("traveler", true, { ...forms, traveler: { ...base, offers: [base.offers[0], base.offers[0]] } }), null);
});

test("four approved tariff/date combinations keep the exact products, offers and prices", () => {
  for (const [plan, widget, price, offers, products] of [
    ["traveler", "1690986", 5000, ["8961745", "8961749"], ["4568076", "4568077"]],
    ["explorer", "1690990", 11000, ["8961750", "8961752"], ["4568078", "4568079"]],
  ] as const) {
    const form = getVerifiedForm(plan, true)!;
    assert.equal(form.widgetId, widget);
    assert.equal(form.verifiedPriceRub, price);
    assert.deepEqual(form.offers.map(x => x.offerId), offers);
    assert.deepEqual(form.offers.map(x => x.productId), products);
    assert.deepEqual(form.offers.map(x => x.date), ["2026-12-20", "2026-12-24"]);
    assert.equal(form.offers.every(x => x.groups.includes("5062166")), plan === "explorer");
  }
  assert.notEqual(getcourseForms.traveler?.scriptElementId, getcourseForms.explorer?.scriptElementId);
});

test("real preview forms are confined to loopback hosts while sales are closed", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) assert.equal(getRegistrationMode(false, host), "preview");
  for (const host of ["rabbit.logos-journey.com", "example.pages.dev", "localhost.example.com", ""]) assert.equal(getRegistrationMode(false, host), "closed");
  assert.equal(getRegistrationMode(true, "rabbit.logos-journey.com"), "live");
});

test("loader uses reviewed widget identity and cleans up without contacting GetCourse", async () => {
  const source = await readFile(new URL("../public/getcourse-init.js", import.meta.url), "utf8");
  const dom = new JSDOM('<p id="status"></p><div id="mount"></div>', { url: "https://example.test" });
  const scope: { mountWhiteRabbitGetCourse?: (mount: HTMLElement, status: HTMLElement) => (() => void) | undefined;
    setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout; location: { hostname: string } } = { setTimeout, clearTimeout, location: { hostname: "127.0.0.1" } };
  vm.runInNewContext(source, { window: scope, document: dom.window.document, Event: dom.window.Event, MutationObserver: dom.window.MutationObserver });
  const mount = dom.window.document.getElementById("mount")!;
  const status = dom.window.document.getElementById("status")!;
  for (const data of [{}, { checkoutEnabled: "false", widgetId: "123", scriptElementId: "example" },
    { checkoutEnabled: "true", widgetId: "bad", scriptElementId: "example" }]) {
    Object.assign(mount.dataset, data);
    assert.equal(scope.mountWhiteRabbitGetCourse!(mount, status), undefined);
    assert.equal(mount.querySelector("script"), null);
  }
  Object.assign(mount.dataset, { checkoutEnabled: "true", registrationMode: "preview", widgetId: "123", scriptElementId: "example" });
  scope.location.hostname = "rabbit.logos-journey.com";
  assert.equal(scope.mountWhiteRabbitGetCourse!(mount, status), undefined);
  scope.location.hostname = "127.0.0.1";
  const stop = scope.mountWhiteRabbitGetCourse!(mount, status)!;
  assert.equal(mount.querySelector("script")?.src, "https://tarotroad.getcourse.ru/pl/lite/widget/script?id=123");
  assert.equal(scope.mountWhiteRabbitGetCourse!(mount, status), undefined);
  stop();
  assert.equal(mount.children.length, 0);
  assert.equal(mount.dataset.initialized, undefined);
  dom.window.close();
});

test("repeated mounts reuse the vendor initializer without accumulating StartWidget dispatches", async () => {
  const source = await readFile(new URL("../public/getcourse-init.js", import.meta.url), "utf8");
  const dom = new JSDOM('<p id="status"></p><div id="mount"></div>', { url: "http://127.0.0.1" });
  const scope: Record<string, any> = { setTimeout, clearTimeout, location: { hostname: "127.0.0.1" } };
  vm.runInNewContext(source, { window: scope, document: dom.window.document, MutationObserver: dom.window.MutationObserver });
  const mount = dom.window.document.getElementById("mount")!;
  Object.assign(mount.dataset, { checkoutEnabled: "true", registrationMode: "preview", widgetId: "123", scriptElementId: "sample" });
  let starts = 0;
  let dispatched = 0;
  dom.window.document.addEventListener("StartWidgetsample", () => { dispatched++; });
  let stop = scope.mountWhiteRabbitGetCourse(mount, null);
  const script = mount.querySelector("script")!;
  scope.startWidgetsample = () => {
    starts++;
    const tag = dom.window.document.getElementById("sample")!;
    tag.parentNode!.insertBefore(dom.window.document.createElement("iframe"), tag);
    tag.remove();
  };
  script.dispatchEvent(new dom.window.Event("load"));
  assert.equal(starts, 1);
  stop();
  for (let i = 0; i < 3; i++) {
    stop = scope.mountWhiteRabbitGetCourse(mount, null);
    assert.equal(mount.querySelectorAll("iframe").length, 1);
    assert.equal(mount.querySelectorAll("script[src]").length, 0);
    stop();
  }
  assert.equal(starts, 4);
  assert.equal(dispatched, 0);
  dom.window.close();
});
