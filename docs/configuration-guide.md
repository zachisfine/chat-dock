# Configuration Guide

chat-dock has a deliberately tiny config surface: **URL query parameters** for runtime behavior and **CSS variables** for appearance. There is no settings file, no env vars, no admin panel.

## URL query parameters

Read inside `js/ws.js` at module-load time.

| Param | Required? | Type | Default | Purpose |
|-------|-----------|------|---------|---------|
| `kick` | **Yes** | string | *(none)* | Kick.com channel name. Lowercase, no `@` prefix. If missing, the overlay renders a setup screen instead of connecting. |
| `minKicks` | No | integer | `0` | Minimum Kicks-tip amount that fires an on-screen alert. `0` means show all tips. Non-numeric values are ignored. |

### Examples

Basic:

```
index.html?kick=yourchannelname
```

With a Kicks threshold of 100:

```
index.html?kick=yourchannelname&minKicks=100
```

Hosted on a static host:

```
https://your-host.example/chat-dock/index.html?kick=yourchannelname&minKicks=50
```

### What happens when `kick` is missing

`js/ws.js` calls `showSetupScreen()` from `alerts.js`, which replaces the `#chat-container` with a card explaining the required parameter and showing an example URL. The WebSocket is never opened, so DevTools stays quiet.

### What happens when `minKicks` is invalid

If the value can't be parsed as a non-negative integer (e.g. `?minKicks=abc`), it falls back to `0`. No error.

## CSS variables

Defined at the top of `css/style.css` inside `:root`. Override by either:

1. **Editing `style.css` directly.** Simplest.
2. **Adding a `<style>` block to `index.html`** that re-declares the variables you want to change. Survives `git pull` cleanly.

| Variable | Default | Notes |
|----------|---------|-------|
| `--font` | `'Raleway', sans-serif` | Any web-safe or loaded font |
| `--font-size` | `20px` | Per-message base size; messages scale via `1.2em` |
| `--font-case` | `none` | `uppercase` for caps-only, `lowercase`, or `none` |
| `--font-color` | `#ffffff` | Default text color for chat |
| `--font-shadow` | `var(--font-shadow-1)` | One of 4 preset shadows (1=none, 4=heaviest) |
| `--chat-width` | `100%` | Width of the chat container |
| `--chat-height` | `100vh` | Height of the chat container |
| `--transparent-color` | `rgba(0, 0, 0, 0.6)` | Reserved utility color |

## Themes

Two stylesheets are loaded by default:

- `css/style.css` — base styles (always loaded)
- `css/night.css` — theme override, loaded via `<link id="night-mode" href="css/night.css">`

The `id="night-mode"` link is the swap target for the in-chat theme commands:

| Command | Effect | Who can run it |
|---------|--------|----------------|
| `!nightmode` | Sets the `#night-mode` link to `css/night.css` | Moderators and the broadcaster |
| `!daymode` | Sets the `#night-mode` link to `css/day.css` | Moderators and the broadcaster |

> ⚠️ `css/day.css` does not exist in the repo. Until you add it, `!daymode` will 404 and the overlay will look unstyled in light mode. See [`design-guidelines.md#adding-a-new-theme`](design-guidelines.md).

## Bot exclusion list

Hardcoded in `js/chat.js` as `excludedKickBots`. Messages from any username in this list are tagged with the `.bot` class, which is `display: none` by default.

To add a bot: add the username (lowercase) to the array. To show bot messages: remove `display: none` from the `.bot` rule in `style.css`.

## Browser-source sizing (OBS / Meld / etc.)

The overlay is fluid — `--chat-width` and `--chat-height` are 100% / 100vh. The size you set on the browser source is the size the overlay uses. Practical recipes:

- **Tall sidebar:** width `420`, height `1080`. Set `--font-size: 22px`.
- **Bottom strip:** width `1920`, height `260`. Set `--font-size: 28px` and add `padding-bottom: 2em` to `#chat-container` so the newest message isn't flush with the edge.
- **Mobile-style narrow:** width `360`, height `640`. Default font size is fine.

## See also

- [Design guidelines](design-guidelines.md) — what each variable affects visually
- [System architecture](system-architecture.md) — how params are consumed
- [README](../README.md) — FAQ for OBS/Meld/mobile integration
