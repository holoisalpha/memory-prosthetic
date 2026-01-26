// Vercel Cron Job - Sends reminder notifications via OneSignal
// Runs every hour, sends notifications at specific ET times

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

// Default times in Eastern Time (converted to UTC)
// 8am ET = 13:00 UTC (EST) or 12:00 UTC (EDT)
// 8pm ET = 01:00 UTC next day (EST) or 00:00 UTC (EDT)
const MORNING_HOUR_UTC = 13; // 8am EST
const EVENING_HOUR_UTC = 1;  // 8pm EST

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const currentHour = now.getUTCHours();
  const today = now.toISOString().split('T')[0];

  // For evening notification (which fires after midnight UTC), use yesterday's date for "today" check
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const results = {
    timestamp: now.toISOString(),
    currentHour,
    actions: []
  };

  try {
    // Morning gratitude (8am ET)
    if (currentHour === MORNING_HOUR_UTC) {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          contents: { en: "What are you grateful for today?" },
          headings: { en: "Morning reflection" },
          filters: [
            { field: "tag", key: "last_gratitude_date", relation: "!=", value: today }
          ],
          url: "https://memory-prosthetic.vercel.app"
        })
      });
      results.morning = await response.json();
      results.actions.push('morning_sent');
    }

    // Evening memory (8pm ET)
    if (currentHour === EVENING_HOUR_UTC) {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          contents: { en: "Anything worth remembering from today?" },
          headings: { en: "Evening reflection" },
          filters: [
            // Check if they haven't logged today (for evening, "today" in ET is yesterday in UTC)
            { field: "tag", key: "last_logged_date", relation: "!=", value: yesterdayStr },
            { operator: "AND" },
            { field: "tag", key: "last_logged_date", relation: "!=", value: today }
          ],
          url: "https://memory-prosthetic.vercel.app"
        })
      });
      results.evening = await response.json();
      results.actions.push('evening_sent');
    }

    if (results.actions.length === 0) {
      results.actions.push('no_action_this_hour');
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}

