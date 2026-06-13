# Changelog

Notable changes since the project's first commit. Generated from `git log`; newest first.

## Unreleased

Major refactor toward a universal, multi-streamer overlay.

### Added
- **Universal channel support** — the `?kick=` URL parameter is now required and there is no longer a hardcoded default channel. The page title is now generic (`chat-dock`) instead of bound to a specific streamer.
- **Setup screen** — opening the overlay without `?kick=` now renders a clear setup card with the example URL instead of silently falling back to a default.
- **Alert system** (`js/alerts.js`) — stacking, animated alerts at the top of the overlay for:
  - New subscriptions (and resubs, with month count)
  - Gifted subs (single or bulk)
  - Raids / hosts (with incoming viewer count)
  - Kicks tips, with a configurable minimum threshold via `?minKicks=N`
- **Unknown-event logging** — `ws.js` now logs any unrecognised Pusher event to the console so the source can be updated when Kick's WebSocket schema changes.
- **Channel-wide topic subscription** — `ws.js` now subscribes to both `chatrooms.{chatroomId}.v2` and `channel.{channelId}` so it can receive sub/raid events that are not delivered to the chatroom topic.
- **Documentation** — full `docs/` directory: project overview, codebase summary, system architecture (with Mermaid diagrams), code standards, design guidelines, configuration guide, and this changelog.
- **README** — expanded from a one-line title to a full overview with an FAQ covering OBS, Meld Studio, Streamlabs/XSplit/vMix, iPhone, and Android streaming workflows.

### Changed
- `index.html` now loads a fourth ES module, `js/alerts.js`, and includes an `#alert-container` element above the chat scroll area.
- `js/ws.js` no longer attaches a duplicate `message` event listener at the module bottom.
- CSS gained a full `.alert-*` ruleset plus a `.setup-screen` layout.

### Removed
- Hardcoded default channel name (`queengloria`).
- Specific streamer's name from the document title.

## 2025-02-09 — `d90d68d`
- **correct username** — README user-facing reference fix.

## 2025-01-26

A flurry of iteration on the initial day, mostly visual.

- `aabac22` — **Update style.css** (final pass of the day)
- `0b95a5c` — **Trying a new approach** — meaningful layout refactor
- `f62e0e8` — **Update style.css**
- `82fe3bb` — **Update style.css**
- `1938496` — **Update style.css**
- `6f6dbab` — **Update style.css**
- `9e89b81` — **readability changes**
- `a90ba43` — **first commit** — initial scaffolding: HTML entry, Kick Pusher WebSocket connection, badge SVGs, base CSS, 7TV emote fetch.

## Conventions going forward

Commit messages should use a short prefix indicating the change type:

- `feat:` new functionality
- `fix:` bug fix
- `docs:` documentation only
- `style:` CSS or visual change
- `refactor:` internal restructuring with no behavior change
- `chore:` tooling, dependency, or housekeeping

See [code-standards.md](code-standards.md) for the broader conventions.
