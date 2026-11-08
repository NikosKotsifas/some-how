---
name: debug-skill
description: >-
  Systematic root-cause debugging and full-stack troubleshooting skill. Use whenever the user
  says something is not working, a page fails to load, a dev server refuses connections, styles
  or animations break, or build/runtime errors occur.
---

# Systematic Debug Skill

Never guess at fixes. Follow this strict 4-step root-cause isolation protocol whenever something isn't working.

## Step 1: Check Process & Network Layer First
1. **Background Dev Server State**: Use `manage_task` (`Action: "list"` / `"status"`) to verify whether the dev server is still running or was stopped by a session restart.
2. **Host Binding (IPv4 vs IPv6 on Windows)**:
   - On Windows, `localhost` resolves to IPv6 `::1` first. If Vite/Node is started with `--host 127.0.0.1` (IPv4 only), `http://localhost:5173/` will fail with `ERR_CONNECTION_REFUSED`.
   - Always configure `host: '::'` in `vite.config.js` (and `--host ::` on CLI) so the server listens on dual-stack IPv6 (`localhost` / `::1`) and IPv4 (`127.0.0.1`).
3. **Sandbox Boundary**: Remember that a server started inside the sandbox (`BypassSandbox: false`) cannot be reached from the user's browser. Always start user-facing dev servers with `BypassSandbox: true` and `IsDaemon: true`.

## Step 2: Inspect Build & Asset Resolution
1. Verify that every asset slug referenced in `src/data/studioData.js` or `src/App.jsx` exists in `public/somehow-assets/` or `vite.config.js` `ASSET_MAP`.
2. Run a clean production build (`vite build`) to catch syntax errors, missing imports, or broken asset paths immediately.

## Step 3: Inspect Browser Console & DOM State
1. Open the target URL in headless Chrome or Chrome DevTools.
2. Capture console errors, uncaught page exceptions, failed network requests (`status >= 400`), and full-viewport screenshots.
3. Verify GSAP `ScrollTrigger` cleanup in React `useEffect` (`gsap.context()` / `ctx.revert()`) so React `StrictMode` double-invocation never leaves elements stuck at `opacity: 0`.

## Step 4: Verify Fix End-to-End
Confirm the fix with concrete evidence (terminal log output, HTTP 200 probe, or rendered screenshot) before reporting back to the user.
