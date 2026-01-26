// Schedule notifications for specific times (called from Settings)

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Cancel all pending/scheduled notifications
async function cancelPendingNotifications() {
  const cancelled = [];
  try {
    // Fetch scheduled notifications
    const listRes = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&kind=1`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (listRes.ok) {
      const data = await listRes.json();
      // Cancel each scheduled notification
      for (const notif of (data.notifications || [])) {
        if (notif.id && !notif.completed_at) {
          await fetch(
            `https://onesignal.com/api/v1/notifications/${notif.id}?app_id=${ONESIGNAL_APP_ID}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          cancelled.push(notif.id);
        }
      }
    }
  } catch (err) {
    console.error('Error cancelling notifications:', err);
  }
  return cancelled;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { morning_time, evening_time, timezone_offset, cancel_only } = req.body;

  // Cancel any existing scheduled notifications first
  const cancelled = await cancelPendingNotifications();

  // If cancel_only is true, just cancel and return (used when turning notifications off)
  if (cancel_only) {
    return res.status(200).json({ cancelled, message: 'All scheduled notifications cancelled' });
  }

  // timezone_offset from browser's getTimezoneOffset(): positive = west of UTC
  // e.g., +300 for EST (UTC-5), +480 for PST (UTC-8)
  const offsetMs = (timezone_offset ?? 300) * 60 * 1000; // Default to EST

  const results = { scheduled: [], cancelled, server_now: new Date().toISOString() };

  // Convert local time string to UTC ISO string
  // timezone_offset from browser: positive = west of UTC (e.g., +300 for EST = UTC-5)
  function toUTCTimestamp(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();

    // Start with today's date at midnight UTC
    const target = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    // Set the user's desired local time, then add timezone offset to convert to UTC
    // e.g., 8:00am EST (offset +300) → 8:00 + 5 hours = 13:00 UTC
    const localTimeMs = (hours * 60 + minutes) * 60 * 1000;
    const utcTimeMs = localTimeMs + offsetMs;
    target.setTime(target.getTime() + utcTimeMs);

    // If this time already passed today, schedule for tomorrow
    if (target <= now) {
      target.setUTCDate(target.getUTCDate() + 1);
    }

    return target.toISOString();
  }

  try {
    // Schedule morning notification
    if (morning_time) {
      const sendAt = toUTCTimestamp(morning_time);
      results.morning_send_at = sendAt;

      const r = await fetch('https://onesignal.com/api/v1/notifications', {
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
          send_after: sendAt
        })
      });
      results.morning = await r.json();
      results.scheduled.push(`morning at ${morning_time}`);
    }

    // Schedule evening notification
    if (evening_time) {
      const sendAt = toUTCTimestamp(evening_time);
      results.evening_send_at = sendAt;

      const r = await fetch('https://onesignal.com/api/v1/notifications', {
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
          send_after: sendAt
        })
      });
      results.evening = await r.json();
      results.scheduled.push(`evening at ${evening_time}`);
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
