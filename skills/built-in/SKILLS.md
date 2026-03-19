# Built-in Skills

> Native Sage Team integrations.

## bi-browser-automation — Browser Automation

**Category**: development
**Integration**: MCP Playwright

**Capabilities**:
- Screenshot capture (viewport or full page)
- URL navigation
- Element interaction (click, type, select)
- E2E testing support
- PDF generation

**Configuration** (`.mcp.json`):
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headless", "--caps", "core,pdf,vision"]
    }
  }
}
```

---

## bi-visual-progress-tracking — Visual Progress Tracking

**Category**: workflow

**Protocol**:
1. Capture screenshot at milestone start
2. Capture screenshot at milestone end
3. Generate before/after comparison
4. Include in progress report

**Storage**: Screenshots saved to `.sage-team/screenshots/` with:
- Timestamp
- Agent attribution
- Label/description
- URL captured
