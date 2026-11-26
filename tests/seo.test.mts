import assert from "node:assert/strict";
import { test } from "node:test";
import { siteConfig } from "../data/siteConfig";
import { createEventData, serializeEventData } from "../lib/seo/eventData";
import { robotsMetadata as robots, sitemapMetadata as sitemap } from "../lib/seo/crawlMetadata";

test("canonical host, sitemap and robots use the official domain", () => {
  assert.equal(siteConfig.siteUrl, "https://rabbit.logos-journey.com");
  assert.equal(robots().sitemap, "https://rabbit.logos-journey.com/sitemap.xml");
  assert.deepEqual(sitemap().map(page => page.url), ["https://rabbit.logos-journey.com/"]);
  assert.match(siteConfig.description, /11 000/);
  assert.doesNotMatch(siteConfig.description, /10 000/);
});
test("online event data keeps Moscow times and the two approved offers without leaking Zoom links", () => {
  const events = createEventData()["@graph"];
  assert.equal(events.length, 2);
  assert.deepEqual(events.map(event => event.startDate), ["2026-12-20T16:00:00+03:00", "2026-12-24T17:00:00+03:00"]);
  for (const event of events) {
    assert.equal(event.duration, "PT4H");
    assert.equal(event.location["@type"], "VirtualLocation");
    assert.ok(!("url" in event.location));
    assert.deepEqual(event.offers?.map(offer => offer.price), [5000, 11000]);
    assert.deepEqual(event.offers?.map(offer => offer.url), ["https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=1690986", "https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=1690990"]);
  }
  assert.doesNotMatch(serializeEventData(), /InStock|join\.zoom|10 000|<script/i);
});
