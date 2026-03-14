# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bug Opener is a Chrome Extension (Manifest V3) for reporting bugs from any webpage to Linear or ClickUp, with annotated screenshots and auto-collected environment metadata.

## Commands

```bash
npm run dev       # vite build --watch (development)
npm run build     # production build → dist/
npm run zip       # build + zip dist/ for distribution
npx tsc --noEmit  # type-check without emitting
```

To load in Chrome: `chrome://extensions/` → Developer mode → Load unpacked → select `dist/`.

There are no tests configured.

## Architecture

The extension has four entry points, each a separate Vite input with its own HTML + React root:

- **Popup** (`src/popup/`) — small panel from the toolbar icon; triggers screenshot capture via message to the service worker.
- **Editor** (`src/editor/`) — full-page annotation tool opened after capture. Has a canvas for drawing (arrows, rects, circles, freehand, text) and a sidebar form to submit the bug. Accepts `?demo` query param to render with mock data (for design previews), and `?demo=success` for the confirmation screen.
- **Options** (`src/options/`) — settings page for API keys, default team/project/list, and preferences.
- **Service Worker** (`src/background/service-worker.ts`) — orchestrates capture flow and bug submission. Handles `CAPTURE_BUG` (screenshot → session storage → open editor) and `SUBMIT_BUG` (upload image + create issue in Linear/ClickUp).

Supporting layers:

- **`src/api/linear.ts`** and **`src/api/clickup.ts`** — API clients using `fetch` (Linear uses GraphQL, ClickUp uses REST v2).
- **`src/utils/storage.ts`** — typed wrapper around `chrome.storage.local` (persistent settings) and `chrome.storage.session` (ephemeral screenshot data keyed by UUID).
- **`src/utils/canvas-tools.ts`** — drawing primitives and replay logic for the annotation canvas.
- **`src/utils/metadata.ts`** — injects a script into the active tab via `chrome.scripting.executeScript` to collect page metadata.
- **`src/content/content-script.js`** — plain JS (not bundled by Vite), copied to dist at build time. Responds to `COLLECT_METADATA` messages.
- **`src/components/ui/`** — shadcn/ui-style components (Radix UI + CVA + Tailwind).

## Key conventions

- Path alias `@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.js`).
- Tailwind CSS v4 with `@tailwindcss/postcss` — use `@import "tailwindcss"` in CSS, not the old `@tailwind` directives.
- The content script is plain JS and is copied verbatim by a custom Vite plugin in `vite.config.js` — it is not part of the React/TS build.
- Communication between popup/editor and service worker uses `chrome.runtime.sendMessage` with a `type` field (`CAPTURE_BUG`, `SUBMIT_BUG`, `COLLECT_METADATA`).
- Chrome APIs (`chrome.storage`, `chrome.tabs`, `chrome.scripting`, `chrome.runtime`) are only available in extension context, not in a regular browser tab.
