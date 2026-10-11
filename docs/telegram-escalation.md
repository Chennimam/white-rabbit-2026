# Telegram escalation

Изначально добавлено поверх commit 18790e815e9de48c159cbd04fde268aa1fb9fcd6.
После миграции на сценарного «Проводника» Telegram endpoint, consent, D1 rate limiting
и secrets сохранены. OpenAI и /api/chat удалены; предложение передачи формируется локально.

## Сценарий и согласие

scenarioEngine распознаёт тему для Марии или unknown и возвращает готовое предложение
передачи. Клиент показывает действие. Этот этап никогда не вызывает Telegram.

Действие «Передать Марии» открывает форму просмотра вопроса. Пользователь может уточнить
вопрос, добавить краткий релевантный контекст (необязательно) и Telegram username
(необязательно). Контекст не извлекается из всей истории и не отправляется автоматически.
Телефон не запрашивается. Контакт не читается из истории и не сохраняется в sessionStorage.

До отправки явно указано, что данные получит Мария через Telegram.
Нужно включить checkbox согласия (по умолчанию выключен) и нажать «Подтвердить и отправить».
Отмена сбрасывает согласие. Во время отправки поля блокируются, двойной submit игнорируется.
Успех показывает подтверждение; без username не обещается личный ответ.

POST /api/escalate:
```json
{"question":"Можно перенести дату?","context":"Выбрана дата 24 декабря","contact":"@username","consent":true}
```
consent:true — обязательное дополнение к контракту для явного подтверждения.
Без него endpoint не вызывает Telegram. Поле отражает действие UI, не является
аутентификацией или защитой от клиента, который подделывает запрос; для этого есть лимиты.

Успех: {"ok":true}. Ошибки — только безопасные коды (400/403/405/429/503).
UI: «Не получилось передать сообщение автоматически. Напишите Марии напрямую в Telegram: @Mariucha.»
Автоматических повторов нет: после сетевого таймаута Telegram мог уже принять сообщение.

## Сервер и защита

functions/api/escalate.ts вызывает HTTPS Telegram Bot API sendMessage.
chat_id всегда берётся из env.TELEGRAM_CHAT_ID, токен — из env.TELEGRAM_BOT_TOKEN.
Переданные клиентом chat_id/bot_token/messages игнорируются. В Telegram отправляются
только вопрос, краткий контекст, добровольный контакт и фиксированное название источника.
parse_mode не задан; текст пользователя не интерпретируется как HTML/Markdown.
Preview ссылок отключён. Общий текст укладывается в лимит Telegram 4096 символов.
[Telegram API](https://core.telegram.org/bots/api#sendmessage).

POST only; application/json; точный ALLOWED_ORIGINS для Origin и URL endpoint;
вопрос 1–2500 символов, контекст 0–1000, контакт пустой либо @username.
Тело до 24000 байт с проверкой потока независимо от Content-Length. Таймаут Telegram
10 секунд, браузера 15 секунд. Ответы no-store, никаких полных текстов или URL с токеном
в production логах приложения. Не включайте request-body logging в инфраструктуре.

## Обязательный rate limiting

D1 ESCALATION_RATE_DB хранит только атомарные счётчики:
3 попытки на IP за фиксированное окно 10 минут, 20 попыток глобально за минуту.
Отклонённые Telegram попытки тоже учитываются. На границе окон возможен краткий всплеск.
IP сохраняется только как HMAC с серверным секретом и номером окна; сырого IP нет.
Вопросы, username, переписка и consent в D1 не записываются.
Истёкшие счётчики удаляются следующим запросом. Это не БД истории чата;
последние счётчики могут оставаться до следующего запроса, а резервные копии D1
подчиняются политике Cloudflare.

Без D1 binding, таблицы, секретов или CF-Connecting-IP endpoint возвращает 503:
неограниченная отправка никогда не включается. При превышении — 429.
SQL использует bind-параметры и атомарный UPSERT RETURNING, работает между инстансами.
[Cloudflare D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/).
Дополнительный WAF для /api/escalate рекомендован против потока невалидных запросов.

## Настройка Cloudflare вручную

1. Создайте Telegram-бота через @BotFather. Получите bot token.
   Владелец должен сначала открыть бота и отправить /start (либо добавить его в нужную
   приватную группу с правом отправки). Определите числовой chat ID получателя
   доверенным инструментом Telegram Bot API. Для группы ID может быть отрицательным.
   Не используйте Telegram username владельца вместо chat ID личного чата.
2. Workers & Pages → white-rabbit-2026 → Settings → Variables and Secrets:
   добавьте **Secret / Encrypt TELEGRAM_BOT_TOKEN** и **Secret / Encrypt TELEGRAM_CHAT_ID**.
   Никаких NEXT_PUBLIC_ переменных. Не отправляйте значения в чат и GitHub.
3. Используется прежний **ALLOWED_ORIGINS**: только фактические origins без завершающего /.
   Новые обычные variables не нужны.
4. Storage & databases → D1 → Create database: например white-rabbit-escalation-limits.
   В Console новой БД выполните SQL из migrations/escalation-limits.sql (две команды).
   Либо после создания БД из корня репозитория:
   `npx wrangler d1 execute white-rabbit-escalation-limits --remote --file migrations/escalation-limits.sql`.
   Здесь нет секретов или сообщений; создаются только таблица и индекс счётчиков.
5. В существующем Pages проекте Settings → Bindings → Add → D1 database:
   variable name **ESCALATION_RATE_DB**, выбрать созданную БД.
   Production и Preview настраиваются отдельно.
6. Выполните новый deployment ветки main. Build npm run build, output out.
   В public/_routes.json включён только /api/escalate.
   [Cloudflare bindings](https://developers.cloudflare.com/pages/functions/bindings/).
7. На сайте спросите об изменении даты после оплаты. До подтверждения не должно быть
   запросов к /api/escalate и сообщений у бота. Нажмите «Передать Марии», проверьте
   вопрос, при желании добавьте контекст и username, включите согласие, подтвердите.
   В Network ожидается 200 {"ok":true}, у Марии — одно сообщение без полной истории.
   Это реальная отправка: используйте явно обозначенный тестовый вопрос.

Без Telegram secrets и D1 сценарный чат продолжает работать, но отправка показывает fallback.
Для отключения передачи уберите Telegram binding/secret и redeploy; экстренно
можно заблокировать /api/escalate через WAF. OPENAI_API_KEY, OPENAI_MODEL и AI_CHAT_ENABLED больше не используются и могут быть удалены после deployment.

## Локально и проверки

В .dev.vars (gitignored) значения добавляются только локально:
```dotenv
TELEGRAM_BOT_TOKEN="REPLACE_LOCALLY_ONLY"
TELEGRAM_CHAT_ID="REPLACE_LOCALLY_ONLY"
```
Для локальной БД:
```sh
npx wrangler d1 execute ESCALATION_RATE_DB --local --file migrations/escalation-limits.sql
npm run build
npm run dev:pages -- --d1 ESCALATION_RATE_DB
```
Локальный тест без CF-Connecting-IP намеренно не отправляет сообщения. Для ручного HTTP
теста используйте этот заголовок вместе с разрешённым Origin; никогда не отправляйте
реальные вопросы в тестах автоматически. В unit tests Telegram полностью подменён.

Тесты требуют Node с node:sqlite (22.13+ или 24+):
npm run test:chat; npm run lint; npm run build; npm run check:functions.
Build дополнительно проверяет отсутствие Telegram token/chat ID конфигурации, API URL,
OpenAI runtime/config и старого /api/chat в frontend bundle.
Внешний runtime-тест требует настройки Cloudflare владельцем.
