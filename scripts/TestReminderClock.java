import ir.nahj.towhidkarbordi.PmmReminderClock;
import java.util.Calendar;

public class TestReminderClock {
  static long at(int year,int month,int day,int hour,int minute) {
    Calendar c=Calendar.getInstance();c.clear();c.set(year,month-1,day,hour,minute,0);return c.getTimeInMillis();
  }
  static String show(long timestamp) {
    Calendar c=Calendar.getInstance();c.setTimeInMillis(timestamp);
    return c.get(Calendar.DAY_OF_MONTH)+" "+c.get(Calendar.HOUR_OF_DAY)+":"+c.get(Calendar.MINUTE);
  }
  static void expect(String label,boolean condition) {if(!condition)throw new AssertionError(label);System.out.println("PASS: "+label);}
  public static void main(String[] args) {
    long early=at(2026,11,20,3,42);
    long anchor=PmmReminderClock.normalizeWisdomAnchor(early);
    expect("wisdom quiet activation 03:42 -> 07:00",show(anchor).equals("20 7:0"));
    expect("wisdom initial morning notice today 7am",show(PmmReminderClock.nextWisdom(early,anchor,"daily")).equals("20 7:0"));
    long afternoon=at(2026,11,20,17,23);
    expect("wisdom activated 17:23 -> next day same clock",
      show(PmmReminderClock.nextWisdom(afternoon,PmmReminderClock.normalizeWisdomAnchor(afternoon),"daily")).equals("21 17:23"));
    expect("never a quiet period start for wisdom",!PmmReminderClock.quiet(PmmReminderClock.nextWisdom(afternoon,PmmReminderClock.normalizeWisdomAnchor(afternoon),"weekly")));
    expect("course 05:00 permitted",PmmReminderClock.validCourseTime("05:00"));
    expect("course 23:59 permitted",PmmReminderClock.validCourseTime("23:59"));
    expect("course 00:00 end of day permitted",PmmReminderClock.validCourseTime("00:00"));
    expect("course 04:59 rejected",!PmmReminderClock.validCourseTime("04:59"));
    expect("course 00:01 rejected",!PmmReminderClock.validCourseTime("00:01"));
    expect("course invalid hour rejected",!PmmReminderClock.validCourseTime("25:00"));
    long beforeMidnight=at(2026,11,20,23,35);
    expect("course end of day midnight is next day",
      show(PmmReminderClock.nextCourse(beforeMidnight,"daily1",-1,"00:00")).equals("21 0:0"));
    expect("course daily next 08:15",show(PmmReminderClock.nextCourse(at(2026,11,20,7,5),"daily2",-1,"08:15")).equals("20 8:15"));
    Calendar weekday=Calendar.getInstance();weekday.setTimeInMillis(at(2026,11,20,8,0));
    int sameWeekday=weekday.get(Calendar.DAY_OF_WEEK)-1;
    expect("weekly matching weekday today",show(PmmReminderClock.nextCourse(at(2026,11,20,8,0),"weekly",sameWeekday,"09:00")).equals("20 9:0"));
    expect("weekly matching weekday passed -> seven days",show(PmmReminderClock.nextCourse(at(2026,11,20,9,40),"weekly",sameWeekday,"09:00")).equals("27 9:0"));
    System.out.println("All reminder-clock tests passed.");
  }
}
