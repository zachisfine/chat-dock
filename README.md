# chat-dock

A live chat overlay for [Kick.com](https://kick.com) streamers. Browser-only — no backend, no install, no account. Load it as a browser source in your broadcasting software and you'll see chat, badges, pinned messages, 7TV emotes, and on-stream alerts for new subs, gifted subs, raids, and Kicks tips.

Designed to be used by **any** Kick streamer — just point the overlay at your channel via a URL parameter.

---

## Quick start

1. Clone or download this repository.
2. Serve it from a static host **or** open `index.html` directly from disk.
3. Append `?kick=<your-channel-name>` to the URL.

```
file:///path/to/chat-dock/index.html?kick=yourchannelname
```

If you open the page without `?kick=`, you'll get a setup screen telling you what's missing.

### Optional URL parameters

| Param | Default | What it does |
|-------|---------|--------------|
| `kick` | *(required)* | Your Kick.com channel name, lowercase, no `@`. |
| `minKicks` | `0` | Minimum Kicks-tip amount that fires an on-screen alert. Set higher to suppress small tips. Example: `&minKicks=100`. |

Full URL example:

```
https://your-host.example/chat-dock/index.html?kick=yourchannelname&minKicks=50
```

---

## Features

- **Live chat** via Kick's public WebSocket (Pusher).
- **Badges** — subscriber tiers (uses your channel's actual sub-badge tiers), moderator, VIP, founder, verified, staff, OG, plus tiered sub-gifter icons (1-24, 25-49, 50-99, 100-199, 200+).
- **7TV emotes** — both your channel set and the global set.
- **Kick's native emotes & emojis**, plus auto-linkification of URLs.
- **Pinned messages** — appear at the top with a thumbtack icon; auto-removed when the streamer un-pins.
- **Banned users** — when a user is banned, every one of their visible messages is removed retroactively.
- **`!nightmode` / `!daymode`** style toggle (moderator or broadcaster only).
- **Auto-reconnect** — dropped WebSocket triggers a 1-second retry loop; you never need to refresh the browser source.
- **Stacking alerts** at the top of the overlay for:
  - 🟣 **New subscriptions** (and resubs with month count)
  - 🌸 **Gifted subs** (single or bulk)
  - 🟢 **Raids / hosts** (with incoming viewer count)
  - 🟡 **Kicks tips** (with configurable minimum threshold)

Alerts stack vertically when multiple events arrive close together, animate in from the top, and fade themselves out after ~8 seconds.

---

## FAQ — Integrating with your streaming software

### How do I add it to OBS Studio?

1. In your scene, click **+** in the Sources panel → **Browser**.
2. Name it "Chat Dock" and click OK.
3. In the source properties:
   - **URL:** point at where you're hosting `index.html`, with `?kick=yourchannelname` (and `&minKicks=…` if you want).
     - Hosted: e.g. `https://your-host.example/chat-dock/index.html?kick=you`
     - Local file: drop the full `file:///` path, or use OBS's "Local File" checkbox and browse to `index.html`, then put `?kick=you` in the **URL bar** that appears.
   - **Width / Height:** match the region of the screen you want chat to occupy (e.g. `400 × 800` for a vertical sidebar).
   - **Custom CSS:** leave blank — `style.css` already handles everything. If you want to override, see [`docs/design-guidelines.md`](docs/design-guidelines.md).
   - **Refresh browser when scene becomes active:** ✅ recommended. Forces a clean WebSocket connect every time you switch to the scene.
   - **Shutdown source when not visible:** ✅ optional. Saves resources when the overlay isn't on screen.
4. Position and resize the source in your scene. Done.

If chat doesn't appear, open OBS's **View → Docks → Browser Source Interaction**, or hit the source's "Refresh cache of current page" button. Browser console output (visible via the Interact panel's right-click → Inspect on Windows OBS) will tell you whether the WebSocket connected.

### How do I add it to Meld Studio?

Meld Studio supports web overlays through its **Web Source** layer.

1. In Meld, add a new **Web Source** to your scene.
2. Paste in the same URL you'd use for OBS, including `?kick=yourchannelname`.
3. Set the source dimensions to match the overlay region you want.
4. Pin the source on top of your camera / game layer.

Meld's Web Source uses a Chromium engine identical (in capability) to OBS's browser source, so the overlay behaves the same way — alerts, emotes, and WebSocket reconnection all work without changes.

Meld doesn't expose a "refresh on scene activate" toggle in the same place OBS does. If your overlay ever desyncs, simply right-click the Web Source → Reload.

### Can I use it with Streamlabs Desktop / XSplit / vMix?

Yes. They all expose a browser-source equivalent:

- **Streamlabs Desktop** — Sources → **Browser Source**. Identical flow to OBS.
- **XSplit Broadcaster** — Add source → **Webpage**. Set the URL with `?kick=`.
- **vMix** — Add input → **Web Browser**. Set the URL with `?kick=`. For vMix, tick "Use OpenGL" if alerts animate jerkily.

### How do I use it while streaming from my iPhone?

This is the tricky one. Mobile streaming apps generally **don't have a "browser source" concept**, because the overlay is rendered into the broadcast on-device.

You have three realistic options, ordered by quality:

**Option A — Stream from your phone, composite the overlay on a desktop relay (best quality).**

1. Stream from the iPhone using an app like [Larix Broadcaster](https://softvelum.com/larix/) or [Prism Live Studio](https://prismlive.com/) configured to send RTMP to a local PC running an RTMP server (NGINX-RTMP, OBS Studio's built-in RTMP listener via the WHIP plugin, or Restream).
2. On the PC, pull that RTMP into OBS as a **Media Source** (URL).
3. Add chat-dock as a Browser Source in OBS on top of the camera feed.
4. Stream the composited result from OBS to Kick.

This adds 2-4 seconds of latency but gives you the full overlay quality.

**Option B — Camera-link app + desktop OBS (lowest latency).**

Use [Camo](https://reincubate.com/camo/) or [EpocCam](https://www.elgato.com/us/en/p/epoccam) to expose the iPhone's camera as a webcam to your PC. Then build the whole stream in desktop OBS with chat-dock as a browser source. The phone is just a camera, not the encoder.

**Option C — Screen recording on a second device (poor person's overlay).**

Open `index.html?kick=you` on a tablet or second phone. Use a small mobile-friendly window. In Streamlabs Mobile / Prism Live, add the tablet's HDMI output (via a USB capture adapter) as a video source. Crop down to just the chat region. Works, but adds hardware cost.

> ⚠️ The Kick mobile apps themselves do **not** support custom overlays. The overlay is something you composite *before* you hit "go live."

### How do I use it while streaming from Android?

Same three options as iPhone. The recommended path is still **a desktop relay** because Android mobile streaming apps share the same limitation — no browser source.

Android-specific notes:

- **Prism Live Studio** has the most flexible overlay support of any mobile app, but it expects PNG/GIF overlays, not live web content. You'd need to "fake" chat-dock by piping it through a desktop OBS instance and re-encoding.
- **Streamlabs Mobile** lets you composite *Streamlabs widgets*, but custom HTML/JS browser sources aren't accepted. chat-dock is a custom browser source, so this won't work directly.
- **Mobcrush / OmletArcade** — chat-dock isn't natively supported. Same desktop-relay workaround applies.

If you stream from Android, the most popular setup is: phone → USB capture → laptop running OBS → laptop streams to Kick. chat-dock then slots into the laptop's OBS exactly like a desktop streamer.

### Why isn't an alert firing for sub/gift/raid events on my channel?

Kick's WebSocket event names aren't officially documented and occasionally shift. chat-dock listens for the best-known names and logs everything it doesn't recognise to the browser console as `Unknown event: <name>`. To investigate:

1. Open the browser source's DevTools (in OBS: right-click the source → Interact, then F12 / right-click → Inspect on Windows).
2. Trigger the event (have a friend gift a sub, or wait for one in the wild).
3. Look for `Unknown event: ...` in the console.
4. Copy that event name into the matching `if (messageData.event === "...")` branch in `js/ws.js`.

This is a known limitation of building on an unofficial WebSocket — flagged in [`docs/system-architecture.md`](docs/system-architecture.md).

### Can I change the look of the alerts / chat?

Yes. All styling lives in `css/style.css`. Look for the `--font-*`, `--chat-*`, and `--transparent-color` CSS variables near the top, plus the `.alert`, `.alert-subscription`, `.alert-gift`, `.alert-raid`, and `.alert-kicks` rules further down. See [`docs/design-guidelines.md`](docs/design-guidelines.md).

### Does it support Twitch?

No — Kick.com only. The WebSocket endpoint, badge schema, and emote API are all Kick-specific.

---

## Project layout

```
chat-dock/
├── index.html        # Entry — loads CSS + 4 ES modules
├── css/
│   ├── style.css     # Base styles, CSS variables, alert styling
│   └── night.css     # Night-theme overrides (loaded by default)
├── js/
│   ├── alerts.js     # Stacking alert UI + setup screen
│   ├── ws.js         # Kick WebSocket + REST channel lookup + event router
│   ├── chat.js       # DOM rendering for messages, badges, pins
│   └── 7tv.js        # 7TV emote-set fetcher
└── assets/           # Badge SVGs + pin icon
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [Project overview / PDR](docs/project-overview-pdr.md) | Goals, scope, constraints |
| [Codebase summary](docs/codebase-summary.md) | File-by-file inventory |
| [System architecture](docs/system-architecture.md) | Module graph, data flow, Mermaid diagrams |
| [Code standards](docs/code-standards.md) | Conventions used in this repo |
| [Design guidelines](docs/design-guidelines.md) | Visual styling and CSS structure |
| [Configuration guide](docs/configuration-guide.md) | URL params, CSS variables, theme switching |
| [Changelog](docs/changelog.md) | Notable commits |

## Known issues

- Kick's WebSocket event names for subscriptions, gifts, raids, Kicks tips, and front-page features are **not officially documented**. The handlers in `js/ws.js` use best-guess names; if an alert never fires, check the browser console for `Unknown event:` lines and copy that event name into the matching handler.

## License

No license file is committed. Treat as "all rights reserved" until the owner adds one.
