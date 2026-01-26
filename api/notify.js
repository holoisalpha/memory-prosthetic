// Daily cron - schedules notifications based on user's tag preferences

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

// Common notification hours (covers typical morning/evening times)
const MORNING_HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
const EVENING_HOURS = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

async function sendScheduledNotification(time, type, content, heading) {
  return fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      contents: { en: content },
      headings: { en: heading },
      // Only send to users with this specific time tag
      filters: [
        { field: 'tag', key: `${type}_time`, relation: '=', value: time }
      ],
      url: "https://memory-prosthetic.vercel.app",
      delayed_option: "timezone",
      delivery_time_of_day: `${time}:00`
    })
  });
}

export default async function handler(req, res) {
  const results = { timestamp: new Date().toISOString(), morning: [], evening: [] };

  try {
    // Schedule morning notifications for each possible time
    for (const time of MORNING_HOURS) {
      const r = await sendScheduledNotification(
        time, 'morning',
        "What are you grateful for today?",
        "Morning reflection"
      );
      results.morning.push({ time, response: await r.json() });
    }

    // Schedule evening notifications for each possible time
    for (const time of EVENING_HOURS) {
      const r = await sendScheduledNotification(
        time, 'evening',
        "Anything worth remembering from today?",
        "Evening reflection"
      );
      results.evening.push({ time, response: await r.json() });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: error.message });
  }
}
