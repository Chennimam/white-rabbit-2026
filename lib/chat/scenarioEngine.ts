import type { ChatMessage } from "./types";
import { answers, escalationIntents, type ScenarioIntent, type ScenarioReply } from "./scenarios";
export type { ScenarioIntent, ScenarioReply } from "./scenarios";

export function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFKC").replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
// One edit (including adjacent transposition), only for distinctive words >= 5 chars.
// This is a small spelling aid, not semantic NLP; ambiguous corrections are ignored.
const vocabulary = ["привет", "стоит", "здравствуйте", "стоимость", "путешественник", "исследователь",
  "оплатить", "рассрочка", "возврат", "продолжительность", "скидка"];
function oneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const different = [...a].map((c, i) => c === b[i] ? -1 : i).filter((i) => i >= 0);
    return different.length === 1 || (different.length === 2 && different[1] === different[0] + 1
      && a[different[0]] === b[different[1]] && a[different[1]] === b[different[0]]);
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0; while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}
function correct(text: string) {
  let changed = false;
  const result = text.split(" ").map((word) => {
    if (word.length < 5 || vocabulary.includes(word)) return word;
    const candidates = vocabulary.filter((known) => oneEdit(word, known));
    if (candidates.length !== 1) return word;
    changed = true; return candidates[0];
  }).join(" ");
  return { text: result, changed };
}
type Rule = { intent: ScenarioIntent; groups: RegExp[] };
// All groups must match. Priority is explicit: sensitive/unknown details before FAQ.
const rules: Rule[] = [
  { intent: "discount", groups: [/скид|дешевле|промокод|льгот/] },
  { intent: "refund", groups: [/возврат|верну[тл]|вернуть|отмен.*(заказ|участ|плат)/] },
  { intent: "installment", groups: [/рассроч|частями|перен[ое]с.*(плат|оплат)|оплат.*потом/] },
  { intent: "change_date", groups: [/менять|менить|смен[аи]|перен[ое]с|(?:^| )друг/, /дат|встреч|участи|декабр/] },
  { intent: "payment_problem", groups: [/(плат|оплат|заказ|форм|getcourse|подтвержден)/, /ошиб|не (проход|работ|откры|приш|могу|получ)|отклон|проблем|сложност|неверн|неправил|дважды|списал/] },
  { intent: "payment_problem", groups: [/карт|способ.*оплат/, /российск|зарубеж|иностран|альтернатив|европ|visa|mastercard|мир/] },
  { intent: "access_problem", groups: [/доступ|парол|восстанов|ссылк.*запис/] },
  { intent: "access_problem", groups: [/запис[ьи]/, /срок|сколько|когда|навсегда|только|потом|месяц|дн[ея]|недел/] },
  { intent: "individual_format", groups: [/индивидуаль|корпоратив|консультац|терапи|депресс|травм|кризис|паническ|личн.*психолог|больш.*групп|закрыт.*регистрац|регистрац.*закрыт/] },
  { intent: "contact_maria", groups: [/мари|mariucha/, /переда|отправ|напис|связ|контакт|телеграм|telegram/] },
  { intent: "unknown", groups: [/часов.*пояс|московск|киевск|берлинск|zoom|зум|платформ|валют|евро|доллар|договор|сертификат|возраст|погод|программирован/] },
  { intent: "unknown", groups: [/точн|конкрет|подроб|перечень|список/, /дополн|расшир|исследоват/] },
  { intent: "unknown", groups: [/подготов|принест|взять|понадоб/, /вещ|материал|бумаг|ручк|список|с собой/] },
  { intent: "both_dates", groups: [/(?:^| )об[ео](?:их|им|ими)?(?: |$)|два раза|две встречи|и 20 и 24|20 и 24.*обяз/, /дат|встреч|участв|два раза|и 20 и 24/] },
  { intent: "difference_between_tariffs", groups: [/отлич|разниц|сравн|выбра/, /тариф|путешествен|исследоват/] },
  { intent: "traveler", groups: [/путешествен|перв.*тариф|5500|5 500/] },
  { intent: "researcher", groups: [/исследоват|втор.*тариф|8000|8 000/] },
  { intent: "tarot_required", groups: [/(?:^| )таро(?: |$)|колод/] },
  { intent: "duration", groups: [/длит|продолжительност|сколько.*(?:^| )час|долго/] },
  { intent: "pricing", groups: [/сколько стоит|стоимост|(?:^| )цен[ауы]|тариф|ценник/] },
  { intent: "dates", groups: [/(?:^| )дат|когда.*(встреч|проход|мероприят|мистер|нач)|во сколько|начал|декабр|^когда$|^а? ?(?:20|24)(?: го)?$/] },
  { intent: "recording", groups: [/запис[ьи]/] },
  { intent: "payment", groups: [/оплат|купить|покуп|регистрац|записаться|^карта$/] },
  { intent: "materials", groups: [/материал|путеводител|рабоч.*файл/] },
  { intent: "what_to_prepare", groups: [/подготов|что.*понадоб/] },
  { intent: "audience", groups: [/для кого|кому.*подход|мне.*подойдет|нович/] },
  { intent: "about_maria", groups: [/ведущ|кто.*мари|об.*мари|уханов/] },
  { intent: "location_online", groups: [/онлайн|где.*(встреч|проход|мероприят)|место.*провед|^где$/] },
  { intent: "what_happens", groups: [/происход|будем.*делать|программ|карта года|12 двер|практик/] },
  { intent: "format", groups: [/формат|как.*проход|что это|что.*мистер|лекци|тренинг|гадан|прогноз|предсказ/] },
  { intent: "greeting", groups: [/^(привет[а-я]*|здравствуйте|здравствуй|добрый день|добрый вечер|доброе утро|можно вопрос)$/] },
];
export function scoreIntent(text: string, groups: RegExp[]): number {
  const matched = groups.filter((pattern) => pattern.test(text)).length;
  return matched === groups.length ? 0.9 : (matched / groups.length) * 0.4;
}
function result(intent: ScenarioIntent, confidence = 0.9): ScenarioReply {
  return { reply: answers[intent], intent, confidence, escalate: escalationIntents.has(intent) };
}
function direct(text: string): ScenarioReply {
  const match = rules.find((rule) => scoreIntent(text, rule.groups) >= 0.55);
  return match ? result(match.intent, match.intent === "unknown" ? 0.4 : 0.9) : result("unknown", 0);
}
export function getScenarioReply(messages: ChatMessage[]): ScenarioReply {
  const last = messages.at(-1);
  if (!last || last.role !== "user" || !last.content.trim()) return result("unknown", 0);
  const normalized = correct(normalizeText(last.content));
  const text = normalized.text;
  // Only the last four messages, and only known replies or user questions.
  const history = messages.slice(-5, -1);
  const previous = [...history].reverse().map((message) => {
    if (message.role === "assistant") return (Object.keys(answers) as ScenarioIntent[])
      .find((intent) => answers[intent] === message.content);
    if (message.role === "user") return direct(normalizeText(message.content)).intent;
    return undefined;
  }).find((intent) => intent && intent !== "greeting" && intent !== "unknown");
  const tariffs = ["pricing", "traveler", "researcher", "difference_between_tariffs", "materials"];
  let reply: ScenarioReply;
  if (previous && tariffs.includes(previous) && /^(а )?(второй|второго|первый|первого)( тариф)?$/.test(text))
    reply = result(/втор/.test(text) ? "researcher" : "traveler", 0.85);
  else if (previous && tariffs.includes(previous) && /^(а )?чем (второй|первый) отличается$/.test(text))
    reply = result("difference_between_tariffs", 0.85);
  else if (previous === "researcher" && /точн|подроб|какие именно|что именно|перечень|список/.test(text))
    reply = result("unknown", 0.4);
  else if (previous === "recording" && /потом|сколько|срок|когда|доступ/.test(text))
    reply = result("access_problem", 0.85);
  else if (previous === "payment" && /потом|частями/.test(text))
    reply = result("installment", 0.85);
  else reply = direct(text);
  return { ...reply, confidence: Math.max(0, reply.confidence - (normalized.changed ? 0.1 : 0)) };
}
