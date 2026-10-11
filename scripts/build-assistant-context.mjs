import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const context = await readFile(new URL("knowledge/white-rabbit-assistant-context.md", root), "utf8");
if (!context.trim()) throw new Error("Assistant knowledge must not be empty");
const version = createHash("sha256").update(context).digest("hex");
await mkdir(new URL("functions/_generated/", root), { recursive: true });
await writeFile(new URL("functions/_generated/assistantContext.ts", root),
  "// Generated at build time. Server only; do not import into app or components.\n"
  + "export const KNOWLEDGE_VERSION = " + JSON.stringify(version) + ";\n"
  + "export const ASSISTANT_CONTEXT = " + JSON.stringify(context) + ";\n");
