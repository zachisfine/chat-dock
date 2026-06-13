# Project Overview & PDR

## What this project is

**chat-dock** is a single-page, browser-only chat overlay for [Kick.com](https://kick.com) streams. It is intended to be loaded as a **browser source** in OBS (or similar broadcasting software) so the streamer's audience sees live chat overlaid on the broadcast.

## Goals

1. **Zero-install for the streamer.** Open a URL, point OBS at it, done. No login, no API key, no backend service to maintain.
2. **Live and faithful to Kick.** Show messages, badges, pins, deletions, and bans as they happen on the platform.
3. **Visually customizable.** The streamer can swap themes (day / night) and tweak CSS variables to match their on-stream look.
4. **Resilient.** A dropped WebSocket should not require the streamer to refresh the browser source — reconnect automatically.

## Non-goals

- No moderation tooling (sending messages, banning, timing out) — this is a read-only display.
- No persistence / chat history beyond what's currently rendered.
- No multi-platform aggregation (Twitch + YouTube + Kick in one view). Kick only.
- No backend, build pipeline, or package manager. The repo is meant to run as static files.

## Constraints

- **Static-only delivery.** Everything must work from `file://` or a plain static host. No server-side code.
- **Public APIs only.** All data comes from the public Kick channel API (`https://kick.com/api/v2/channels/...`) and the public 7TV API (`https://7tv.io/v3/...`). No authentication.
- **No build step.** Browser must execute the source as written. ES modules are used directly via `<script type="module">`.
- **Single channel per browser source instance.** The `?kick=` query parameter is set once at load and never changes.

## Primary user

A single Kick.com streamer who:

- Already uses OBS (or similar).
- Wants their chat visible on stream without paying for a third-party widget.
- Is comfortable editing CSS variables but not necessarily JavaScript.

## Success criteria

- Browser-source URL → live chat visible within ~2 seconds of stream load.
- New chat messages appear within one frame of the underlying WebSocket event.
- Network drops trigger automatic reconnect; the streamer never has to refresh.
- Theme commands (`!nightmode` / `!daymode`) work from chat without page reload.

## See also

- [System architecture](system-architecture.md) — how the modules wire together
- [Configuration guide](configuration-guide.md) — what's tunable
- [Codebase summary](codebase-summary.md) — file inventory
