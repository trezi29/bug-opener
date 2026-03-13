# Bug Opener

A Chrome extension for reporting bugs directly from any webpage to **Linear** or **ClickUp**, complete with annotated screenshots and automatic environment metadata.

## Features

- **One-click screenshot capture** of the active tab
- **Annotation editor** — draw arrows, rectangles, circles, freehand, and text on the screenshot before submitting
- **Linear & ClickUp integrations** — create issues/tasks with the annotated screenshot attached
- **Auto-collected metadata** — URL, viewport size, device pixel ratio, user agent, connection type, cookies count, localStorage keys
- **Configurable defaults** — set your default team/project (Linear) or workspace/space/list (ClickUp)

## Setup

```bash
npm install
```

### Development

```bash
npm run dev
```

This runs `vite build --watch` in development mode.

### Production build

```bash
npm run build
```

Output goes to `dist/`.

### Package for distribution

```bash
npm run zip
```

Creates `bug-opener.zip` from the `dist/` folder.

## Load in Chrome

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

## Configuration

Click the extension icon, then open **Settings** to:

1. Add your **Linear** API key (`lin_api_...`) and/or **ClickUp** API key (`pk_...`)
2. Select default team, project, workspace, space, or list
3. Choose your default integration and preferences

## Tech stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4, Radix UI, Lucide icons
- Chrome Extension Manifest V3
