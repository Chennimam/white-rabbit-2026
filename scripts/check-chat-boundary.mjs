import { readdir, readFile } from "node:fs/promises";
const forbidden = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "api.telegram.org", "OPENAI_API_KEY", "ASSISTANT_CONTEXT", "KNOWLEDGE_VERSION", "api.openai.com", "/api/chat", "OPENAI_MODEL", "AI_CHAT_ENABLED"];
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) await check(path);
    else if (/\.(js|html|json|txt|css)$/.test(entry.name)) {
      const content = await readFile(path, "utf8");
      // Only the approved consultation window may mention this year/month range.
      // Door-to-calendar associations remain forbidden.
      const storyContent = content.replace(/январь–февраль 2027 года/giu, "");
      if (/2027|month-door|month-caption|январ[ьяь]|феврал[ьяь]|март[ае]?\b|апрел[ьяь]|июн[ьяь]|июл[ьяь]|август|сентябр|октябр|ноябр|будущего месяца|будущих месяцев|карта года/iu.test(storyContent)) {
        throw new Error("Unapproved story data found in " + path.pathname);
      }
      if (forbidden.some((text) => content.includes(text))) throw new Error("Server-only data found in " + path.pathname);
    }
  }
}
await check(new URL("../out/", import.meta.url));
console.log("Client boundary verified: no server secrets, Telegram API URL or knowledge module.");
