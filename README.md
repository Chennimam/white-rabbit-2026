# За Белым Кроликом

Первый адаптивный вариант лендинга «12 дверей в Новый год». Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide. Без backend и встроенной платёжной системы.

## Запуск

Требуется Node.js 20.9+ и npm.

```sh
npm install
npm run dev
```

Откройте адрес, который напечатает Next.js (обычно http://localhost:3000).

```sh
npm run lint
npm run typecheck
npm run build
```

`output: 'export'` уже включён в `next.config.ts`. Команда build создаёт **out/** — готовый статический сайт. Отдельная команда `next export` не нужна. `npm run start` предназначен для серверного Next.js и при статическом экспорте не используется. Для проверки экспорта можно выполнить `npx serve out`.

В среде разработки также проверены команды `pnpm install`, `pnpm run lint`, `pnpm run build`. Для воспроизводимости с pnpm сохранён `pnpm-lock.yaml`.

## Настройки

- `data/siteConfig.ts` — даты, время, часовой пояс, основной URL, сроки доступа к записи, SEO.
- `data/pricing.ts` — стоимость, состав форматов, ссылки оплаты `paymentUrl`.
- `data/socialLinks.ts` — ссылки социальных сетей и сайта.

Пока `paymentUrl` пустой, кнопка честно показывает недоступность оплаты и подпись «Ссылка на оплату скоро появится». После добавления URL она автоматически становится ссылкой. Пустые social URL отображаются с подписью «скоро», без фиктивных переходов. Внутренние CTA ведут к выбору участия.

Перед публичным запуском заполните ссылки оплаты, соцсетей, срок `[срок]`, расширенный состав участия, часовой пояс и `siteUrl`. Часовой пояс намеренно не выведен: в исходном ТЗ он не указан. Указание `siteUrl` даёт корректные абсолютные OpenGraph URL и canonical. Social preview: `public/og-image.jpg`, 1200 × 630 px.

## Cloudflare Pages через GitHub

1. Создайте GitHub-репозиторий и загрузите содержимое этой папки. Не загружайте `node_modules`, `.next`, `out` и файлы окружения.
2. В Cloudflare выберите Workers & Pages → Create → Pages → Connect to Git и нужный репозиторий.
3. Для **статического** проекта используйте preset None (либо Next.js Static HTML Export, если доступен).
4. Build command: `npm install && npm run build`. Output directory: `out`. Root directory — корень репозитория, если файлы загружены из этой папки напрямую.
5. Укажите Node.js 22 в настройках сборки. Если Cloudflare автоматически выбирает pnpm по lockfile, используйте `pnpm install --frozen-lockfile && pnpm run build` или настройте менеджер пакетов проекта явно.
6. После получения домена внесите его HTTPS URL в `siteConfig.siteUrl` и повторите сборку.

Git remote `origin`: https://github.com/Chennimam/white-rabbit-2026.git. Основная ветка: `main`. Проект подготовлен к размещению; Cloudflare-публикация пока не выполнена. Секреты, API, базы данных и платёжный backend не нужны. `next/image` настроен с `unoptimized: true`, поэтому статическому хостингу не нужен сервер оптимизации.

## Фотография Марии

`public/images/maria-ukhanova.jpg` — точная копия исходного `Ukhanova.jpg`. Лицо, внешность и исходная графика фотографии не менялись. Нет ретуши, генерации портрета и цветовых CSS-фильтров. Оформление выполняется только рамкой и маской контейнера; на мобильном допустимо небольшое кадрирование. Портрет загружается лениво. Исходный файл сохранён в полном качестве.

## Графика и дизайн

Локальные Cormorant Garamond и Manrope с кириллицей, бумажная палитра, тонкая бордовая нить и одна доминирующая композиция на раздел. Веб-шрифты не требуют Google Fonts или других внешних запросов. Hero WebP — отдельная сгенерированная гравюрная иллюстрация; фотография Марии не передавалась генератору.

`public/placeholders/` содержит заменяемые SVG-композиции и карту визуальных материалов. В первой версии ключ, 12 дверей, тоннель и финальная дверь реализованы кодом в соответствующих компонентах; их можно заменить готовыми гравюрами. Декоративные композиции скрыты от скринридера. Двери реагируют на мышь, касание и клавиатуру, не содержат придуманных описаний месяцев.

Движение мягкое и однократное; учитывается `prefers-reduced-motion`. Содержимое доступно и без JavaScript. CTA, ссылки и декоративные двери имеют состояния клавиатурного фокуса. На телефоне двери перестраиваются в две колонки.

## Структура

- `app/` — страница, metadata, стили.
- `components/` — отдельные разделы, общие элементы и анимация.
- `data/` — редактируемая конфигурация.
- `public/images/` — исходная фотография и герой-иллюстрация.
- `public/placeholders/` — заготовки графики.
- `public/og-image.jpg` — превью для социальных сетей.

## Промпт для hero-иллюстрации

Создано встроенным ImageGen, не CLI. Итоговый файл: `public/images/hero-rabbit.webp`.

> Use case: stylized-concept. Asset type: right-hand hero illustration for a sophisticated Russian literary New Year mystery landing page. Create one vertical 2:3 illustration like a delicate antique Victorian copperplate etching on uniform warm ivory parchment #f3edde. A realistic adult white rabbit, alert, in profile looking toward an old tall narrow arched doorway slightly ajar; beyond it a dark forest-green void with a very fine warm light at the threshold. Rabbit at lower foreground right, tall arched carved door centrally behind it, understated sparse grasses at base. Rabbit is a natural-history engraving, no clothes, not anthropomorphic, not cute cartoon. Fine precise sepia crosshatching, exquisite antique bookplate linework. Restrained aged brown/sepia ink, cream highlights and tiny muted antique gold accents. Sparse atmospheric composition, lots of clear parchment around silhouette, edges fade seamlessly to plain parchment. One dominant visual symbol: rabbit and mysterious entrance together. No text, letters, numbers, borders, watermarks, clocks, keys, symbols, people, portraits, or other animals. No photographic texture, no 3D, no Disney, no modern digital illustration.
