// Vercel Daily Cron Job - Sends reminder notifications via OneSignal
// Runs once daily at 6am ET, reads user settings, and schedules notifications
// Single-user personal app

import { Redis } from '@upstash/redis';

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';
const SETTINGS_KEY = 'notification_settings';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Convert HH:MM in a timezone to a Date object for today
function getScheduledTime(timeStr, timezone) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  // Create a date string for today in the target timezone
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
  const dateTimeStr = `${dateStr}T${timeStr}:00`;

  // Parse as if it's in the target timezone
  const targetDate = new Date(dateTimeStr + getTimezoneOffset(timezone));

  // If the time has already passed today, it will still work since we schedule for the future
  return targetDate;
}

// Get timezone offset string like "+05:00" or "-04:00"
function getTimezoneOffset(timezone) {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const diffMinutes = (tzDate - utcDate) / 60000;
  const hours = Math.floor(Math.abs(diffMinutes) / 60);
  const minutes = Math.abs(diffMinutes) % 60;
  const sign = diffMinutes >= 0 ? '-' : '+'; // Inverted because we're calculating offset FROM UTC
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

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
    // Read settings from Redis
    const settings = await redis.get(SETTINGS_KEY);

    if (!settings || !settings.enabled) {
      results.actions.push('notifications_disabled');
      return res.status(200).json(results);
    }

    const { morning_time, evening_time, timezone } = settings;
    const tz = timezone || 'America/New_York';

    // Calculate scheduled times for today
    const morningDate = getScheduledTime(morning_time || '08:00', tz);
    const eveningDate = getScheduledTime(evening_time || '20:00', tz);

    // Morning gratitude reminder
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
        url: "https://memory-prosthetic.vercel.app",
        send_after: morningDate.toISOString()
      })
    });
    results.morning = await morningResponse.json();
    results.morning_scheduled_for = morningDate.toISOString();
    results.actions.push('morning_scheduled');

    // Evening memory reminder
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
        send_after: eveningDate.toISOString()
      })
    });
    results.evening = await eveningResponse.json();
    results.evening_scheduled_for = eveningDate.toISOString();
    results.actions.push('evening_scheduled');

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
