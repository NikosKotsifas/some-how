---
name: stitch-mcp
description: >-
  Google Stitch MCP and Design-to-Code workflow skill. Use when connecting to Google Stitch,
  configuring the Stitch MCP server, importing Stitch design.md tokens, reading Stitch screen
  layouts, or translating Google Stitch UI mockups into production React/Vite/CSS components.
---

# Google Stitch MCP & Design-to-Code Skill

Bridges **Google Stitch** (Google Labs' AI UI design platform) with Antigravity so design screens, `design.md` specifications, color tokens, and HTML/CSS structures flow directly into production code.

## 1. Configuring the Stitch MCP Server

To enable the Google Stitch MCP server in Antigravity, add the `stitch` server entry to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"]
    }
  }
}
```
*(If using a remote Streamable HTTP endpoint from a hosted Stitch MCP router, set `"url": "https://<your-stitch-mcp-endpoint>/mcp"` instead.)*

## 2. Design-to-Code Workflow

When translating a Google Stitch screen or `design.md` specification into code:

1. **Extract Design Tokens First**:
   - Read the exact color palette (background, surface, primary text, muted text, accent), font families, type scale, border radii, and spacing tokens from the Stitch spec.
   - Map them to CSS custom properties (`:root { --bg: ...; --fg: ...; }`) in `src/styles/index.css`.
2. **Preserve Structural Proportions**:
   - Keep the exact container widths, grid column ratios, aspect ratios, and padding hierarchy defined in the Stitch frame.
3. **Upgrade Static Mockups to Production Components**:
   - Replace static placeholder blocks with semantic HTML5 (`<header>`, `<main>`, `<section>`, `<nav>`, `<article>`), accessible ARIA attributes, smooth GSAP/CSS transitions, and responsive breakpoints.
4. **Visual Diff Verification**:
   - Render the implemented component in headless Chrome or DevTools and compare it side-by-side against the Stitch reference screenshot.
