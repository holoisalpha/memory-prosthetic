// Daily cron - reads user's time preferences from OneSignal tags and schedules notifications

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Default to ET (UTC-5 = 300 minutes)
const DEFAULT_TZ_OFFSET = 300;

function toUTCTimestamp(timeStr, offsetMinutes) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const offsetMs = offsetMinutes * 60 * 1000;

  const now = new Date();
  const userNow = new Date(now.getTime() - offsetMs);

  const target = new Date(userNow);
  target.setUTCHours(hours, minutes, 0, 0);

  if (target <= userNow) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  const utcTarget = new Date(target.getTime() + offsetMs);
  return utcTarget.toISOString();
}

export default async function handler(req, res) {
  const results = { timestamp: new Date().toISOString() };

  try {
    // Try to get user's tags from OneSignal
    let morningTime = '08:00';
    let eveningTime = '20:00';

    // Fetch users to get their tags
    const usersRes = await fetch(
      `https://onesignal.com/api/v1/players?app_id=${ONESIGNAL_APP_ID}&limit=1`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (usersRes.ok) {
      const usersData = await usersRes.json();
      if (usersData.players && usersData.players.length > 0) {
        const user = usersData.players[0];
        if (user.tags?.morning_time) morningTime = user.tags.morning_time;
        if (user.tags?.evening_time) eveningTime = user.tags.evening_time;
        results.found_tags = { morning: morningTime, evening: eveningTime };
      }
    } else {
      results.tag_fetch_error = await usersRes.text();
    }

    results.using_times = { morning: morningTime, evening: eveningTime };

    // Schedule morning notification
    const morningSendAt = toUTCTimestamp(morningTime, DEFAULT_TZ_OFFSET);
    const morningRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: "What are you grateful for today?" },
        headings: { en: "Morning reflection" },
        included_segments: ["All"],
        url: "https://memory-prosthetic.vercel.app",
        send_after: morningSendAt
      })
    });
    results.morning = await morningRes.json();
    results.morning_send_at = morningSendAt;

    // Schedule evening notification
    const eveningSendAt = toUTCTimestamp(eveningTime, DEFAULT_TZ_OFFSET);
    const eveningRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: "Anything worth remembering from today?" },
        headings: { en: "Evening reflection" },
        included_segments: ["All"],
        url: "https://memory-prosthetic.vercel.app",
        send_after: eveningSendAt
      })
    });
    results.evening = await eveningRes.json();
    results.evening_send_at = eveningSendAt;

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: error.message });
  }
}
