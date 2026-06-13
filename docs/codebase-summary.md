# Codebase Summary

A flat, static-file project with no build tooling, no package manager, and no tests. Total size: ~22 files, ~700 LOC of source.

## File inventory

### Entry point

| File | LOC | Purpose |
|------|----|---------|
| `index.html` | ~33 | Loads `css/style.css`, `css/night.css`, and the three ES module scripts. Hosts the `#container` and `#chat-container` DOM nodes. |

### JavaScript (ES modules, no bundler)

| File | LOC | Purpose |
|------|----|---------|
| `js/ws.js` | ~263 | Opens the Kick WebSocket (Pusher), fetches channel info via REST, routes incoming events (`ChatMessageEvent`, `MessageDeletedEvent`, `UserBannedEvent`, `PinnedMessageCreatedEvent`, `PinnedMessageDeletedEvent`). Handles auto-reconnect. Also implements the `!nightmode` / `!daymode` style toggle. |
| `js/chat.js` | ~419 | All DOM construction: `createMessage`, `createPinnedMessage`, `prependMessage`, `removeChatMessage`, `removeExcessMessages`, `fadeRemoveMessage`. Owns the emote-replacement pipeline (Kick emotes, Kick emojis, link wrapping, 7TV emote substitution) and badge rendering (subscriber tiers, sub-gifter tiers, all other badges). |
| `js/7tv.js` | ~40 | Fetches the 7TV channel emote set and global emote set in parallel, then populates the shared `sevenTVEmotes` array used by `chat.js`. |

### CSS

| File | LOC | Purpose |
|------|----|---------|
| `css/style.css` | ~200 | Base styles. Defines CSS variables (`--font-size`, `--chat-width`, `--font-shadow`, `--transparent-color`, etc.). Lays out the chat container, message grid, badges, and special states (`atStreamer`, `moderator`, `bot`, `pinned-message`). |
| `css/night.css` | ~21 | Theme override loaded by default via the `#night-mode` `<link>` element. Sets background to black and tweaks a few backgrounds/radii. |

### Assets — badge icons

All inside `assets/`, all SVG:

`founder.svg`, `moderator.svg`, `staff.svg`, `verified.svg`, `vip.svg`, `og.svg`, `thumbtack.svg` (used as the pinned-message icon), and a sub-gifter tier series: `sub_gifter.svg`, `sub_gifter_25.svg`, `sub_gifter_50.svg`, `sub_gifter_100.svg`, `sub_gifter_200.svg`.

Note: `chat.js` falls back to `assets/subscriber.svg` if a channel has no subscriber badges, but **this file is not present in the repo**. Channels without sub badges will see broken images for subscribers.

## Key external dependencies

This project has **no `package.json`** — there are no installed dependencies. It does, however, depend on these third-party HTTP services at runtime:

| Service | URL | Purpose |
|---------|-----|---------|
| Kick channel API | `https://kick.com/api/v2/channels/{name}` | Channel info: chatroom ID, sub badges, user ID |
| Kick Pusher | `wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?...` | Live chat events |
| Kick emote CDN | `https://files.kick.com/emotes/{id}/fullsize` | Kick emote images |
| Kick emoji CDN | `https://dbxmjjzl5pc1g.cloudfront.net/.../emojis/{id}.png` | Kick emoji images |
| 7TV channel emotes | `https://7tv.io/v3/users/kick/{userId}` | Channel-specific 7TV emote set |
| 7TV global emotes | `https://7tv.io/v3/emote-sets/global` | Global 7TV emote set |
| Google Fonts | `Raleway`, `Courier Prime` | Display + monospace fonts |

If any of those services change their API shape or move, this overlay can break with no warning.

## Module dependency graph

```
index.html
   ├── css/style.css
   ├── css/night.css            (id="night-mode")
   ├── js/ws.js   ──────────── opens WebSocket on import
   │      ├── imports prependMessage, removeChatMessage,
   │      │           createPinnedMessage  ← from chat.js
   │      └── imports fetch7TVEmotes       ← from 7tv.js
   ├── js/7tv.js
   │      └── imports userId               ← from ws.js (never set, see Known Issues)
   └── js/chat.js
          ├── imports kickChannel, subBadges  ← from ws.js
          └── imports sevenTVEmotes           ← from 7tv.js
```

The three scripts are tagged `async defer type="module"`, so the browser dedupes imports and loads them as a graph rather than in script-tag order. `ws.js` opens its socket as a side effect at module-load time.

See [`system-architecture.md`](system-architecture.md) for diagrams of the runtime flow.

## See also

- [System architecture](system-architecture.md)
- [Code standards](code-standards.md)
- [Configuration guide](configuration-guide.md)
