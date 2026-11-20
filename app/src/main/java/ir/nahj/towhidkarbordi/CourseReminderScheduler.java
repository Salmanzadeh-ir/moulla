package ir.nahj.towhidkarbordi;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

/** Owner-approved private daily/weekly course reminder. No MP3 request occurs here. */
public final class CourseReminderScheduler {
    private CourseReminderScheduler() {}
    public static final String ACTION_REMIND = "ir.nahj.towhidkarbordi.action.COURSE_REMIND";
    public static final String EXTRA_OPEN_COURSE = "pmm_open_course_from_notification";
    public static final String CHANNEL_ID = "pmm_course_silent_v1";
    public static final String TITLE = "قرار امروز، پای منبر مولا";
    private static final String BODY = "زمان همراهی با شرح نهج‌البلاغه فرا رسیده است.";
    private static final String PREFS = "pmm_course_reminder_v1";
    private static final String MODE = "mode", WEEKDAY = "weekday", TIME = "time", NEXT = "next_at";
    private static final int ALARM_REQUEST = 4911, OPEN_REQUEST = 4912, NOTIFICATION_ID = 4913;

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static boolean valid(String mode,int weekday,String time) {
        return ("daily1".equals(mode) || "daily2".equals(mode) ||
                ("weekly".equals(mode) && weekday>=0 && weekday<=6)) &&
                PmmReminderClock.validCourseTime(time);
    }

    public static void initialize(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel=new NotificationChannel(CHANNEL_ID,
                        "قرار امروز، پای منبر مولا (بی‌صدا)",NotificationManager.IMPORTANCE_LOW);
                channel.setSound(null,null);
                channel.enableVibration(false);
                channel.setShowBadge(false);
                nm.createNotificationChannel(channel);
            }
        }
        sync(context);
    }

    public static boolean setPlan(Context context,String mode,int weekday,String time) {
        if (!valid(mode,weekday,time)) return false;
        prefs(context).edit().putString(MODE,mode).putInt(WEEKDAY,weekday)
                .putString(TIME,time).apply();
        sync(context);
        return true;
    }

    public static void clearPlan(Context context) {
        prefs(context).edit().clear().apply();
        cancel(context);
    }

    private static PendingIntent pendingAlarm(Context context) {
        Intent intent=new Intent(context,WisdomReminderReceiver.class).setAction(ACTION_REMIND);
        return PendingIntent.getBroadcast(context,ALARM_REQUEST,intent,
                PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }

    private static void cancel(Context context) {
        AlarmManager alarms=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(pendingAlarm(context));
        prefs(context).edit().remove(NEXT).apply();
    }

    private static void schedule(Context context,long when) {
        AlarmManager alarms=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        // Inexact and Doze-aware by design. Never request SCHEDULE_EXACT_ALARM.
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pendingAlarm(context));
        prefs(context).edit().putLong(NEXT,when).apply();
    }

    public static void sync(Context context) {
        SharedPreferences p=prefs(context);
        String mode=p.getString(MODE,"");
        String time=p.getString(TIME,"");
        int weekday=p.getInt(WEEKDAY,-1);
        if (!valid(mode,weekday,time) || !WisdomReminderScheduler.hasConsent(context) ||
                !WisdomReminderScheduler.hasSystemPermission(context)) {
            cancel(context);
            return;
        }
        schedule(context,PmmReminderClock.nextCourse(System.currentTimeMillis(),mode,weekday,time));
    }

    public static void onAlarm(Context context) {
        SharedPreferences p=prefs(context);
        String mode=p.getString(MODE,"");
        String time=p.getString(TIME,"");
        int weekday=p.getInt(WEEKDAY,-1);
        if (!valid(mode,weekday,time) || !WisdomReminderScheduler.hasConsent(context) ||
                !WisdomReminderScheduler.hasSystemPermission(context)) {
            cancel(context);
            return;
        }
        NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            Intent open=new Intent(context,MainActivity.class)
                    .putExtra(EXTRA_OPEN_COURSE,true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|
                              Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap=PendingIntent.getActivity(context,OPEN_REQUEST,open,
                    PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b=Build.VERSION.SDK_INT>=26
                    ?new Notification.Builder(context,CHANNEL_ID):new Notification.Builder(context);
            b.setSmallIcon(R.drawable.pmm_reminder_icon).setContentTitle(TITLE)
                    .setContentText(BODY).setContentIntent(tap).setAutoCancel(true)
                    .setDefaults(0).setSound(null).setVibrate(null).setOnlyAlertOnce(true);
            if (Build.VERSION.SDK_INT<26) b.setPriority(Notification.PRIORITY_LOW);
            try { nm.notify(NOTIFICATION_ID,b.build()); }
            catch (SecurityException ignored) { /* Respect revoked permission. */ }
        }
        sync(context);
    }
}
