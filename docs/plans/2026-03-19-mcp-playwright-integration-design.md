# MCP Playwright Integration — Design Document

**Date:** 2026-03-19
**Status:** Implemented
**Author:** Claude

## Overview

Integration of Microsoft Playwright MCP for browser automation, visual tracking, and screenshot-based progress reporting.

## Architecture

```
PlaywrightBridge (EventEmitter)
├── connect()              # Launch Chromium via playwright-core
├── disconnect()           # Clean shutdown
├── navigate(url)          # Page navigation
├── screenshot(options)    # Capture viewport or element
├── click(selector)        # Click interaction
├── type(selector, text)   # Input interaction
├── evaluate(script)       # Run JS on page
├── captureProgress()      # Labeled progress screenshot
├── captureBeforeAfter()   # Before/after comparison
└── generateProgressReport()  # Markdown report from history
```

## Modes

### MCP Mode
Configured via `.mcp.json`. The MCP server runs Playwright with capabilities: core, pdf, vision. Used by Claude Code for direct browser interaction.

### Direct Mode
Uses `playwright-core` programmatically via `PlaywrightBridge`. Launches headless Chromium, takes screenshots, saves to `.sage-team/screenshots/`.

## Browser Discovery

1. Check known paths: `/usr/bin/chromium`, `/usr/bin/google-chrome`, etc.
2. Check Playwright cache: `~/.cache/ms-playwright/chromium*/`
3. Try CDP connection: `http://localhost:9222`
4. Fallback: `chromium.launch()` without explicit path

## Screenshot Storage

```
.sage-team/
└── screenshots/
    ├── 1710850000000-quinn-progress-qa-review.png
    ├── 1710850100000-uma-before-homepage.png
    └── ...
```

Format: `{timestamp}-{agentId}-{label}.png`

## CLI Commands

```bash
sage-team screenshot <url> [--label] [--full-page] [--agent]
sage-team report
```

## Agent Integration

Agents with `bi-browser-automation` skill can take screenshots during task execution. The orchestrator exposes `takeScreenshot()` and `getProgressReport()` methods.
