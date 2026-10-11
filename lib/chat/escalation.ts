export const ESCALATION_OFFER = "Этот вопрос лучше уточнить у Марии. Хотите, я передам ей ваш вопрос?";
export const ESCALATION_FAILURE = "Не получилось передать сообщение автоматически. Напишите Марии напрямую в Telegram: @Mariucha.";
export const MAX_QUESTION = 2500;
export const MAX_CONTEXT = 1000;
export type EscalationRequest = { question: string; context: string; contact: string; consent: true };

export async function escalate(input: EscalationRequest): Promise<void> {
  if (input.consent !== true) throw new Error("consent_required");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch("/api/escalate", { method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok || (await response.json())?.ok !== true) throw new Error("unavailable");
  } catch { throw new Error(ESCALATION_FAILURE); }
  finally { clearTimeout(timer); }
}
