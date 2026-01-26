// Daily cron - fetches user's preferred times and schedules exact notifications

const ONESIGNAL_APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';
const ONESIGNAL_API_KEY = 'os_v2_app_rzdr72b2azeh3huq44c4clydjkuefnfn362e5nnfbii6hbmv5ricryseab32jope46ved6gfmgd4rhd6uplspwxqldndz7z7um5jbhq';

export default async function handler(req, res) {
  const results = { timestamp: new Date().toISOString() };

  try {
    // Get all users to read their time preference tags
    const usersRes = await fetch(
      `https://onesignal.com/api/v1/players?app_id=${ONESIGNAL_APP_ID}&limit=10`,
      {
        headers: { 'Authorization': `Basic ${ONESIGNAL_API_KEY}` }
      }
    );
    const usersData = await usersRes.json();

    if (!usersData.players || usersData.players.length === 0) {
      return res.status(200).json({ message: 'No subscribers yet', ...results });
    }

    // Get the user's tags (single user app)
    const user = usersData.players[0];
    const morningTime = user.tags?.morning_time || '08:00';
    const eveningTime = user.tags?.evening_time || '20:00';

    results.user_times = { morning: morningTime, evening: eveningTime };

    // Schedule morning notification at exact time in user's timezone
    const morningRes = await fetch('https://onesignal.com/api/v1/notifications', {
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
        delivery_time_of_day: `${morningTime}:00`
      })
    });
    results.morning = await morningRes.json();

    // Schedule evening notification at exact time in user's timezone
    const eveningRes = await fetch('https://onesignal.com/api/v1/notifications', {
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
        delivery_time_of_day: `${eveningTime}:00`
      })
    });
    results.evening = await eveningRes.json();

    return res.status(200).json(results);
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: error.message });
  }
}
