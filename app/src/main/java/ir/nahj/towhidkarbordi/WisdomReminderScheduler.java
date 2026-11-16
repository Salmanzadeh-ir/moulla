package ir.nahj.towhidkarbordi;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.Calendar;

/**
 * On-device, user-consented, silent spiritual reminders.
 * With Android system permission, the FIRST notification is scheduled for
 * five minutes after the first opening and is delivered in the phone's
 * notification shade even if the Activity is closed. Android 13+ must grant
 * its runtime permission during a foreground Activity before posting.
 * No exact-alarm privileges, remote pushes or background Activity launches.
 */
public final class WisdomReminderScheduler {
    private WisdomReminderScheduler() {}

    public static final String ACTION_REMIND = "ir.nahj.towhidkarbordi.action.WISDOM_REMIND";
    public static final String EXTRA_OPEN_WISDOM = "pmm_open_wisdom_from_notification";
    public static final String CHANNEL_ID = "pmm_wisdom_silent_v1";
    public static final String TITLE = "یک جمله مهمان امیرالمؤمنین باش!";
    public static final String MESSAGE = "برای اینکه هر روز مهمان جمله‌ای از کلمات نورانی امیرالمؤمنین علیه‌السلام باشید، اجازه دهید یادآوری‌های بی‌صدا برایتان ارسال شود.";
    public static final long FIRST_DELAY_MS = 5L * 60L * 1000L;
    private static final String PREFS = "pmm_wisdom_reminder_v1";
    private static final String FIRST = "first_open_at";
    private static final String ASKED = "asked";
    private static final String CONSENT = "consent";
    private static final String FREQUENCY = "frequency";
    private static final String NEXT = "next_at";
    private static final int REQUEST_CODE = 4801;
    private static final int NOTIFICATION_ID = 4802;
    private static final long MIN_FUTURE = 6000L;

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void initialize(Context context) {
        SharedPreferences p = prefs(context);
        if (p.getLong(FIRST, 0L) <= 0L) {
            p.edit().putLong(FIRST, System.currentTimeMillis()).apply();
        }
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (mgr != null) {
                NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                        "یادآور مهمانی مولا (بی‌صدا)", NotificationManager.IMPORTANCE_LOW);
                channel.setDescription("یادآوری کلام امیرالمؤمنین؛ بدون صدا و لرزش");
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.setShowBadge(false);
                mgr.createNotificationChannel(channel);
            }
        }
        sync(context);
    }

    public static long firstOpen(Context context) { return prefs(context).getLong(FIRST, 0L); }
    public static boolean wasAsked(Context context) { return prefs(context).getBoolean(ASKED, false); }
    public static void markAsked(Context context) { prefs(context).edit().putBoolean(ASKED, true).apply(); }
    public static boolean hasConsent(Context context) { return prefs(context).getBoolean(CONSENT, false); }
    public static String frequency(Context context) {
        String value = prefs(context).getString(FREQUENCY, "daily");
        return validFrequency(value) ? value : "daily";
    }
    public static boolean validFrequency(String value) {
        return "daily".equals(value) || "weekly".equals(value) ||
               "monthly".equals(value) || "off".equals(value);
    }
    public static boolean hasSystemPermission(Context context) {
        if (Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        return mgr != null && (Build.VERSION.SDK_INT < 24 || mgr.areNotificationsEnabled());
    }

    public static void consent(Context context, boolean accepted) {
        prefs(context).edit().putBoolean(CONSENT, accepted).putLong(NEXT, 0L).apply();
        if (accepted) scheduleFirst(context);
        else cancel(context);
    }

    public static boolean setFrequency(Context context, String value) {
        if (!validFrequency(value)) return false;
        prefs(context).edit().putString(FREQUENCY, value).putLong(NEXT, 0L).apply();
        if ("off".equals(value)) cancel(context);
        else if (hasConsent(context)) {
            // Changing cadence starts a fresh interval unless this is the
            // first reminder, whose five-minute opt-in delay must be honored.
            SharedPreferences p = prefs(context);
            long first = p.getLong(FIRST, System.currentTimeMillis());
            if (System.currentTimeMillis() < first + FIRST_DELAY_MS) scheduleFirst(context);
            else schedule(context, nextAfter(System.currentTimeMillis(), value));
        }
        return true;
    }

    public static void scheduleFirst(Context context) {
        if (!enabled(context)) { cancel(context); return; }
        long first = firstOpen(context);
        long at = Math.max(first + FIRST_DELAY_MS, System.currentTimeMillis() + MIN_FUTURE);
        schedule(context, at);
    }

    private static boolean enabled(Context context) {
        return hasConsent(context) && !"off".equals(frequency(context)) && hasSystemPermission(context);
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent intent = new Intent(context, WisdomReminderReceiver.class).setAction(ACTION_REMIND);
        return PendingIntent.getBroadcast(context, REQUEST_CODE, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void schedule(Context context, long when) {
        if (!enabled(context)) { cancel(context); return; }
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        long at = Math.max(System.currentTimeMillis() + MIN_FUTURE, when);
        prefs(context).edit().putLong(NEXT, at).apply();
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, alarmIntent(context));
    }

    public static void sync(Context context) {
        if (!enabled(context)) { cancel(context); return; }
        long old = prefs(context).getLong(NEXT, 0L);
        if (old <= System.currentTimeMillis()) {
            if (old == 0L) scheduleFirst(context);
            else schedule(context, System.currentTimeMillis() + 60000L);
        } else schedule(context, old);
    }

    private static void cancel(Context context) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(alarmIntent(context));
        prefs(context).edit().remove(NEXT).apply();
    }

    private static long nextAfter(long now, String recurrence) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(now);
        if ("monthly".equals(recurrence)) cal.add(Calendar.MONTH, 1);
        else if ("weekly".equals(recurrence)) cal.add(Calendar.DAY_OF_YEAR, 7);
        else cal.add(Calendar.DAY_OF_YEAR, 1);
        return cal.getTimeInMillis();
    }

    public static void onAlarm(Context context) {
        if (!enabled(context)) { cancel(context); return; }
        NotificationManager mgr = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (mgr != null) {
            Intent open = new Intent(context, MainActivity.class);
            open.putExtra(EXTRA_OPEN_WISDOM, true);
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP |
                          Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent action = PendingIntent.getActivity(context, REQUEST_CODE, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                    ? new Notification.Builder(context, CHANNEL_ID)
                    : new Notification.Builder(context);
            builder.setSmallIcon(R.drawable.pmm_reminder_icon)
                   .setContentTitle(TITLE).setContentText(MESSAGE).setAutoCancel(true)
                   .setContentIntent(action).setShowWhen(true)
                   .setDefaults(0).setSound(null).setVibrate(null);
            // Channel importance LOW, no sound/vibration and defaults=0 are
            // supported on Android 8+; the platform Builder has no setSilent().
            builder.setOnlyAlertOnce(true);
            if (Build.VERSION.SDK_INT < 26) builder.setPriority(Notification.PRIORITY_LOW);
            try { mgr.notify(NOTIFICATION_ID, builder.build()); }
            catch (SecurityException ignored) { /* notification permission revoked */ }
        }
        schedule(context, nextAfter(System.currentTimeMillis(), frequency(context)));
    }
}
