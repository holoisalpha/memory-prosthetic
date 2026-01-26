// Debug endpoint to check OneSignal v2 API

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjj6ahdj4tdhurbu2dibwtx7zj5t6a26nvmwyphy44fmgc6sd2bx47dboz5alp3hcn34uq5mcktgvuly';

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
