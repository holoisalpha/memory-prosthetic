// Vercel Daily Cron Job - Sends reminder notifications via OneSignal
// Runs once daily at 8am ET, sends morning notification immediately and schedules evening for 8pm ET
// Single-user personal app - sends to all subscribers

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const results = {
    timestamp: now.toISOString(),
    actions: []
  };

  try {
    // Morning gratitude reminder (sent immediately at 8am ET)
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
        included_segments: ["All"],
        url: "https://memory-prosthetic.vercel.app"
      })
    });
    results.morning = await morningResponse.json();
    results.actions.push('morning_sent');

    // Evening memory reminder (scheduled for 8pm ET = 12 hours later)
    // Calculate 8pm ET in UTC
    const eveningTime = new Date(now);
    eveningTime.setUTCHours(now.getUTCHours() + 12); // 8am + 12 hours = 8pm

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
        included_segments: ["All"],
        url: "https://memory-prosthetic.vercel.app",
        send_after: eveningTime.toISOString()
      })
    });
    results.evening = await eveningResponse.json();
    results.actions.push('evening_scheduled');

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
