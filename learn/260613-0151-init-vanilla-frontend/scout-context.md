# Scout Context — 2026-06-13 01:51 EDT

Reference snapshot of what the scout phase observed. Useful for incremental runs to compare against.

## Repository state at scout time

- **Branch:** main
- **Latest commit:** `d90d68d correct username` (2025-02-09)
- **Total files (excl. .git/node_modules):** 22
- **Languages:** HTML, CSS, JavaScript (ES2020+ modules)
- **Build tooling:** None
- **Dependency manifests:** None (no package.json, Cargo.toml, etc.)
- **Tests / test config:** None

## File inventory at scout time

```
README.md                  (1 line — placeholder)
index.html                 (33 lines)
css/style.css              (200 lines)
css/night.css              (21 lines)
js/ws.js                   (263 lines)
js/chat.js                 (419 lines)
js/7tv.js                  (40 lines)
assets/founder.svg
assets/moderator.svg
assets/og.svg
assets/staff.svg
assets/sub_gifter.svg
assets/sub_gifter_25.svg
assets/sub_gifter_50.svg
assets/sub_gifter_100.svg
assets/sub_gifter_200.svg
assets/thumbtack.svg
assets/verified.svg
assets/vip.svg
```

## Project classification

- **Type:** Browser-only single-page overlay (OBS browser source target)
- **Primary platform integration:** Kick.com (chat, channel API)
- **Secondary integration:** 7TV (emote sets)
- **No backend, no auth, no persistent storage**

## External services depended on

- `https://kick.com/api/v2/channels/{name}` (REST)
- `wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?...` (WebSocket)
- `https://files.kick.com/emotes/{id}/fullsize` (image CDN)
- `https://dbxmjjzl5pc1g.cloudfront.net/.../emojis/{id}.png` (image CDN)
- `https://7tv.io/v3/users/kick/{userId}` (REST)
- `https://7tv.io/v3/emote-sets/global` (REST)
- Google Fonts (Raleway, Courier Prime)

## Issues discovered during scout

| Issue | Location | Status after run |
|-------|----------|------------------|
| Hardcoded default channel `queengloria` | `js/ws.js:9` | Fixed — channel is now required; setup screen on missing param |
| Hardcoded streamer name in title | `index.html:13` | Fixed — title is now generic |
| `!daymode` references non-existent `css/day.css` | `js/ws.js`, `js/chat.js` | Documented as known issue |
| `fadeRemoveMessage` references undeclared globals | `js/chat.js` | Documented as known issue |
| `userId` named export never assigned | `js/ws.js`, `js/7tv.js` | Documented as known issue (dead export, not a runtime bug) |
| Missing `assets/subscriber.svg` referenced as fallback | `js/chat.js` | Documented |
| No sub/gift/raid/Kicks alerts | All files | Added in this run |
| Duplicate `addEventListener("message")` at module bottom | `js/ws.js:262` | Fixed in this run |

## Module dependency graph (pre-run)

```
index.html
   ├── css/style.css
   ├── css/night.css
   ├── js/ws.js   (side-effect: opens WebSocket on import)
   ├── js/7tv.js
   └── js/chat.js
```

## Module dependency graph (post-run)

```
index.html
   ├── css/style.css
   ├── css/night.css
   ├── js/alerts.js   (NEW)
   ├── js/ws.js   (side-effect: opens WebSocket on import; or renders setup screen)
   ├── js/7tv.js
   └── js/chat.js
```
