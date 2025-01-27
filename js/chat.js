import { kickChannel, subBadges } from "./ws.js";
import { sevenTVEmotes } from "./7tv.js";

let finalMessage;
let messageCount;

const excludedKickBots = [
  "babblechat",
  "botrix",
  "casterlabs",
  "intrx",
  "livebot",
  "lottobot",
  "logibot",
  "mrbeefbot",
  "notibot",
  "squadbot",
  "babzbot",
];

const emoteRegex = /\[(emote|emoji):(\w+):?[^\]]*\]/g;
const htmlRegex = /(?<!src=")https?:\/\/[^\s]+(?![^<]*<\/img>)/g;

// set DOM elements
const chatEL = document.getElementById("chat-container");
// const timeStampCheck = document.getElementById("timeStampCheck");

export function createMessage(
  messageID,
  messageContent,
  messageUsername,
  senderColor,
  messageUserID,
  senderBadges,
  subscriberAge
) {
  // replace kick emote/emoji tags with their corresponding images
  const messageWithEmotes = messageContent.replace(
    emoteRegex,
    (match, type, id) => {
      const imageSrc =
        type === "emote"
          ? `https://files.kick.com/emotes/${id}/fullsize`
          : `https://dbxmjjzl5pc1g.cloudfront.net/9576c763-3777-4a57-8a8f-38cdb79de660/images/emojis/${id}.png`;
      const emoteName = match.substring(
        match.lastIndexOf(":") + 1,
        match.length - 1
      );
      return `<img src="${imageSrc}" title="${emoteName}" alt="${match}" />`;
    }
  );

  const messageWithLinks = messageWithEmotes.replace(
    htmlRegex,
    '<span class="chatLink">$&</span>'
  );

  // Initialize the final message with the original message
  finalMessage = messageWithLinks;

  // Iterate over each emote in sevenTVEmotes
  sevenTVEmotes.forEach((emote) => {
    const sevenTVEmoteName = emote.name;
    const sevenTVEmoteUrl = emote.url;

    const sanitizedEmoteName = escapeRegExp(sevenTVEmoteName);
    const sevenTVRegex = new RegExp(
      `(?<!<img[^>]*="[^"]*)\\b${sanitizedEmoteName}\\b(?!")`,
      "g"
    );

    // Replace the emote name with the image URL in the message
    finalMessage = finalMessage.replace(
      sevenTVRegex,
      `<img src="${sevenTVEmoteUrl}" alt="${sevenTVEmoteName}">`
    );
  });

  // create message element
  const messageElement = document.createElement("div");
  messageElement.id = messageID;
  messageElement.setAttribute("user-id", messageUserID);

  // Convert both bot names and messageUsername to lowercase for case-insensitive comparison
  const lowercaseExcludedKickBots = excludedKickBots.map((botName) =>
    botName.toLowerCase()
  );
  const lowercaseMessageUsername = messageUsername.toLowerCase();

  // Check if finalMessage begins with "!" which designates a command
  //if (finalMessage.startsWith("!")) {
  //  messageElement.classList.add("message-item", "commands");
  //} else {
  //  messageElement.classList.add("message-item");
  //}

  // Check if Sender Username is in the excludedTwitchBots array
  if (lowercaseExcludedKickBots.includes(lowercaseMessageUsername)) {
    messageElement.classList.add("bot");
  }

  // Check if "moderator" badge is present in the senderBadges array
  if (senderBadges.includes("moderator")) {
    // If "moderator" badge is present, add the "moderator" class to the messageElement
    messageElement.classList.add("moderator");
  }

  // Check if the user is a subscriber, VIP, or gifter
  const isSubscriber = senderBadges.includes("subscriber");
  const isVIP = senderBadges.includes("vip");
  const isGifter = senderBadges.some((badge) => badge.startsWith("sub_gifter"));

  // create span elements for timestamp, badges, username, and message
  const timestampSpan = document.createElement("span");
  const badgesSpan = document.createElement("span");
  const usernameSpan = document.createElement("span");
  const messageSpan = document.createElement("span");

  // Add a class to dim the message text for non-subscribers, non-VIPs, and non-gifters
  if (!isSubscriber && !isVIP && !isGifter) {
    messageElement.classList.add("dimmed");
  }

  // set the classes for the span elements
  timestampSpan.classList.add("timestamp");
  usernameSpan.classList.add("username");
  messageSpan.classList.add("message");
  badgesSpan.classList.add("badges");

// Check if the message contains an "@" symbol
if (messageContent.includes("@")) {
  // Get the lowercase username of the channel owner
  const lowercaseKickChannel = kickChannel.toLowerCase();

  // Check if the message is directed at the channel owner and apply style
  if (
    messageContent.toLowerCase().includes(`@${lowercaseKickChannel}`)
  ) {
    messageElement.classList.add("atStreamer");
  } else {
    messageElement.classList.add("atChat");
  }
}

  // set the text content for the span elements
  const timestamp = new Date();
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  timestampSpan.textContent = formattedHours + ":" + formattedMinutes;
  usernameSpan.textContent = messageUsername;
  usernameSpan.style.color = senderColor;
  messageSpan.innerHTML = finalMessage;

  // Create badge elements and add them to badgesSpan
  if (senderBadges.length > 0) {
    for (let badgeType of senderBadges) {
      const badgeImg = document.createElement("img");

      if (badgeType === "subscriber") {
        let closestBadge = null;
        for (let badge of subBadges) {
          if (badge.months <= subscriberAge) {
            closestBadge = badge;
          } else {
            break;
          }
        }
        if (closestBadge) {
          badgeImg.src = closestBadge.badge_image.src;
        } else if (subBadges.length === 0) {
          badgeImg.src = "assets/subscriber.svg"; // Use default subscriber.svg image if the stream has no sub badges
        }
        badgeImg.classList.add("user-badges");
        badgeImg.setAttribute("title", subscriberAge + " month subscriber");
      } else if (badgeType.startsWith("sub_gifter")) {
        let subGifterCount = parseInt(badgeType.split(":")[1]);
        if (subGifterCount >= 1 && subGifterCount <= 24) {
          badgeImg.src = "assets/sub_gifter.svg";
        } else if (subGifterCount >= 25 && subGifterCount <= 49) {
          badgeImg.src = "assets/sub_gifter_25.svg";
        } else if (subGifterCount >= 50 && subGifterCount <= 99) {
          badgeImg.src = "assets/sub_gifter_50.svg";
        } else if (subGifterCount >= 100 && subGifterCount <= 199) {
          badgeImg.src = "assets/sub_gifter_100.svg";
        } else if (subGifterCount >= 200) {
          badgeImg.src = "assets/sub_gifter_200.svg";
        }
        badgeImg.classList.add("user-badges");
        badgeImg.setAttribute("title", `sub_gifter (${subGifterCount})`);
      } else {
        badgeImg.src = `assets/${badgeType}.svg`;
        badgeImg.classList.add("user-badges");
        badgeImg.setAttribute("title", badgeType);
      }
      badgeImg.alt = badgeType;

      // Add the badgeImg to the badgeSpan
      badgesSpan.appendChild(badgeImg);
    }
  }

  // append the span elements to the message element
  messageElement.appendChild(timestampSpan);
  messageElement.appendChild(badgesSpan);
  messageElement.appendChild(usernameSpan);
  messageElement.appendChild(messageSpan);

  return messageElement;
}

export function createPinnedMessage(
  messageContent,
  messageUsername,
  senderColor,
  senderBadges
) {

  console.log(senderBadges);
  const pinMessageDiv = document.createElement("div");
  pinMessageDiv.classList.add("message-item", "pinned-message");

  const pinIconImg = document.createElement("img");
  pinIconImg.src = "assets/thumbtack.svg";
  pinIconImg.classList.add("pinIcon");

  const badgesSpan = document.createElement("span");
  badgesSpan.classList.add("badges");

  // Create badge elements and add them to badgesSpan
  if (senderBadges.length > 0) {
    for (let badgeType of senderBadges) {
      const badgeImg = document.createElement("img");

      if (badgeType.startsWith("sub_gifter")) {
        let subGifterCount = parseInt(badgeType.split(":")[1]);
        if (subGifterCount >= 1 && subGifterCount <= 24) {
          badgeImg.src = "assets/sub_gifter.svg";
        } else if (subGifterCount >= 25 && subGifterCount <= 49) {
          badgeImg.src = "assets/sub_gifter_25.svg";
        } else if (subGifterCount >= 50 && subGifterCount <= 99) {
          badgeImg.src = "assets/sub_gifter_50.svg";
        } else if (subGifterCount >= 100 && subGifterCount <= 199) {
          badgeImg.src = "assets/sub_gifter_100.svg";
        } else if (subGifterCount >= 200) {
          badgeImg.src = "assets/sub_gifter_200.svg";
        }
        badgeImg.classList.add("user-badges");
        badgeImg.setAttribute("title", `sub_gifter (${subGifterCount})`);
      } else {
        badgeImg.src = `assets/${badgeType}.svg`;
        badgeImg.classList.add("user-badges");
        badgeImg.setAttribute("title", badgeType);
      }
      badgeImg.alt = badgeType;

      // Add the badgeImg to the badgesSpan
      badgesSpan.appendChild(badgeImg);
    }
  }

  const usernameSpan = document.createElement("span");
  usernameSpan.classList.add("username");
  usernameSpan.style.color = senderColor;
  usernameSpan.textContent = messageUsername;

  // Replace emotes / emojis & 7tv emotes in message
  const parsedMessage = emoteParsing(messageContent);

  const messageSpan = document.createElement("span");
  messageSpan.classList.add("message");
  messageSpan.innerHTML = parsedMessage;

  // Append the elements to the pinned message div
  pinMessageDiv.appendChild(pinIconImg);
  pinMessageDiv.appendChild(badgesSpan);
  pinMessageDiv.appendChild(usernameSpan);
  pinMessageDiv.appendChild(messageSpan);

  // Find the chat-container element and prepend the pinned message to it
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.prepend(pinMessageDiv);
  }
}

export function prependMessage(
  messageID,
  messageContent,
  messageUsername,
  senderColor,
  messageUserID,
  senderBadges,
  subscriberAge
) {
  // Create a new message element
  const newMessage = createMessage(
    messageID,
    messageContent,
    messageUsername,
    senderColor,
    messageUserID,
    senderBadges,
    subscriberAge
  );

  // Append the new message element to the chat element
  chatEL.appendChild(newMessage);
}

// Remove excess messages beyond the limit
export function removeExcessMessages(limit) {
  messageCount = chatEL.children.length;

  while (messageCount > limit) {
    chatEL.firstChild.remove(); // Remove the last child element
    messageCount--; // Update the message count
  }
}

function emoteParsing(messageContent) {
  // replace kick emote/emoji tags with their corresponding images
  const messageWithEmotes = messageContent.replace(
    emoteRegex,
    (match, type, id) => {
      const imageSrc =
        type === "emote"
          ? `https://files.kick.com/emotes/${id}/fullsize`
          : `https://dbxmjjzl5pc1g.cloudfront.net/9576c763-3777-4a57-8a8f-38cdb79de660/images/emojis/${id}.png`;
      const emoteName = match.substring(
        match.lastIndexOf(":") + 1,
        match.length - 1
      );
      return `<img src="${imageSrc}" title="${emoteName}" alt="${match}" />`;
    }
  );

  const messageWithLinks = messageWithEmotes.replace(
    htmlRegex,
    '<span class="chatLink">$&</span>'
  );

  // Initialize the final message with the original message
  finalMessage = messageWithLinks;

  // Iterate over each emote in sevenTVEmotes
  sevenTVEmotes.forEach((emote) => {
    const sevenTVEmoteName = emote.name;
    const sevenTVEmoteUrl = emote.url;

    const sanitizedEmoteName = escapeRegExp(sevenTVEmoteName);
    const sevenTVRegex = new RegExp(
      `(?<!<img[^>]*="[^"]*)\\b${sanitizedEmoteName}\\b(?!")`,
      "g"
    );

    // Replace the emote name with the image URL in the message
    finalMessage = finalMessage.replace(
      sevenTVRegex,
      `<img src="${sevenTVEmoteUrl}" alt="${sevenTVEmoteName}">`
    );
  });

  // Return the updated finalMessage
  return finalMessage;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters
}

// Function to fade to remove messages but check if the option is enabled or not
export function fadeRemoveMessage(messageID) {
  if (fadeURL === "on") {
    const messageElement = document.getElementById(messageID);
    messageElement.style.opacity = 0;

    setTimeout(() => {
      messageElement.remove();
      removeExcessMessages(100);
    }, fadeTimeURL);
  } else if (fadeURL === "off") {
    removeExcessMessages(100);
  }
}

export function removeChatMessage(id) {
  const messageEL = document.getElementById(id);

  if (chatEL && messageEL) {
    chatEL.removeChild(messageEL);
    console.log(`Message with ID ${id} has been removed.`);
  } else {
    console.log(`Message with ID ${id} not found.`);
  }
}
