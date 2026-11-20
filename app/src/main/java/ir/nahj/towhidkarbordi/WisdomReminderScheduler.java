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

/** On-device, consent-only, silent Wisdom reminders anchored at the initial opt-in clock. */
public final class WisdomReminderScheduler {
    private WisdomReminderScheduler() {}

    public static final String ACTION_REMIND = "ir.nahj.towhidkarbordi.action.WISDOM_REMIND";
    public static final String EXTRA_OPEN_WISDOM = "pmm_open_wisdom_from_notification";
    public static final String CHANNEL_ID = "pmm_wisdom_silent_v1";
    public static final String TITLE = "یک جمله مهمان امیرالمؤمنین باش!";
    public static final String MESSAGE = "قرار امروز شما با کلام نورانی امیرالمؤمنین علیه‌السلام فرا رسیده است.";

    private static final String PREFS="pmm_wisdom_reminder_v1";
    private static final String FIRST="first_open_at",ASKED="asked",CONSENT="consent";
    private static final String FREQUENCY="frequency",NEXT="next_at",ANCHOR="activation_clock_at";
    private static final int ALARM_REQUEST=4801, NOTIFICATION_ID=4802;

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void initialize(Context context) {
        SharedPreferences p=prefs(context);
        if(p.getLong(FIRST,0)<=0) p.edit().putLong(FIRST,System.currentTimeMillis()).apply();
        if (Build.VERSION.SDK_INT>=26) {
            NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
            if(nm!=null) {
                NotificationChannel ch=new NotificationChannel(CHANNEL_ID,
                    "یادآور مهمانی مولا (بی‌صدا)",NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("یادآوری کلام امیرالمؤمنین؛ بدون صدا و لرزش");
                ch.setSound(null,null);
                ch.enableVibration(false);
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
        }
        sync(context);
    }

    public static long firstOpen(Context context) {return prefs(context).getLong(FIRST,0L);}
    public static boolean wasAsked(Context context) {return prefs(context).getBoolean(ASKED,false);}
    public static void markAsked(Context context) {prefs(context).edit().putBoolean(ASKED,true).apply();}
    public static boolean hasConsent(Context context) {return prefs(context).getBoolean(CONSENT,false);}
    public static String frequency(Context context) {
        String v=prefs(context).getString(FREQUENCY,"daily");
        return validFrequency(v)?v:"daily";
    }
    public static boolean validFrequency(String v) {
        return "daily".equals(v)||"weekly".equals(v)||"monthly".equals(v)||"off".equals(v);
    }
    public static boolean hasSystemPermission(Context context) {
        if(Build.VERSION.SDK_INT>=33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                !=PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm!=null && (Build.VERSION.SDK_INT<24 || nm.areNotificationsEnabled());
    }

    /** Persist opt-in clock once: updates and app restarts never reset it. */
    public static void consent(Context context,boolean accepted) {
        SharedPreferences p=prefs(context);
        SharedPreferences.Editor edit=p.edit().putBoolean(CONSENT,accepted);
        if (accepted && (!p.getBoolean(CONSENT,false) || p.getLong(ANCHOR,0)<=0))
            edit.putLong(ANCHOR,PmmReminderClock.normalizeWisdomAnchor(System.currentTimeMillis()));
        edit.remove(NEXT).apply();
        if(accepted) sync(context);
        else cancel(context);
    }

    public static boolean setFrequency(Context context,String value) {
        if(!validFrequency(value))return false;
        prefs(context).edit().putString(FREQUENCY,value).remove(NEXT).apply();
        sync(context);
        return true;
    }

    private static boolean enabled(Context context) {
        return hasConsent(context)&&!"off".equals(frequency(context))&&hasSystemPermission(context);
    }
    private static PendingIntent pendingAlarm(Context context) {
        Intent intent=new Intent(context,WisdomReminderReceiver.class).setAction(ACTION_REMIND);
        return PendingIntent.getBroadcast(context,ALARM_REQUEST,intent,
                PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private static void cancel(Context context) {
        AlarmManager am=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if(am!=null)am.cancel(pendingAlarm(context));
        prefs(context).edit().remove(NEXT).apply();
    }
    private static void schedule(Context context,long when) {
        if(!enabled(context)){cancel(context);return;}
        AlarmManager am=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        if(am==null)return;
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pendingAlarm(context));
        prefs(context).edit().putLong(NEXT,when).apply();
    }
    public static void sync(Context context) {
        if(!enabled(context)){cancel(context);return;}
        SharedPreferences p=prefs(context);
        long now=System.currentTimeMillis();
        long anchor=p.getLong(ANCHOR,0);
        if(anchor<=0) {
            anchor=PmmReminderClock.normalizeWisdomAnchor(now);
            p.edit().putLong(ANCHOR,anchor).apply();
        }
        long lastScheduled=p.getLong(NEXT,0);
        // Preserve a previously deferred 07:00 notice across onResume/reboots.
        if (PmmReminderClock.quiet(now) && lastScheduled>0 &&
            lastScheduled<=PmmReminderClock.quietEnd(now))
            schedule(context,PmmReminderClock.quietEnd(now));
        else schedule(context,PmmReminderClock.nextWisdom(now,anchor,frequency(context)));
    }

    public static void onAlarm(Context context) {
        if(!enabled(context)){cancel(context);return;}
        long now=System.currentTimeMillis();
        // System Doze can deliver a late alarm at 01:00. Defer it; NEVER notify 00:00–06:59.
        if(PmmReminderClock.quiet(now)) {
            schedule(context,PmmReminderClock.quietEnd(now));
            return;
        }
        NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(nm!=null) {
            Intent open=new Intent(context,MainActivity.class).putExtra(EXTRA_OPEN_WISDOM,true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|
                              Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent tap=PendingIntent.getActivity(context,ALARM_REQUEST,open,
                    PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b=Build.VERSION.SDK_INT>=26
                    ?new Notification.Builder(context,CHANNEL_ID):new Notification.Builder(context);
            b.setSmallIcon(R.drawable.pmm_reminder_icon).setContentTitle(TITLE)
                    .setContentText(MESSAGE).setAutoCancel(true).setContentIntent(tap)
                    .setShowWhen(true).setDefaults(0).setSound(null).setVibrate(null)
                    .setOnlyAlertOnce(true);
            if(Build.VERSION.SDK_INT<26)b.setPriority(Notification.PRIORITY_LOW);
            try{nm.notify(NOTIFICATION_ID,b.build());}
            catch(SecurityException ignored){ /* Permission can be revoked at any time. */ }
        }
        schedule(context,PmmReminderClock.nextWisdom(System.currentTimeMillis(),
                prefs(context).getLong(ANCHOR,PmmReminderClock.normalizeWisdomAnchor(now)),frequency(context)));
    }
}
