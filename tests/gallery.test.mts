import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { doors } from "../data/doors";
import { thirteenthDoor } from "../data/thirteenthDoor";

const approved: Record<string, { question: string; sha256: string }> = JSON.parse(
  await readFile(new URL("./fixtures/approved-gallery.json", import.meta.url), "utf8"),
);

test("all approved questions remain paired with their unchanged artwork", async () => {
  assert.equal(doors.length, 12);
  assert.equal(new Set(doors.map(door => door.id)).size, 12);
  assert.equal(new Set(doors.map(door => door.question)).size, 12);
  for (const door of doors) {
    assert.equal(door.question, approved[door.id].question, door.id);
    const asset = await readFile(new URL("../public" + door.image, import.meta.url));
    assert.equal(createHash("sha256").update(asset).digest("hex"), approved[door.id].sha256, door.id);
    assert.doesNotMatch(door.image, /observatory|celestial|alchemy|month|2027/i);
  }
});

test("the separately approved thirteenth paradox stays outside the gallery", () => {
  assert.equal(thirteenthDoor.question, "А что, если ты — воспоминание о собственном будущем?");
  assert.ok(doors.every(door => door.question !== thirteenthDoor.question));
  assert.ok(doors.every(door => !door.image.includes("thirteenth")));
});

test("motion layers have an explicit static alternative and do not animate the original img", async () => {
  const effects = await readFile(new URL("../components/doors/door-effects.css", import.meta.url), "utf8");
  assert.match(effects, /prefers-reduced-motion: reduce/);
  assert.match(effects, /animation: none !important/);
  assert.match(effects, /\.effect-surface, \.door-effects \.effect-particles/);
  assert.doesNotMatch(effects, /img\s*\{/);
});
