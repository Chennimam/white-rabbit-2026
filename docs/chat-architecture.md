# «Проводник»: бесплатный сценарный чат

## Текущая архитектура

OpenAI отключён и больше не используется. Нет внешнего AI API, embeddings, NLP-сервисов,
платных model calls или серверной генерации ответов.
ChatWidget → useChat → chatClient (локальный адаптер) → scenarioEngine → готовый ответ.
Сценарные ответы бесплатны и работают локально после загрузки сайта.
Telegram и Cloudflare остаются внешними сервисами со своими тарифами/квотами.

Удалены functions/api/chat.ts, functions/_lib/guide.ts, scripts/build-assistant-context.mjs
и API-тесты OpenAI. /api/chat больше не зарегистрирован в Pages Functions и не вызывается
клиентом. На статическом хостинге неизвестный URL может вернуть HTML/404, но model runtime
за ним отсутствует. SDK OpenAI в проекте не было. История реализации сохранена в Git:
[предыдущая AI-архитектура](https://github.com/Chennimam/white-rabbit-2026/blob/9ee109c8c39fe06094f9a6edc2ba117dccf5df55/docs/chat-architecture.md).

## Сценарии и knowledge

Источник истины — knowledge/white-rabbit-assistant-context.md.
lib/chat/scenarios.ts содержит вручную проверенные ответы, intents, quick actions и hash
проверенной версии knowledge. Markdown не парсится при отправке сообщения и не загружается
в браузер целиком.

lib/chat/scenarioEngine.ts экспортирует getScenarioReply(messages):
{reply, intent, confidence, escalate}.
Распознавание: lowercase, Unicode normalization, ё→е, пунктуация/пробелы, группы регулярных
выражений со словоформами и ограниченная коррекция одной опечатки в небольшом словаре.
Все группы правила должны совпасть; частичный match ниже 0.55 не принимается.
Confidence — оценка правил, а не статистическая вероятность.
Приоритет: вопросы для Марии и неизвестные подробности, затем FAQ.
Это ограниченный сценарный движок: произвольные формулировки и сложные вопросы могут
не распознаться; для них предлагается уточнение у Марии без придумывания ответа.

Сохраняются последние четыре сообщения для простого контекста: «а второй?» после тарифов,
«а 24-го?» после дат, «а запись?», «а можно потом?» после вопроса об оплате/записи.
Системные сообщения не используются. История не отправляется на сервер для ответов.

Приветствие прежнее: «Привет, чем я могу тебе помочь?».
Быстрые кнопки Даты / Тарифы / Что будет происходить / Нужно ли знать Таро / Оплата /
Передать Марии отправляют обычные пользовательские сообщения.
UI, sessionStorage, мобильная логика, Escape, focus, keyboard navigation и error/retry
сохранены. Loading остаётся состоянием UI, но локальный ответ обычно мгновенный.

## Обновление знаний

1. Изменить knowledge-файл и проверить факты.
2. Обновить ответы в lib/chat/scenarios.ts и соответствующие правила при необходимости.
3. Обновить KNOWLEDGE_REVIEW_HASH после ручной проверки (SHA-256 исходного Markdown).
4. Выполнить npm run test:chat, lint, build, check:functions; commit/push и новый deploy.

Тест проверяет основные даты, суммы 5500/8000, @Mariucha и hash всей проверенной версии.
Изменение любой части knowledge явно сигнализирует о необходимости пересмотреть сценарии.
Файл knowledge сохранён без изменения.

## Telegram escalation и приватность

Нестандартный вопрос → предложение передачи → форма просмотра → checkbox согласия →
POST /api/escalate → server-side Telegram Bot API.
Для unknown используется отдельный честный fallback, который также открывает действие
«Передать Марии». Ответ движка сам по себе ничего не отправляет.

История остаётся только в sessionStorage вкладки. Refresh сохраняет её; новая независимая
сессия начинает заново. Восстановление/дублирование вкладок зависит от браузера.
При запрете storage чат работает в памяти. Нет server chat history, chat database,
аналитики содержания сообщений или автоматической пересылки полной истории.

Telegram получает лишь проверенный пользователем вопрос, необязательный краткий контекст
и добровольно указанный @username. D1 хранит только счётчики rate limiting.
Серверные секреты и Telegram-логика остаются на сервере.
Подробности: [Telegram escalation](telegram-escalation.md).

## Cloudflare

После успешного deployment новой версии можно удалить:
- OPENAI_API_KEY;
- OPENAI_MODEL;
- AI_CHAT_ENABLED.

Оставить:
- ALLOWED_ORIGINS — точные origins, разрешённые для /api/escalate;
- TELEGRAM_BOT_TOKEN — Secret / Encrypt;
- TELEGRAM_CHAT_ID — Secret / Encrypt;
- ESCALATION_RATE_DB — D1 binding со схемой migrations/escalation-limits.sql.

Новые secrets/variables не требуются. Pages: branch main, build npm run build, output out.
public/_routes.json содержит только /api/escalate. Для изменений bindings/secrets нужен
новый deployment. При отсутствии Telegram-настроек локальные ответы работают,
а подтверждённая отправка показывает безопасный fallback.
После удаления AI secrets откат на старый AI commit потребует повторной настройки;
рекомендуется откатываться на сценарную версию.

## Локальная проверка

npm ci
npm run test:chat
npm run lint
npm run build
npm run check:functions

Node 22.13+ / 24+ нужен для тестов SQLite. npm run dev подходит для локальных ответов,
а npm run dev:pages после build — для сайта с Telegram Function.
Для Telegram setup и локального D1 см. отдельную инструкцию.
Build проверяет отсутствие OpenAI runtime URL/config, /api/chat и Telegram secrets/API URL
в frontend bundle. Все Telegram HTTP вызовы в тестах подменяются.

После deployment проверить: типовые вопросы, короткое уточнение про второй тариф,
unknown → действие передачи без автоматического запроса, sessionStorage после refresh.
В Network при обычном общении нет POST /api/chat и внешних model calls.
Проверить quick buttons на 375/390/430 px и desktop, доступность ввода с клавиатурой.
