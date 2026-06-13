// Alert system for chat-dock — handles raid/host, subscription, gifted-sub,
// and Kicks-gifting popups. Alerts stack vertically and auto-dismiss.
//
// Kick.com WebSocket event names aren't officially documented, so the
// handlers below use the best-known names. An "unknown event" logger in
// ws.js will print anything we don't recognize, making it easy to spot
// when an event has been renamed by the platform.

const ALERT_DISPLAY_MS = 8000;   // Time alert is fully visible
const ALERT_FADE_MS = 1000;      // Fade-out duration after display

const alertContainer = document.getElementById("alert-container");

function pushAlert(typeClass, innerHTML) {
  if (!alertContainer) return;

  const el = document.createElement("div");
  el.className = `alert ${typeClass}`;
  el.innerHTML = innerHTML;

  // Newest alerts on top — prepend, don't append
  alertContainer.prepend(el);

  // Fade out, then remove
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

export function alertSubscription({ username, months }) {
  const m = Number(months) || 1;
  const headline = m > 1
    ? `${escapeHtml(username)} resubscribed!`
    : `${escapeHtml(username)} subscribed!`;
  const sub = m > 1 ? `${m} months in a row` : "Welcome to the sub club";
  pushAlert(
    "alert-subscription",
    `<div class="alert-icon">★</div>
     <div class="alert-body">
       <div class="alert-headline">${headline}</div>
       <div class="alert-sub">${sub}</div>
     </div>`
  );
}

export function alertGiftedSubs({ gifter, count, recipients }) {
  const n = Number(count) || (recipients ? recipients.length : 1);
  const gifterName = gifter ? escapeHtml(gifter) : "Anonymous";
  pushAlert(
    "alert-gift",
    `<div class="alert-icon">🎁</div>
     <div class="alert-body">
       <div class="alert-headline">${gifterName} gifted ${n} sub${n === 1 ? "" : "s"}!</div>
       <div class="alert-sub">Thank you for the generosity</div>
     </div>`
  );
}

export function alertRaid({ raider, viewers }) {
  const v = Number(viewers) || 0;
  const raiderName = escapeHtml(raider || "A streamer");
  const tail = v > 0 ? ` with ${v} viewer${v === 1 ? "" : "s"}` : "";
  pushAlert(
    "alert-raid",
    `<div class="alert-icon">⚔</div>
     <div class="alert-body">
       <div class="alert-headline">${raiderName} is raiding${tail}!</div>
       <div class="alert-sub">Welcome the raid party</div>
     </div>`
  );
}

export function alertKicksGift({ sender, amount, message }) {
  const amt = Number(amount) || 0;
  const senderName = escapeHtml(sender || "Someone");
  const note = message ? `<div class="alert-sub">${escapeHtml(message)}</div>` : "";
  pushAlert(
    "alert-kicks",
    `<div class="alert-icon">⚡</div>
     <div class="alert-body">
       <div class="alert-headline">${senderName} sent ${amt} Kick${amt === 1 ? "" : "s"}!</div>
       ${note}
     </div>`
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
