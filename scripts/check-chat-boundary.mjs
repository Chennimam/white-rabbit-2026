import { readdir, readFile } from "node:fs/promises";
const forbidden = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "api.telegram.org", "OPENAI_API_KEY", "ASSISTANT_CONTEXT", "KNOWLEDGE_VERSION"];
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) await check(path);
    else if (/\.(js|html|json|txt)$/.test(entry.name)) {
      const content = await readFile(path, "utf8");
      if (forbidden.some((text) => content.includes(text))) throw new Error("Server-only data found in " + path.pathname);
    }
  }
}
await check(new URL("../out/", import.meta.url));
console.log("Client boundary verified: no server secrets, Telegram API URL or knowledge module.");
