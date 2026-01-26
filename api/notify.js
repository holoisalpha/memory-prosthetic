// Vercel Cron Job - Sends reminder notifications via OneSignal
// Runs every hour, checks user tags to see if it's their reminder time

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

export default async function handler(req, res) {
  // Only allow GET (for cron) or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const currentHour = now.getUTCHours();
  const today = now.toISOString().split('T')[0];

  // We'll send two types of notifications:
  // 1. Morning gratitude - for users whose morning_reminder hour matches current UTC hour
  // 2. Evening memory - for users whose evening_reminder hour matches current UTC hour

  const results = {
    morning: null,
    evening: null,
    timestamp: now.toISOString(),
    currentHour
  };

  try {
    // Morning gratitude notification
    // Target users where:
    // - morning_reminder hour matches current hour (we store as HH:MM, check HH)
    // - last_gratitude_date is NOT today
    const morningResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: "What are you grateful for today?" },
        headings: { en: "Morning reflection" },
        // Target users whose morning reminder starts with current hour and haven't logged gratitude today
        filters: [
          { field: "tag", key: "morning_reminder", relation: "=", value: `${String(currentHour).padStart(2, '0')}:00` },
          { operator: "AND" },
          { field: "tag", key: "last_gratitude_date", relation: "!=", value: today }
        ],
        url: "https://memory-prosthetic.vercel.app"
      })
    });
    results.morning = await morningResponse.json();

    // Evening memory notification
    // Target users where:
    // - evening_reminder hour matches current hour
    // - last_logged_date is NOT today
    const eveningResponse = await fetch('https://onesignal.com/api/v1/notifications', {
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
          { field: "tag", key: "evening_reminder", relation: "=", value: `${String(currentHour).padStart(2, '0')}:00` },
          { operator: "AND" },
          { field: "tag", key: "last_logged_date", relation: "!=", value: today }
        ],
        url: "https://memory-prosthetic.vercel.app"
      })
    });
    results.evening = await eveningResponse.json();

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
