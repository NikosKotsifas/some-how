---
name: playwright-skill
description: >-
  Playwright browser automation, end-to-end testing, multi-viewport visual verification, and
  Playwright MCP integration skill. Use when automating browser interactions, capturing
  pixel-accurate screenshots, verifying responsive layouts, or running E2E checks.
---

# Playwright Browser Automation & Verification Skill

Provides end-to-end browser verification, multi-viewport screenshot capture, and Playwright MCP configuration.

## 1. Playwright MCP Server Setup (Optional)

To expose Playwright browser tools directly over MCP, add `@playwright/mcp` to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## 2. Multi-Viewport Visual & Functional Verification

When verifying **Some.how** or capturing client websites:
1. **Desktop (`1920x1080`) & 4K (`2752x1536` / `3840x2160`)**:
   - Verify that 3D hero logos, showreel canvas, works parallax cards, and studio showcases render with zero broken images (`img.complete && img.naturalWidth > 0`).
2. **Mobile (`390x844`) & Tablet (`768x1024`)**:
   - Verify that `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow) and navigation menus open/close cleanly.
3. **Clean Client Captures**:
   - When capturing live client sites, strip or hide GDPR/cookie banners (`#cmplz-cookiebanner-container`, `.grecaptcha-badge`) via CSS injection only — never alter the site's DOM layout, grid columns, or brand logo.
