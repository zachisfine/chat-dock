// Alert system for chat-dock — handles raid/host, subscription, gifted-sub,
// and Kicks-gifting popups. Alerts stack vertically and auto-dismiss.
//
// Kick.com WebSocket event names aren't officially documented, so the
// handlers below use the best-known names. An "unknown event" logger in
// ws.js will print anything we don't recognize, making it easy to spot
// when an event has been renamed by the platform.

const ALERT_DISPLAY_MS = 12000;  // Time alert is fully visible (one marquee loop)
const ALERT_FADE_MS = 600;       // Fade-out duration after display

const alertContainer = document.getElementById("alert-container");

// Build a slim marquee-style alert. `body` is plain HTML (already
// escaped at call site) — wrapped in .alert-content so the CSS keyframe
// scrolls it right-to-left across the bar.
function pushAlert(typeClass, body) {
  if (!alertContainer) return;

  const el = document.createElement("div");
  el.className = `alert ${typeClass}`;
  el.innerHTML = `<span class="alert-content">${body}</span>`;

  // Newest alerts on top — prepend, don't append
  alertContainer.prepend(el);

  setTimeout(() => {
    el.classList.add("alert-out");
    setTimeout(() => el.remove(), ALERT_FADE_MS);
  }, ALERT_DISPLAY_MS);
}

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function line(icon, headline, sub) {
  const subHtml = sub ? `<span class="alert-sub">${sub}</span>` : "";
  return `<span class="alert-icon">${icon}</span>${headline}${subHtml}`;
}

export function alertSubscription({ username, months }) {
  const m = Number(months) || 1;
  const headline = m > 1
    ? `${escapeHtml(username)} resubscribed!`
    : `${escapeHtml(username)} subscribed!`;
  const sub = m > 1 ? `${m} months in a row` : "Welcome to the sub club";
  pushAlert("alert-subscription", line("★", headline, sub));
}

export function alertGiftedSubs({ gifter, count, recipients }) {
  const n = Number(count) || (recipients ? recipients.length : 1);
  const gifterName = gifter ? escapeHtml(gifter) : "Anonymous";
  pushAlert(
    "alert-gift",
    line("🎁", `${gifterName} gifted ${n} sub${n === 1 ? "" : "s"}!`, "Thank you for the generosity")
  );
}

export function alertRaid({ raider, viewers }) {
  const v = Number(viewers) || 0;
  const raiderName = escapeHtml(raider || "A streamer");
  const tail = v > 0 ? ` with ${v} viewer${v === 1 ? "" : "s"}` : "";
  pushAlert(
    "alert-raid",
    line("⚔", `${raiderName} is raiding${tail}!`, "Welcome the raid party")
  );
}

export function alertKicksGift({ sender, amount, message }) {
  const amt = Number(amount) || 0;
  const senderName = escapeHtml(sender || "Someone");
  pushAlert(
    "alert-kicks",
    line("⚡", `${senderName} sent ${amt} Kick${amt === 1 ? "" : "s"}!`, message ? escapeHtml(message) : "")
  );
}

export function alertFrontpage({ position } = {}) {
  const pos = Number(position);
  const tail = Number.isFinite(pos) && pos > 0 ? ` at position #${pos}` : "";
  pushAlert(
    "alert-frontpage",
    line("★", `Featured on the front page${tail}!`, "New viewers incoming")
  );
}

// ---------------------------------------------------------------------------
// Setup screen — rendered when no ?kick= channel parameter is supplied.
// ---------------------------------------------------------------------------
export function showSetupScreen() {
  const chat = document.getElementById("chat-container");
  if (!chat) return;
  chat.innerHTML = `
    <div class="setup-screen">
      <h1>chat-dock</h1>
      <p>Add <code>?kick=&lt;channel&gt;</code> to the URL to begin.</p>
      <p class="setup-example">
        Example:<br>
        <code>${window.location.href.split("?")[0]}?kick=yourchannelname</code>
      </p>
      <p class="setup-hint">
        Optional: <code>&amp;minKicks=100</code> to only alert on Kicks gifts of 100 or more.
      </p>
    </div>
  `;
}
