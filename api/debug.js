// Debug endpoint to check OneSignal status

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export default async function handler(req, res) {
  const results = {};

  try {
    // Check app info and subscriber count
    const appRes = await fetch(`https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}`, {
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      }
    });
    const appData = await appRes.json();
    results.app = {
      name: appData.name,
      players: appData.players, // total subscribers
      messageable_players: appData.messageable_players, // can receive messages
    };

    // List recent notifications
    const notifsRes = await fetch(
      `https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&limit=5`,
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        }
      }
    );
    const notifsData = await notifsRes.json();
    results.recent_notifications = (notifsData.notifications || []).map(n => ({
      id: n.id,
      headings: n.headings,
      successful: n.successful,
      failed: n.failed,
      send_after: n.send_after,
      completed_at: n.completed_at,
    }));

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message, results });
  }
}
