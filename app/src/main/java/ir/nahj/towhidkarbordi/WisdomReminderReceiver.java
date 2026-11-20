package ir.nahj.towhidkarbordi;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Both independent, user-approved reminder streams share the system reboot/time hooks. */
public final class WisdomReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent) {
        if(intent==null)return;
        String action=intent.getAction();
        if(WisdomReminderScheduler.ACTION_REMIND.equals(action)) {
            WisdomReminderScheduler.onAlarm(context);
        } else if(CourseReminderScheduler.ACTION_REMIND.equals(action)) {
            CourseReminderScheduler.onAlarm(context);
        } else if(Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                  Intent.ACTION_TIME_CHANGED.equals(action) ||
                  Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            WisdomReminderScheduler.sync(context);
            CourseReminderScheduler.sync(context);
        }
    }
}
