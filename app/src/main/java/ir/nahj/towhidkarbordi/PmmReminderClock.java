package ir.nahj.towhidkarbordi;

import java.util.Calendar;

/** Local wall-clock reminder calculations, with no network or Android permissions. */
public final class PmmReminderClock {
    private PmmReminderClock() {}

    public static boolean quiet(long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        return c.get(Calendar.HOUR_OF_DAY) < 7;
    }

    public static long quietEnd(long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.set(Calendar.HOUR_OF_DAY, 7);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= now) c.add(Calendar.DAY_OF_YEAR, 1);
        return c.getTimeInMillis();
    }

    /** A consent at 00:00–06:59 is anchored to 07:00; otherwise keep hour/minute. */
    public static long normalizeWisdomAnchor(long activatedAt) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(activatedAt);
        if (c.get(Calendar.HOUR_OF_DAY) < 7) {
            c.set(Calendar.HOUR_OF_DAY, 7);
            c.set(Calendar.MINUTE, 0);
        }
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    private static void setClock(Calendar cal, int hour, int minute) {
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
    }

    /** Retains an activation weekday/day-of-month and time across DST and updates. */
    public static long nextWisdom(long after, long anchorMillis, String frequency) {
        Calendar anchor = Calendar.getInstance();
        anchor.setTimeInMillis(anchorMillis);
        int hour = anchor.get(Calendar.HOUR_OF_DAY), minute = anchor.get(Calendar.MINUTE);
        if (hour < 7) { hour = 7; minute = 0; }
        Calendar candidate = Calendar.getInstance();
        candidate.setTimeInMillis(after);
        if ("weekly".equals(frequency)) {
            int advance=(anchor.get(Calendar.DAY_OF_WEEK)-candidate.get(Calendar.DAY_OF_WEEK)+7)%7;
            candidate.add(Calendar.DAY_OF_YEAR, advance);
            setClock(candidate,hour,minute);
            if (candidate.getTimeInMillis() <= after) candidate.add(Calendar.DAY_OF_YEAR,7);
        } else if ("monthly".equals(frequency)) {
            int day=anchor.get(Calendar.DAY_OF_MONTH);
            candidate.set(Calendar.DAY_OF_MONTH, 1);
            candidate.set(Calendar.DAY_OF_MONTH,Math.min(day,candidate.getActualMaximum(Calendar.DAY_OF_MONTH)));
            setClock(candidate,hour,minute);
            if (candidate.getTimeInMillis() <= after) {
                candidate.set(Calendar.DAY_OF_MONTH,1);
                candidate.add(Calendar.MONTH,1);
                candidate.set(Calendar.DAY_OF_MONTH,Math.min(day,candidate.getActualMaximum(Calendar.DAY_OF_MONTH)));
                setClock(candidate,hour,minute);
            }
        } else {
            setClock(candidate,hour,minute);
            if (candidate.getTimeInMillis() <= after) candidate.add(Calendar.DAY_OF_YEAR,1);
        }
        return candidate.getTimeInMillis();
    }

    /** 00:00 is explicitly midnight at the END of the selected course day. */
    public static boolean validCourseTime(String value) {
        if (value == null || !value.matches("(?:00:00|(?:0[5-9]|1[0-9]|2[0-3]):[0-5][0-9])")) return false;
        return true;
    }

    public static long nextCourse(long after,String mode,int weekDay,String time) {
        if (!validCourseTime(time)) throw new IllegalArgumentException("Course time out of range");
        if (!"daily1".equals(mode) && !"daily2".equals(mode) && !"weekly".equals(mode))
            throw new IllegalArgumentException("Invalid course cadence");
        if ("weekly".equals(mode) && (weekDay < 0 || weekDay > 6))
            throw new IllegalArgumentException("Invalid weekday");
        int hour = Integer.parseInt(time.substring(0,2)), minute = Integer.parseInt(time.substring(3));
        Calendar candidate=Calendar.getInstance();
        candidate.setTimeInMillis(after);
        int offset="weekly".equals(mode)
                ? (weekDay - (candidate.get(Calendar.DAY_OF_WEEK)-1) + 7)%7 : 0;
        candidate.add(Calendar.DAY_OF_YEAR,offset);
        setClock(candidate,hour,minute);
        if (hour == 0) candidate.add(Calendar.DAY_OF_YEAR,1); // 12 midnight, end of plan day
        if (candidate.getTimeInMillis() <= after)
            candidate.add(Calendar.DAY_OF_YEAR,"weekly".equals(mode)?7:1);
        return candidate.getTimeInMillis();
    }
}
