import { fetch7TVEmotes } from "./7tv.js";
import {
  prependMessage,
  removeChatMessage,
  createPinnedMessage,
  markDeleted
} from "./chat.js";
import {
  alertSubscription,
  alertGiftedSubs,
  alertRaid,
  alertKicksGift,
  alertFrontpage,
  alertModeration,
  showSetupScreen
} from "./alerts.js";

const urlParams = new URLSearchParams(window.location.search);
export const kickChannel = urlParams.get("kick");

// Minimum Kicks gift amount that fires an alert. 0 means show every gift.
// Override via ?minKicks=N — non-numeric values fall back to 0.
const parsedMinKicks = parseInt(urlParams.get("minKicks"), 10);
export const minKicksAlert = Number.isFinite(parsedMinKicks) && parsedMinKicks >= 0
  ? parsedMinKicks
  : 0;

export let subBadges;

let kickWS = null;

// Kick no longer ships a static Pusher app key. Each client asks Kick for one
// via POST /api/v1/realtime/connection. That host sends no CORS headers for
// third-party origins (GitHub Pages, Netlify, file://…), so browser fetches of
// it are blocked. When that happens we fall back to the last known-good key.
const realtimeConnectionUrl =
  "https://web.kick.com/api/v1/realtime/connection";
const fallbackPusherCredentials = {
  appKey: "34bf7a0ff419a2a775b9",
  cluster: "us2"
};

let reconnectTimer = null;
let reconnectAttempts = 0;
let socketGeneration = 0;

function buildPusherUrl({ appKey, cluster }) {
  return `wss://ws-${cluster}.pusher.com/app/${appKey}?protocol=7&client=js&version=7.6.0&flash=false`;
}

function randomClientId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Ask Kick for the current Pusher app key/cluster. Falls back to the baked-in
// pair when the request is blocked (CORS) or the response shape changes.
async function resolvePusherCredentials() {
  try {
    const response = await fetch(realtimeConnectionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-platform": "web"
      },
      body: JSON.stringify({
        client: { id: randomClientId(), type: "web" },
        capabilities: { accepted_providers: [{ provider: "pusher" }] }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const connection = (payload?.data?.connections || []).find(
      (entry) => entry.provider === "pusher"
    );
    const appKey = connection?.credentials?.app_key;
    const cluster = connection?.credentials?.cluster;
    if (!appKey || !cluster) throw new Error("Pusher credentials missing");
    console.log("Fetched Pusher credentials from Kick.");
    return { appKey, cluster };
  } catch (error) {
    console.warn(
      "Could not fetch Pusher credentials, using fallback key:",
      error.message
    );
    return fallbackPusherCredentials;
  }
}

// Function to establish a WebSocket connection
async function connectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Each connect is a new generation; a slow credential lookup must not open a
  // socket after a newer connect has already started.
  const generation = ++socketGeneration;
  const credentials = await resolvePusherCredentials();
  if (generation !== socketGeneration) return;

  const ws = new WebSocket(buildPusherUrl(credentials));
  kickWS = ws;

  // Listen for open, error and close events
  ws.addEventListener("open", () => handleWebSocketOpen(ws));
  ws.addEventListener("error", () => handleWebSocketError(ws));
  ws.addEventListener("close", (event) => handleWebSocketClose(ws, event));
  ws.addEventListener("message", handleWebSocketMessage);
}

// Single reconnect path. Both `error` and `close` fire for the same failure, so
// we only act for the socket that is still current, and re-resolve credentials
// on every attempt — a rejected key must not be retried in a tight loop.
function scheduleReconnect(ws, reason) {
  if (kickWS !== ws) return;
  kickWS = null;

  const delay = Math.min(1000 * 2 ** reconnectAttempts, 15000);
  reconnectAttempts += 1;
  console.log(
    `WebSocket ${reason}. Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`
  );
  reconnectTimer = setTimeout(connectWebSocket, delay);
}

// Handle WebSocket open event. Opening is not proof of a healthy connection:
// Pusher accepts the handshake and only then rejects an invalid app key with a
// 4001 close. So the reconnect backoff is reset when a subscription actually
// succeeds (see handleWebSocketMessage), not here — otherwise a retired key
// would retry at a flat 1s forever.
async function handleWebSocketOpen(ws) {
  if (kickWS !== ws) return;

  // The channel lookup below awaits, so re-check afterwards: the socket may have
  // closed in the meantime, and sending then throws InvalidStateError.
  const channelInfo = await getChannelInfo();
  if (kickWS !== ws || ws.readyState !== WebSocket.OPEN) return;

  const chatroomId = channelInfo.chatroomId;
  ws.send(
    JSON.stringify({
      event: "pusher:subscribe",
      data: { auth: "", channel: `chatrooms.${chatroomId}.v2` }
    })
  );
  // Also subscribe to the channel-wide topic — this is where raid/host and
  // some subscription events get published on Kick.
  ws.send(
    JSON.stringify({
      event: "pusher:subscribe",
      data: { auth: "", channel: `channel.${channelInfo.channelId}` }
    })
  );
  console.log(
    "Connected to Kick.com Streamer Chat: " +
      kickChannel +
      " Chatroom ID: " +
      chatroomId
  );
}

// Fetch channel information and retrieve sub badges
async function getChannelInfo() {
  const response = await fetchData(
    `https://kick.com/api/v2/channels/${kickChannel}`
  );
  const data = await response.json();
  const chatroomId = data.chatroom.id;
  const channelId = data.id;
  const userId = data.user_id;
  subBadges = data.subscriber_badges || [];
  subBadges.sort((a, b) => (a.months > b.months ? 1 : -1));

  fetch7TVEmotes(userId);
  console.log("Kick Subscriber Badges:", subBadges); // Log the sub badges

  return { chatroomId, channelId, subBadges };
}

// Existing function to handle fetching data
async function fetchData(url) {
  let response;
  while (!response || !response.ok) {
    try {
      response = await fetch(url);
      if (!response.ok) {
        console.log("Error: " + response.status);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log("Error: " + error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return response;
}

// Handle WebSocket errors
function handleWebSocketError(ws) {
  scheduleReconnect(ws, "error");
}

// Handle WebSocket disconnection
function handleWebSocketClose(ws, event) {
  scheduleReconnect(ws, `closed (${event.code})`);
}

// Bootstrap: require a channel parameter. If missing, render setup help and
// don't try to connect — otherwise we'd spam the console with 404s.
if (!kickChannel) {
  showSetupScreen();
} else if (kickWS === null) {
  connectWebSocket();
}

// Handle WebSocket messages
function handleWebSocketMessage(event) {
  // Parse the message data as JSON
  let messageData = JSON.parse(event.data);

  // A successful subscription is the real "healthy connection" signal, so it is
  // where the reconnect backoff resets.
  if (messageData.event === "pusher_internal:subscription_succeeded") {
    reconnectAttempts = 0;
    return;
  }

  // Check if the message is a ChatMessageEvent
  if (messageData.event === "App\\Events\\ChatMessageEvent") {
    // Parse the data property as JSON
    let chatMessageData = JSON.parse(messageData.data);
    let messageID = chatMessageData.id;
    let messageType = chatMessageData.type;
    let chatMessageSender = chatMessageData.sender;
    let chatMessageBadges = chatMessageSender.identity.badges;
    console.log(chatMessageBadges);

    // Check if the messageType is "reply" and if the messageContent contains a mention of @kickChannel
    //if (
    //  messageType === "reply" &&
    //  !chatMessageData.content.includes(`@${kickChannel}`)
    //) {
      // If the messageType is "reply" and the messageContent doesn't contain a mention of @kickChannel,
      // exit the function without executing prependMessage
    //  return;
    //}

    let subscriberBadge = chatMessageBadges.find(
      (badge) => badge.type === "subscriber"
    );
    let subscriberAge = subscriberBadge ? subscriberBadge.count : 0;

    // Store the properties of the chatMessageData object in temporary variables
    let messageContent = chatMessageData.content;
    let messageUsername = chatMessageSender.username;
    // let messageCreatedAt = chatMessageData.created_at;
    let messageUserID = chatMessageSender.id;
    let senderColor = chatMessageSender.identity.color;
    let senderBadges = [];
    let subGifterCount = 0;

    // Check if the message contains the specific command and is from a moderator or owner
    if (
      (chatMessageBadges.some((badge) => badge.type === "moderator") ||
        chatMessageBadges.some((badge) => badge.type === "broadcaster")) &&
      (messageContent === "!nightmode" || messageContent === "!daymode")
    ) {
      // Update the link element based on the command
      if (messageContent === "!nightmode") {
        document.getElementById("night-mode").setAttribute("href", "css/night.css");
      } else if (messageContent === "!daymode") {
        document.getElementById("night-mode").setAttribute("href", "css/day.css");
      }
    }

    // Handle the subscriber badge separately (without count)
    if (subscriberAge > 0) {
      senderBadges.push("subscriber");
    }

    // Iterate over the badges array
    for (let badge of chatMessageBadges) {
      // Check if the badge is a sub_gifter and store the count
      if (badge.type === "sub_gifter") {
        senderBadges.push(`sub_gifter:${badge.count}`);
      } else if (badge.type !== "subscriber") {
        // Add the badge type to the senderBadges array (except for subscriber)
        senderBadges.push(badge.type);

        // Check if the badge has the 'count' property and add it to the senderBadges array
        if (badge.hasOwnProperty("count")) {
          senderBadges.push(`${badge.type}:${badge.count}`);
        }
      }
    }

    // Add the sub_gifter badge with the count as a single entry in the senderBadges array
    if (subGifterCount > 0) {
      senderBadges.push(`sub_gifter:${subGifterCount}`);
    }

    prependMessage(
      messageID,
      messageContent,
      messageUsername,
      senderColor,
      messageUserID,
      senderBadges,
      subscriberAge
    );
    return;
  }

  // Check if Message Deleted Event. Kick fires this for both manual
  // mod deletes and AI-mod ("AutoMod") actions. The payload sometimes
  // includes a `deleted_by` block; AI mod typically appears with no
  // human moderator or a system identifier. We use that signal to
  // distinguish the label shown on the lingering message.
  if (messageData.event === "App\\Events\\MessageDeletedEvent") {
    const DeleteMessageData = JSON.parse(messageData.data);
    const messageID = DeleteMessageData.message.id;
    const deletedBy = DeleteMessageData.deleted_by || DeleteMessageData.message.deleted_by;
    const isAiMod =
      !deletedBy ||
      deletedBy.is_automod === true ||
      (typeof deletedBy.username === "string" &&
        /automod|kickbot|ai[\s_-]?mod/i.test(deletedBy.username));
    const reason = isAiMod ? "AI MOD" : "DELETED";
    removeChatMessage(messageID, reason);
    return;
  }

  // Check if User Ban Event. Kick uses the same event for permanent
  // bans and timeouts — timeouts include an `expires_at` (and/or a
  // duration) while permanent bans do not. Pick the label and alert
  // type from whichever shape arrives.
  if (messageData.event === "App\\Events\\UserBannedEvent") {
    const banData = JSON.parse(messageData.data);
    const banUserData = banData.user || {};
    const banUserID = banUserData.id;
    const bannedBy = banData.banned_by || {};
    const expiresAt = banData.expires_at || banData.expiresAt || null;
    const duration = Number(banData.duration) || 0;
    const isTimeout = Boolean(expiresAt) || duration > 0;
    const reason = isTimeout ? "TIMED OUT" : "BANNED";

    const bannedUserMessages = document.querySelectorAll(
      `.message-item[user-id="${banUserID}"]`
    );
    bannedUserMessages.forEach((messageElement) => {
      markDeleted(messageElement, reason);
    });

    alertModeration({
      username: banUserData.username,
      action: isTimeout ? "timeout" : "ban",
      moderator: bannedBy.username,
      duration,
      expiresAt
    });
    return;
  }

  // Check if Pinned Message Created Event
  if (messageData.event === "App\\Events\\PinnedMessageCreatedEvent") {
    let pinData = JSON.parse(messageData.data);
    let pinMessageData = pinData.message;

    let pinMessage = pinMessageData.content;
    let pinSender = pinMessageData.sender.username;
    let pinIdentity = pinMessageData.sender.identity.color;
    let senderBadges = []; // Collect sender badges here

    // Check if there are any pinned messages
    const pinnedMessages = document.getElementsByClassName("pinned-message");
    if (pinnedMessages.length > 0) {
      // Remove all existing pinned messages
      for (let i = pinnedMessages.length - 1; i >= 0; i--) {
        pinnedMessages[i].remove();
      }
    }

    // Call the function to create and display the pinned message
    createPinnedMessage(pinMessage, pinSender, pinIdentity, senderBadges);
    return;
  }

  // Check if Pinned Message Deleted Event
  if (messageData.event === "App\\Events\\PinnedMessageDeletedEvent") {
    // Find the pinned messages with the "pinned-message" class
    const pinnedMessages = document.getElementsByClassName("pinned-message");

    // Check if there are any pinned messages
    if (pinnedMessages.length > 0) {
      // Remove the last added pinned message (assuming it's the latest one)
      pinnedMessages[pinnedMessages.length - 1].remove();
    }
    return;
  }

  // ─── Sub / gift / raid / Kicks alerts ────────────────────────────────────
  // Kick's WebSocket isn't formally documented and event names can shift.
  // If you see "Unknown event" entries below, copy the event name and add it
  // to one of these handlers.

  if (messageData.event === "App\\Events\\SubscriptionEvent") {
    const d = safeParse(messageData.data);
    alertSubscription({
      username: d?.username || d?.user?.username,
      months: d?.months ?? 1
    });
    return;
  }

  if (messageData.event === "App\\Events\\GiftedSubscriptionsEvent") {
    const d = safeParse(messageData.data);
    alertGiftedSubs({
      gifter: d?.gifter_username || d?.gifter?.username,
      count: Array.isArray(d?.gifted_usernames) ? d.gifted_usernames.length : d?.count,
      recipients: d?.gifted_usernames
    });
    return;
  }

  if (
    messageData.event === "App\\Events\\StreamHostEvent" ||
    messageData.event === "App\\Events\\ChatroomHostEvent"
  ) {
    const d = safeParse(messageData.data);
    alertRaid({
      raider: d?.host_username || d?.username,
      viewers: d?.number_viewers ?? d?.viewers
    });
    return;
  }

  // Kicks gifting — currency-style tipping on Kick.com.
  // Best-guess event names; logger below catches any rename.
  if (
    messageData.event === "App\\Events\\KicksGifted" ||
    messageData.event === "App\\Events\\KicksGiftedEvent" ||
    messageData.event === "App\\Events\\GiftsLeaderboardUpdated"
  ) {
    const d = safeParse(messageData.data);
    const amount = Number(d?.gift?.amount ?? d?.amount ?? d?.kicks ?? 0);
    if (amount >= minKicksAlert) {
      alertKicksGift({
        sender: d?.sender?.username || d?.username || d?.gifter_username,
        amount,
        message: d?.message || d?.gift?.message
      });
    }
    return;
  }

  // Front-page feature event. Kick has a rotating front-page carousel; when
  // the channel gets featured (or moves up in the carousel), the platform
  // typically broadcasts an event here. The exact name isn't documented,
  // so we cover the most plausible variants and let the unknown-event
  // logger below catch any rename.
  if (
    messageData.event === "App\\Events\\StreamerIsLive" ||
    messageData.event === "App\\Events\\FrontpageEvent" ||
    messageData.event === "App\\Events\\FeaturedChannelEvent" ||
    messageData.event === "App\\Events\\ChannelFeaturedEvent"
  ) {
    const d = safeParse(messageData.data);
    alertFrontpage({
      position: d?.position ?? d?.slot ?? d?.rank
    });
    return;
  }

  // Ignore pusher housekeeping noise, but log anything else for debugging.
  if (
    messageData.event &&
    !messageData.event.startsWith("pusher:") &&
    !messageData.event.startsWith("pusher_internal:")
  ) {
    console.log("Unknown event:", messageData.event, messageData.data);
  }
}

function safeParse(data) {
  if (typeof data !== "string") return data || {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}
