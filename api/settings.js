// API to read/write notification settings
// Uses Upstash Redis for persistence

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SETTINGS_KEY = 'notification_settings';

const DEFAULT_SETTINGS = {
  enabled: false,
  morning_time: '08:00',
  evening_time: '20:00',
  timezone: 'America/New_York'
};

export default async function handler(req, res) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const settings = await redis.get(SETTINGS_KEY);
      return res.status(200).json(settings || DEFAULT_SETTINGS);
    }

    if (req.method === 'POST') {
      const updates = req.body;
      const current = await redis.get(SETTINGS_KEY) || DEFAULT_SETTINGS;
      const merged = { ...current, ...updates };
      await redis.set(SETTINGS_KEY, merged);
      return res.status(200).json(merged);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
