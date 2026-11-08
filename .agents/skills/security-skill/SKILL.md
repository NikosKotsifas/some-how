---
name: security-skill
description: >-
  Zero-trust security architecture, data protection, secret management, OWASP Top 10 defense,
  database Row-Level Security (RLS), authentication/authorization hardening, and cryptographic
  data integrity skill. Use whenever writing backend/API code, handling user data, configuring
  authentication, managing environment secrets, setting up databases, or deploying to production.
---

# Extreme Security & Data Protection Skill (`security-skill`)

Enforces zero-trust architecture, strict secret hygiene, defense-in-depth, and lossless data integrity across all projects.

## 1. Zero-Leak Secret & Credential Hygiene
1. **Never Commit Secrets**: API keys, database URLs, private keys, JWT secrets, OAuth client secrets, and session tokens must **never** be hardcoded in source files, HTML, logs, or committed to Git.
2. **Pre-Commit & `.gitignore` Enforcement**:
   - Always ensure `.env`, `.env.*` (except `.env.example` with dummy placeholders), `*.pem`, `*.key`, and `.vercel` are in `.gitignore`.
   - Before any `git add` or `git commit`, scan staged files for high-entropy strings or credential patterns (`sk_live_`, `eyJ...`, `ghp_`, `SUPABASE_SERVICE_ROLE_KEY`).
3. **Client vs. Server Env Separation**:
   - Never prefix server-only secrets with `VITE_`, `NEXT_PUBLIC_`, or `REACT_APP_`, as bundlers inline those into public client JavaScript bundles.

## 2. Data Preservation, Integrity & Backup Safety
1. **Non-Destructive Database Operations**:
   - Never run `DROP TABLE`, `TRUNCATE`, `DELETE` without a `WHERE` clause, or `prisma migrate reset` / `supabase db reset` against production or shared databases without explicit user confirmation and a verified backup.
   - Always use idempotent, forward-compatible migrations (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) and wrap multi-step data mutations in ACID transactions (`BEGIN ... COMMIT`).
2. **Row-Level Security (RLS) by Default**:
   - On Postgres/Supabase, enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on every table immediately upon creation and define explicit least-privilege policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
3. **Encryption in Transit & at Rest**:
   - Enforce TLS 1.2/1.3 (`https://`, `wss://`, `sslmode=require` on DB connections).
   - Hash passwords exclusively with `Argon2id` or `bcrypt` (cost >= 12); never use raw SHA/MD5 for passwords.

## 3. Input Validation, XSS, CSRF & Injection Defense (OWASP Top 10)
1. **Strict Schema Validation**: Validate and sanitize all external inputs (body, query, headers, webhooks) at the API boundary using strict schemas (e.g., `zod`) before processing.
2. **Parameterized Queries Only**: Never concatenate user input into SQL, NoSQL, or shell commands. Use parameterized queries (`$1, $2`) and `execFile`/`execFileSync` (with argument arrays instead of shell strings) to eliminate SQLi and Command Injection.
3. **XSS & DOM Safety**:
   - Avoid `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`. If rich HTML rendering is required, sanitize with `DOMPurify` first.
   - Validate all dynamic URLs (`href`, `src`) to block `javascript:` or `data:` URI injection; add `rel="noopener noreferrer"` on external `target="_blank"` links.
4. **Authentication, Sessions & Rate Limiting**:
   - Store session tokens in `HttpOnly; Secure; SameSite=Lax` (or `Strict`) cookies rather than `localStorage`.
   - Verify webhook signatures using constant-time comparison (`crypto.timingSafeEqual`).
   - Apply rate limiting and abuse protection on login, signup, contact forms, and AI/expensive endpoints.

## 4. Production HTTP Security Headers
Configure the following headers in `vercel.json`, `next.config.js`, or server middleware:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or `CSP frame-ancestors 'none'`)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- Strict `Content-Security-Policy` tailored to the app's trusted asset origins.
