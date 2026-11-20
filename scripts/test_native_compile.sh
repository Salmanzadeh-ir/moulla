#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$(mktemp -d)"
trap 'rm -rf "$BASE"' EXIT
for p in android/content/pm android/content android/app android/os ir/nahj/towhidkarbordi; do mkdir -p "$BASE/src/$p"; done
cat > "$BASE/src/android/Manifest.java" <<'EOF'
package android; public final class Manifest { public static final class permission { public static final String POST_NOTIFICATIONS="POST_NOTIFICATIONS"; } }
EOF
cat > "$BASE/src/android/os/Build.java" <<'EOF'
package android.os; public final class Build { public static final class VERSION { public static final int SDK_INT=34; } }
EOF
cat > "$BASE/src/android/content/pm/PackageManager.java" <<'EOF'
package android.content.pm; public final class PackageManager { public static final int PERMISSION_GRANTED=0; }
EOF
cat > "$BASE/src/android/content/Context.java" <<'EOF'
package android.content; public class Context { public static final String NOTIFICATION_SERVICE="notification",ALARM_SERVICE="alarm"; public static final int MODE_PRIVATE=0; public Context getApplicationContext(){return this;} public Object getSystemService(String name){return null;} public SharedPreferences getSharedPreferences(String name,int mode){return null;} public int checkSelfPermission(String permission){return 0;} }
EOF
cat > "$BASE/src/android/content/SharedPreferences.java" <<'EOF'
package android.content; public interface SharedPreferences { long getLong(String k,long d); boolean getBoolean(String k,boolean d); String getString(String k,String d); int getInt(String k,int d); Editor edit(); interface Editor { Editor putLong(String k,long v); Editor putBoolean(String k,boolean v); Editor putString(String k,String v); Editor putInt(String k,int v); Editor remove(String k); Editor clear(); void apply(); } }
EOF
cat > "$BASE/src/android/content/Intent.java" <<'EOF'
package android.content; public class Intent { public static final int FLAG_ACTIVITY_NEW_TASK=1,FLAG_ACTIVITY_CLEAR_TOP=2,FLAG_ACTIVITY_SINGLE_TOP=4; public static final String ACTION_BOOT_COMPLETED="boot",ACTION_TIME_CHANGED="time",ACTION_TIMEZONE_CHANGED="tz"; public Intent(Context c,Class<?> target){} public Intent setAction(String action){return this;} public Intent putExtra(String key,boolean value){return this;} public Intent addFlags(int flags){return this;} public String getAction(){return null;} }
EOF
cat > "$BASE/src/android/content/BroadcastReceiver.java" <<'EOF'
package android.content; public abstract class BroadcastReceiver { public abstract void onReceive(Context ctx,Intent intent); }
EOF
cat > "$BASE/src/android/app/PendingIntent.java" <<'EOF'
package android.app; import android.content.*; public class PendingIntent {public static final int FLAG_UPDATE_CURRENT=1,FLAG_IMMUTABLE=2; public static PendingIntent getActivity(Context c,int code,Intent i,int flags){return null;} public static PendingIntent getBroadcast(Context c,int code,Intent i,int flags){return null;} }
EOF
cat > "$BASE/src/android/app/AlarmManager.java" <<'EOF'
package android.app; public class AlarmManager { public static final int RTC_WAKEUP=0; public void setAndAllowWhileIdle(int mode,long at,PendingIntent intent){} public void cancel(PendingIntent intent){} }
EOF
cat > "$BASE/src/android/app/Notification.java" <<'EOF'
package android.app; import android.content.Context; public class Notification { public static final int PRIORITY_LOW=0; public static class Builder { public Builder(Context c){} public Builder(Context c,String channel){} public Builder setSmallIcon(int id){return this;} public Builder setContentTitle(String s){return this;} public Builder setContentText(String s){return this;} public Builder setAutoCancel(boolean b){return this;} public Builder setContentIntent(PendingIntent i){return this;} public Builder setShowWhen(boolean b){return this;} public Builder setDefaults(int i){return this;} public Builder setSound(Object sound){return this;} public Builder setVibrate(long[] pattern){return this;} public Builder setOnlyAlertOnce(boolean v){return this;} public Builder setPriority(int i){return this;} public Notification build(){return new Notification();} } }
EOF
cat > "$BASE/src/android/app/NotificationChannel.java" <<'EOF'
package android.app; public class NotificationChannel { public NotificationChannel(String id,String name,int importance){} public void setSound(Object uri,Object attrs){} public void setDescription(String s){} public void enableVibration(boolean v){} public void setShowBadge(boolean v){} }
EOF
cat > "$BASE/src/android/app/NotificationManager.java" <<'EOF'
package android.app; public class NotificationManager { public static final int IMPORTANCE_LOW=2; public boolean areNotificationsEnabled(){return true;} public void createNotificationChannel(NotificationChannel c){} public void notify(int id,Notification n){} }
EOF
cat > "$BASE/src/ir/nahj/towhidkarbordi/MainActivity.java" <<'EOF'
package ir.nahj.towhidkarbordi; public class MainActivity extends android.content.Context { }
EOF
cat > "$BASE/src/ir/nahj/towhidkarbordi/R.java" <<'EOF'
package ir.nahj.towhidkarbordi; public class R { public static final class drawable { public static final int pmm_reminder_icon=1; } }
EOF
javac -encoding UTF-8 -d "$BASE/classes" $(find "$BASE/src" -name '*.java') \
 "$ROOT/app/src/main/java/ir/nahj/towhidkarbordi/PmmReminderClock.java" \
 "$ROOT/app/src/main/java/ir/nahj/towhidkarbordi/CourseReminderScheduler.java" \
 "$ROOT/app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderScheduler.java" \
 "$ROOT/app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderReceiver.java"
echo 'PASS: all four native reminder Java classes compile against Android API-shaped stubs.'
