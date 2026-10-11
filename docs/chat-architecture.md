# AI «Проводник»: запуск и архитектура

Статический Next.js export сохранён. ChatWidget → useChat → chatClient.sendMessage →
POST /api/chat → Cloudflare Pages Function → OpenAI Responses API → {reply}.
GetCourse, изображения, тексты лендинга, CTA и footer не изменены.

## Файлы и контракт

- functions/api/chat.ts — HTTP endpoint, без Next API routes.
- functions/_lib/guide.ts — серверные инструкции.
- knowledge/white-rabbit-assistant-context.md — единственный источник фактов.
- scripts/build-assistant-context.mjs перед build создаёт functions/_generated/assistantContext.ts:
  ASSISTANT_CONTEXT и SHA-256 KNOWLEDGE_VERSION. Модуль не импортируется клиентом,
  не копируется в out и игнорируется Git. Отсутствующий/пустой Markdown останавливает build.
- public/_routes.json ограничивает запуск Functions маршрутом /api/chat.
- lib/chat/chatClient.ts — адаптер запроса; UI не знает провайдера.

Запрос: {"messages":[{"role":"user","content":"Нужно ли быть на обеих встречах?"}]}.
Успех: {"reply":"..."}. Ошибка: {"error":"invalid_request"} (400), forbidden (403),
method_not_allowed (405), rate_limited (429), temporarily_unavailable (503).
UI показывает сообщение с @Mariucha и «Повторить», сохраняя вопрос.

Сервер проверяет POST, application/json, JSON, roles user/assistant, непустой строковый content,
последнее сообщение user. System/developer отклоняются; в OpenAI уходят только role/content.
Лимиты: 20 сообщений, 4000 символов на сообщение, 20000 суммарно, 128000 байт тела
(проверяется поток, а не только Content-Length). Клиент обрезает старую историю.
Таймаут OpenAI 25 секунд, клиент 28, UI 30. Неполные/некорректные ответы отклоняются.
Ошибки провайдера/ключи не возвращаются; Cache-Control: no-store.

Origin обязателен: точное совпадение ALLOWED_ORIGINS, без *. Также проверяется origin
URL endpoint — можно закрыть pages.dev при использовании защищённого custom domain.
OPTIONS разрешает POST/Content-Type. Origin не аутентифицирует внешние HTTP-клиенты:
они могут подделать заголовок, поэтому нужен rate limiting.

HTTPS POST https://api.openai.com/v1/responses использует instructions с серверным контекстом,
store:false, max_output_tokens:800, модель OPENAI_MODEL (по умолчанию gpt-4.1-mini).
Нет tools, Conversations, previous_response_id, фоновых вызовов, веб-поиска, БД.
Приветствие локальное. Ответы выводятся как текст без HTML.
[OpenAI text generation](https://developers.openai.com/api/docs/guides/text),
[модель](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

## История и приватность

sessionStorage текущей вкладки хранит до 100 сообщений UI. Refresh сохраняет историю;
новая независимая сессия её не получает. Восстановление/дублирование вкладок браузером
может восстанавливать sessionStorage. Старый localStorage demo-ключ удаляется без переноса.
Если storage запрещён, чат работает в памяти до refresh. Ограниченная история каждого
запроса передаётся серверу и OpenAI. Нет server sessions, KV/D1, БД и логирования вопросов,
ответов или ключей в приложении. Не включайте логирование request body в Cloudflare.
store:false отключает сохранение Responses для повторного получения, но не гарантирует
нулевое хранение у провайдеров: [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

## Cloudflare

Открыть **Workers & Pages → white-rabbit-2026 → Settings → Variables and Secrets → Add**,
окружение Production (Preview отдельно).

| Имя | Тип | Значение |
| --- | --- | --- |
| OPENAI_API_KEY | Secret / Encrypt | Ваш ключ OpenAI API; вставить только в Cloudflare |
| OPENAI_MODEL | Text | gpt-4.1-mini |
| AI_CHAT_ENABLED | Text | true (false отключает) |
| ALLOWED_ORIGINS | Text | https://white-rabbit-2026.pages.dev,https://rabbit.logos-journey.com |

Указывать только реально используемые origins без завершающего /. Для WAF на custom domain
оставить только https://rabbit.logos-journey.com (см. ниже).
Не использовать NEXT_PUBLIC_ для ключа, не присылать его в чат и не коммитить.

Build command npm run build, output out, branch main, root — корень этого репозитория
(package.json и functions/). Нужна Git-интеграция Pages либо Wrangler deployment из корня:
загрузка только out через drag-and-drop не включает исходники Functions.
После настройки vars/secrets выполнить новый deploy: Deployments → Retry deployment для
нужного main commit. Проверить сборку Pages Function в журнале.
[Cloudflare variables and secrets](https://developers.cloudflare.com/pages/functions/bindings/).

Kill switch: AI_CHAT_ENABLED=false и redeploy отключают API без изменения кода.
Это не мгновенная смена конфигурации уже работающего deployment. Для немедленного отключения
заблокировать /api/chat через WAF; сайт и GetCourse остаются доступны.

## Rate limiting перед публичным запуском

Частотный лимит в аккаунте Cloudflare ещё не настроен. Лимиты тела/истории/таймаута
не заменяют его. Нет счётчика Map, который терял бы состояние между инстансами.

Для custom domain в зоне logos-journey.com:
Security → Security rules → Create rule → Rate limiting rules.
Условия: hostname rabbit.logos-journey.com, URI Path equals /api/chat, method POST.
Счётчик IP; ориентир 10 запросов за 60 секунд, Block на 60 секунд (доступные интервалы
зависят от тарифа). Если доступен custom response: 429, application/json,
{"error":"rate_limited"}. Нажать Deploy.
[Cloudflare WAF](https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/).

Zone WAF не защищает pages.dev. При запуске только custom domain удалите pages.dev из
ALLOWED_ORIGINS — endpoint проверяет и собственный hostname. Не включайте публичный
pages.dev AI без отдельной защиты частоты.
Предусмотрен серверный адаптер CHAT_RATE_LIMITER.limit({key:ip}) для будущего распределённого
лимитера: до OpenAI, отказ 429, сбой 503. Он ещё не подключён к реальному Pages binding;
потребуется совместимый сервис/Worker. Для текущего запуска используйте WAF.
Будущий Turnstile проверяется до OpenAI. Настройте бюджет/уведомления OpenAI проекта.

## Локальная проверка

```sh
npm ci
npm run test:chat
npm run lint
npm run build
npm run check:functions
npm run dev:pages
```

Wrangler установлен как devDependency. dev:pages обслуживает out + functions на
http://localhost:8788. После изменения клиента пересобрать out.
next dev, обычный static server и старый автономный HTML-preview не предоставляют /api/chat.

Локально создать .dev.vars в корне (уже игнорируется вместе с .env*):
```dotenv
OPENAI_API_KEY="REPLACE_LOCALLY_ONLY"
OPENAI_MODEL="gpt-4.1-mini"
AI_CHAT_ENABLED="false"
ALLOWED_ORIGINS="http://localhost:8788,http://127.0.0.1:8788"
```
Сначала false для проверки fallback без расходов. Для реального вызова ключ вставляется
только в этот файл и включается true. Не добавлять файл в Git.
[Cloudflare local development](https://developers.cloudflare.com/pages/functions/local-development/).

## Первый безопасный тест после deployment

1. Открыть разрешённый домен: приветствие не делает вызов OpenAI.
2. «Нужно ли участвовать в обе даты?» — ожидается выбор одной даты.
3. «Можно индивидуальную скидку?» — ожидается направление к @Mariucha.
4. Уточнить предыдущий вопрос: история передаётся в рамках сессии.
5. Refresh сохраняет диалог; новая независимая приватная сессия начинает с приветствия.
6. В Network: POST /api/chat → 200, только {reply}, без ключа/системных инструкций.
7. Проверить desktop и 375/390/430 px, клавиатуру, Escape, фокус, loading/error/retry.
8. В тестовом окружении false + redeploy должен показать fallback без вызова OpenAI.

Для обновления знаний изменить Markdown, проверить факты, выполнить проверки, commit/push main
и дождаться нового Pages deploy. Build автоматически обновляет контекст и его hash.


## Telegram escalation

Для вопросов, направляемых knowledge к Марии, добавлено предложение передачи и
отдельный POST /api/escalate. Telegram вызывается только после просмотра вопроса
и явного подтверждения. Нужны два Telegram secrets и D1 binding для счётчиков
частоты (без хранения переписки). Подробно: [Telegram escalation](telegram-escalation.md).
