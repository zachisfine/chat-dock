# Design Guidelines

The overlay is meant to sit on top of a stream feed without overwhelming it. Visuals lean on transparency, bold typography, and color-coded state. This doc describes the system so changes stay consistent.

## Visual philosophy

- **Legibility over decoration.** Streamers read chat at a glance — usernames and messages get heavy weights (900 for username, 700 for monospace timestamp).
- **Subtle in default state, loud in event state.** Regular messages are minimal. Pinned messages, raids, gifted subs, and Kicks tips get strong colors and animation.
- **Themable via CSS variables.** No hardcoded fonts or colors in JS. All knobs live in `:root`.

## CSS variables

Defined in `css/style.css`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `--font` | `'Raleway', sans-serif` | Body font |
| `--font-size` | `20px` | Base chat font size |
| `--font-case` | `none` | `uppercase` / `lowercase` / `none` |
| `--font-color` | `#ffffff` | Default chat text color |
| `--font-shadow` | `var(--font-shadow-1)` | Currently `none`; swap to `--font-shadow-2/3/4` for stronger drop shadows over busy backgrounds. |
| `--chat-width` | `100%` | Width of `#container` |
| `--chat-height` | `100vh` | Height of `#container` |
| `--transparent-color` | `rgba(0, 0, 0, 0.6)` | Reserved for pop-ups (not yet used; available for custom rules) |

To customize without touching the source, append a `<style>` block to `index.html` overriding the variables, or edit `style.css` directly.

## Type system

Two web fonts are loaded from Google Fonts:

- **Raleway** (400, 700, 800, 900) — display / body. Username uses 900, message text uses bold.
- **Courier Prime** (400, 700) — monospace timestamp. Slightly negative letter-spacing keeps `HH:MM` compact.

## Color palette

| Surface | Color | Where |
|---------|-------|-------|
| Background (night theme) | `#000000` | `night.css` body |
| Pinned message | `#1a1a1a` (style.css) or `#008b01` (night.css override) | `.pinned-message` |
| `@streamer` highlight | `rgba(169, 71, 211, 0.4)` purple | `.atStreamer` |
| Moderator message | `rgba(5, 209, 255, 0.4)` cyan | `.moderator` |
| Subscription alert | `linear-gradient(135deg, #6a3df0, #a64aff)` purple | `.alert-subscription` |
| Gift alert | `linear-gradient(135deg, #d33c8a, #ff7eb3)` pink | `.alert-gift` |
| Raid alert | `linear-gradient(135deg, #14a06e, #4be19e)` green | `.alert-raid` |
| Kicks tip alert | `linear-gradient(135deg, #f0a72b, #ffd24a)` gold | `.alert-kicks` |

Keep contrast against likely backgrounds (game footage, IRL camera) in mind — that's why every alert ships with a `box-shadow` and a thin white border.

## Layout

```
┌─ #alert-container (fixed, top, z=100) ─────────────────┐
│  newest alert                                           │
│  older alert                                            │
│  (stacked vertically, prepend on push)                  │
└─────────────────────────────────────────────────────────┘
┌─ #container (scrolling, column-reverse) ───────────────┐
│  ┌─ .pinned-message (absolute, top:10) ─────────────┐  │
│  │  pinned chat goes here                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ #chat-container (column flex, gap .5em) ────────┐  │
│  │  most-recent message                              │  │
│  │  …                                                │  │
│  │  oldest visible message                           │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

`#container` uses `flex-direction: column-reverse` so new messages appended at the end appear at the bottom (the natural reading position for chat). The scroll position stays pinned to the newest message without scripting.

## Animation

- **Alerts** use a spring-style cubic-bezier on the way in (`cubic-bezier(0.2, 0.9, 0.3, 1.2)`) and a smooth ease on the way out (1s). Display duration is 8s.
- **Messages** don't currently animate in. If you want a fade-in, add an `animation: fadeIn ...` on `.message-item` — the `@keyframes fadeIn` is already declared in `style.css` waiting to be applied.

## Special message states

| State | Visual | Triggered by |
|-------|--------|-------------|
| `.dimmed` | Reduced opacity | Sender is not a sub, VIP, or sub-gifter |
| `.atStreamer` | Purple highlight | Message includes `@channel-owner` |
| `.atChat` | `display:none` (currently hidden) | Message includes `@` but not the streamer. Make visible if you want to see all @-mentions. |
| `.bot` | `display:none` | Sender username is in the bot allowlist in `chat.js` |
| `.moderator` | Cyan highlight | Sender has the moderator badge |
| `.pinned-message` | Top-pinned card | `PinnedMessageCreatedEvent` |
| `.commands` | `display:none` (rule exists but commented out) | Was for `!command` messages. Re-enable the marker in `chat.js` to use it. |

## Customizing badges

Badge SVGs live in `assets/`. To support a new badge type that Kick adds:

1. Drop a new SVG at `assets/{badge-type}.svg`.
2. `chat.js`'s badge loop automatically uses `assets/{badge-type}.svg` for unknown types, so no JS change is needed for plain badges.
3. For tiered badges (like `sub_gifter` 1-200+), add a new tier branch in both `createMessage` and `createPinnedMessage` in `chat.js`.

## Adding a new theme

The night theme (`css/night.css`) is loaded by default via `<link id="night-mode">`. The `!nightmode` / `!daymode` chat commands swap the `href`.

To add a third theme:

1. Drop `css/your-theme.css` overriding the variables you want.
2. Add an `if (messageContent === "!yourtheme")` branch in `ws.js`'s `ChatMessageEvent` handler that calls `document.getElementById("night-mode").setAttribute("href", "css/your-theme.css")`.
3. Restrict to moderators/broadcaster by reusing the same badge check pattern that `!nightmode` uses.

> ⚠️ `!daymode` currently points to `css/day.css`, which doesn't exist. Either create that file or change the path before relying on the command.

## See also

- [Configuration guide](configuration-guide.md) — URL params and CSS variable overrides
- [Code standards](code-standards.md) — JS / CSS conventions
