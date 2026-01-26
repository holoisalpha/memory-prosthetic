// Schedule daily notifications via OneSignal
// Called when user updates notification settings

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { enabled, morning_time, evening_time, timezone } = req.body;

  // If disabled, just return success (OneSignal will handle not sending)
  if (!enabled) {
    return res.status(200).json({ success: true, message: 'Notifications disabled' });
  }

  const tz = timezone || 'America/New_York';
  const results = { scheduled: [] };

  try {
    // Schedule morning notification
    if (morning_time) {
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
          included_segments: ["All"],
          url: "https://memory-prosthetic.vercel.app",
          delayed_option: "timezone",
          delivery_time_of_day: morning_time + ":00"
        })
      });
      results.morning = await response.json();
      results.scheduled.push('morning');
    }

    // Schedule evening notification
    if (evening_time) {
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
          included_segments: ["All"],
          url: "https://memory-prosthetic.vercel.app",
          delayed_option: "timezone",
          delivery_time_of_day: evening_time + ":00"
        })
      });
      results.evening = await response.json();
      results.scheduled.push('evening');
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Schedule error:', error);
    return res.status(500).json({ error: error.message });
  }
}
