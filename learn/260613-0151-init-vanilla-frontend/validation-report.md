# Validation Report — 2026-06-13 01:51 EDT

## Size check (limit: 800 LOC per doc, 300 for README)

| File | LOC | Status |
|------|----|--------|
| `README.md` | 189 | ✅ |
| `docs/project-overview-pdr.md` | 47 | ✅ |
| `docs/codebase-summary.md` | 77 | ✅ |
| `docs/code-standards.md` | 82 | ✅ |
| `docs/configuration-guide.md` | 94 | ✅ |
| `docs/design-guidelines.md` | 113 | ✅ |
| `docs/system-architecture.md` | 151 | ✅ |
| `docs/changelog.md` | 58 | ✅ |

## Internal link check

All `docs/*.md` cross-references resolve. README's table of contents points at all 7 docs, each exists.

## Code reference check

- All exported function names referenced in docs (`createMessage`, `prependMessage`, `removeChatMessage`, `removeExcessMessages`, `fadeRemoveMessage`, `createPinnedMessage`, `fetch7TVEmotes`, `alertSubscription`, `alertGiftedSubs`, `alertRaid`, `alertKicksGift`, `showSetupScreen`) exist in source.
- All DOM ids (`#alert-container`, `#container`, `#chat-container`, `#night-mode`) exist in `index.html`.
- All CSS classes referenced in docs exist in `style.css`.
- All CSS variables documented exist in `:root`.

## Missing assets correctly flagged

The following are referenced by code but not present in the repo. They are explicitly documented in README and the relevant docs rather than silently ignored:

- `css/day.css` (referenced by `!daymode` command in `ws.js`)
- `assets/subscriber.svg` (referenced as fallback in `chat.js`)

## Outcome

**Validation score: 100%.**

No fix iterations required.
