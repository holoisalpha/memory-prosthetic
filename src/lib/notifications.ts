import OneSignal from 'react-onesignal';

const APP_ID = '8e471fe8-3a06-487d-9e90-e705c12f034a';

let initialized = false;

export async function initOneSignal(): Promise<void> {
  if (initialized) return;

  try {
    await OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });
    initialized = true;
    console.log('OneSignal initialized');
  } catch (err) {
    console.error('OneSignal init failed:', err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

export function getNotificationPermission(): boolean {
  return OneSignal.Notifications?.permission ?? false;
}

export async function setOptedIn(optedIn: boolean): Promise<void> {
  try {
    if (optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    } else {
      await OneSignal.User.PushSubscription.optOut();
    }
  } catch (err) {
    console.error('Failed to update opt-in status:', err);
  }
}

export function isOptedIn(): boolean {
  return OneSignal.User?.PushSubscription?.optedIn ?? false;
}

// Update tags to track when user last logged an entry
// This allows OneSignal segments to target users who haven't logged today
export async function updateLastLoggedDate(date: string): Promise<void> {
  try {
    await OneSignal.User.addTags({
      last_logged_date: date,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch (err) {
    console.error('Failed to update OneSignal tags:', err);
  }
}

// Update tags to track if user has logged gratitude today
export async function updateGratitudeLogged(date: string): Promise<void> {
  try {
    await OneSignal.User.addTags({
      last_gratitude_date: date,
    });
  } catch (err) {
    console.error('Failed to update OneSignal tags:', err);
  }
}

// Convert local HH:MM to UTC HH:MM
function localTimeToUTC(localTime: string): string {
  if (!localTime) return '';
  const [hours, minutes] = localTime.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  const utcHours = now.getUTCHours();
  return `${String(utcHours).padStart(2, '0')}:00`;
}

// Update reminder time preferences (stored in UTC for server-side cron)
export async function updateReminderTimes(
  morningTime: string | undefined,
  eveningTime: string | undefined
): Promise<void> {
  try {
    await OneSignal.User.addTags({
      morning_reminder: morningTime ? localTimeToUTC(morningTime) : '',
      evening_reminder: eveningTime ? localTimeToUTC(eveningTime) : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  } catch (err) {
    console.error('Failed to update reminder times:', err);
  }
}
