# Fix run — 2026-06-13 02:08 EDT

Resolved every known issue surfaced by the prior learn run, plus two
follow-ups raised mid-session:

1. **`fadeRemoveMessage` undeclared globals** (`914285d`) — declared
   `fadeURL` and `fadeTimeURL` at the top of `js/chat.js`, driven by the
   `fade` and `fadeTime` URL params.
2. **`css/day.css` missing** (`566b12d`) — created light theme so the
   `!daymode` mod command no longer 404s.
3. **`assets/subscriber.svg` missing** (`d18c4cf`) — added a purple-star
   fallback used by channels with no sub-badge tiers configured.
4. **Dead `userId` export** (`312f103`) — removed from `js/ws.js` and
   dropped the matching unused import in `js/7tv.js`.
5. **Badge resilience** (`a4345b6`) — `js/chat.js` now renders badges
   with a progressive fallback chain (`type_count.svg` → `type.svg` →
   `assets/badge_generic.svg`) and logs unknown badge types once per
   session. Added `assets/badge_generic.svg`. Handles Kick's growing
   tier of level badges without broken images.
6. **Front-page detection** (`1a0c4a7`) — added `alertFrontpage` (blue
   gradient) and four candidate event-name matches in `js/ws.js`. The
   real event name is undocumented; the existing `Unknown event:`
   console logger surfaces the actual name if Kick uses a fifth one.

## Honest caveats

- Kick's WebSocket event names for sub/gift/raid/Kicks/front-page are
  not officially documented. Handlers use best-guess names — verify
  in production by triggering each event and watching the browser
  console for `Unknown event:` lines.
- Not live-tested in OBS or against an active stream.
