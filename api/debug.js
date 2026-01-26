// Debug endpoint to check OneSignal v2 API

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export default async function handler(req, res) {
  try {
    // Try sending a test notification directly
    const notifyRes = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: "Test notification" },
        headings: { en: "Test" },
        included_segments: ["All"],
        url: "https://memory-prosthetic.vercel.app"
      })
    });

    const text = await notifyRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(200).json({
      status: notifyRes.status,
      data
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
