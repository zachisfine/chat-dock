import { userId } from './ws.js';
export let sevenTVEmotes = [];
export let tSevenTVEmotes = [];

export async function fetch7TVEmotes(userId) {
  try {
    console.log('Kick UserId:', userId);
    const response1 = fetch(`https://7tv.io/v3/users/kick/${userId}`);
    const response2 = fetch(`https://7tv.io/v3/emote-sets/global`);

    const responses = await Promise.all([response1, response2]);
    const data1 = await handleResponse(responses[0]);
    const data2 = await handleResponse(responses[1]);

    const emotesData = [...(data1.emote_set?.emotes || []), ...(data2.emotes || [])];
    emotesData.forEach(emote => {
      const emoteName = emote.name;

      if (emote.data.host && emote.data.host.files) {
        const files = emote.data.host.files;
        const emoteUrl = 'https:' + emote.data.host.url + '/' + files.find(file => file.name === '4x.webp').name;

        sevenTVEmotes.push({ name: emoteName, url: emoteUrl });
      }
    });

    console.log('7TV Emotes:', JSON.stringify(sevenTVEmotes));  // Log the array after it has been filled

  } catch (error) {
    console.log('Error fetching 7TV emotes:', error);
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return await response.json();
}