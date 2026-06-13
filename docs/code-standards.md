# Code Standards

This project is small, vanilla, and unbundled — the standards are equally light. The goal is to keep contributions readable and to avoid the temptation to add tooling that the static-only constraint can't justify.

## Languages and runtime

- **HTML5**, **CSS3**, **JavaScript** (ES2020+ — `?.` optional chaining, `??` nullish coalescing, regex lookbehind are all used).
- **ES modules** loaded via `<script type="module">`. No bundler. No transpiler.
- Target: modern Chromium (OBS / Meld / Streamlabs all ship a recent Chromium).

## JavaScript conventions

| Topic | Convention |
|-------|------------|
| Module style | Native ESM (`import` / `export`). No CommonJS. |
| Variable declarations | `const` by default; `let` when reassignment is necessary; never `var`. |
| Casing | `camelCase` for variables and functions, `PascalCase` only for constructors / classes (currently none). |
| Indentation | 2 spaces. |
| Quotes | Double quotes in JS; single quotes in CSS strings inside `url(...)`. |
| Semicolons | Required. |
| Imports | At the top of the module, grouped by source: local first then third-party. (Currently all local.) |
| Async style | `async` / `await` preferred over `.then` chains. |
| Error handling | Catch at the module boundary, log to `console.log` with a descriptive prefix. Never throw to the top-level — a thrown error in a browser source means the overlay just stops working with no recovery. |
| DOM construction | Built imperatively via `document.createElement` + class assignments. No templating library. |
| Side effects at module load | Allowed but documented — `ws.js` opens the WebSocket as a side effect at import time, which is unusual but intentional (no main() entry function). |

## Module conventions

- Each module exports one cohesive concern. Cross-module state goes through named exports (e.g. `kickChannel`, `sevenTVEmotes`).
- `chat.js` exports DOM-rendering functions. `ws.js` exports a single shared `kickChannel` constant + `subBadges` array, plus the `minKicksAlert` threshold. `7tv.js` exports the populated emotes array. `alerts.js` exports one function per alert type plus `showSetupScreen`.
- Internal helpers (e.g. `emoteParsing`, `escapeRegExp`, `pushAlert`, `safeParse`) are not exported.

## CSS conventions

- All variables live in `:root` inside `style.css`. Override-style themes (`night.css`) re-declare specific properties only.
- Class names use lowercase with hyphens (`.message-item`, `.pinned-message`, `.alert-subscription`).
- Selectors should stay shallow — single-class selectors are preferred. Nesting is avoided.
- Animations live next to the rule that uses them.

## Naming patterns

- Event handlers: `handleWebSocketOpen`, `handleWebSocketMessage`, etc.
- DOM-creating functions: `createMessage`, `createPinnedMessage` — return the constructed element.
- DOM-appending functions: `prependMessage` — caller doesn't need the element back.
- DOM-removing functions: `removeChatMessage`, `removeExcessMessages`, `fadeRemoveMessage`.
- Alert dispatchers: `alertSubscription`, `alertGiftedSubs`, `alertRaid`, `alertKicksGift` — all accept a single options object.

## Logging

- Use `console.log` with a short prefix (`"Banned UserID"`, `"Kick Subscriber Badges:"`, `"Unknown event:"`).
- Never log full message bodies for general traffic — chat content can be noisy.
- Logging is the **debugging interface**. Streamers can open DevTools and inspect.

## What this codebase explicitly does **not** use

| Pattern | Why not |
|---------|---------|
| TypeScript | Adds a build step. The project must run as plain files. |
| A framework (React, Vue, Svelte) | Same. |
| A bundler (Vite, Webpack) | Same. |
| `npm` / `package.json` | No dependencies are installed. All third-party code is fetched over HTTP at runtime. |
| Tests | No tests exist; the project is small enough that smoke-test-in-OBS is the validation strategy. (If you add tests, keep them runnable from `file://` — no Node-only frameworks.) |
| A linter / formatter config | Not committed. If you add one, prefer Prettier defaults so it stays mostly invisible. |

## When adding new event handlers

1. Add the `if (messageData.event === "App\\Events\\NewEvent")` branch in `ws.js#handleWebSocketMessage`.
2. End the branch with `return;` to avoid hitting the unknown-event logger.
3. Wrap data parsing in `safeParse(messageData.data)` — incoming data is sometimes already-parsed and sometimes a JSON string.
4. Use optional chaining (`d?.foo?.bar`) — Kick's payload shapes shift across events.
5. Log meaningfully on failure but never throw.

## When adding new alert types

1. Add a CSS rule `.alert-<type>` in `style.css` near the other alert variants.
2. Export an `alert<Type>({ ...fields })` from `alerts.js` that calls `pushAlert("alert-<type>", html)`.
3. Always `escapeHtml(...)` user-supplied strings before splicing into the alert template — Kick usernames and messages are user input.

## See also

- [System architecture](system-architecture.md)
- [Design guidelines](design-guidelines.md)
