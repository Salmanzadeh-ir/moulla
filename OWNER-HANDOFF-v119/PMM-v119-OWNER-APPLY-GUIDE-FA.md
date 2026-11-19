# راهنمای اجرایی امن برای ثبت v119 در GitHub — ویژه مالک و چت بعدی

**وضعیت فعلی:** اعمال نشده در مخزن؛ آخرین main تأییدشده v118 با SHA `0fce031b91ffd90893482dba664a8bd0704fac98`. فقط بسته کد آماده است.

## فایل‌های لازم

- سورس کامل پایه v118 روی Commit دقیق از: https://github.com/Salmanzadeh-ir/moulla/archive/0fce031b91ffd90893482dba664a8bd0704fac98.zip
- بسته `PMM-v119-OWNER-SOURCE-DELTA-NOT-MERGED.zip` ـ در آن HTML و JS کامل اصلاحی و سه کلاس Java کامل موجودند؛ کلاس چهارم، `MainActivity.java`، **باید روی سورس واقعی پایه** با `scripts/patch_main_activity.py` اصلاح شود.
- گزارش جامع `PMM-v119-COMPLETE-PROJECT-REPORT-FA.md` و چک‌لیست زیر.

## اعمال با کمترین ریسک

**۱.** ابتدا اتصال GitHub و آخرین SHA را بررسی کن. استفاده از API خواندن فقط برای بررسی کافی است؛ برای Commit/PR نیاز به GitHub connector یا Work با حساب متصل مالک است.

**۲.** مخزن جدید و پاک:

```bash
git clone https://github.com/Salmanzadeh-ir/moulla.git
cd moulla
git fetch --all --tags
# الزام: همین SHA یا بررسی مستقل اگر main جلو رفته باشد
test "$(git rev-parse origin/main)" = 0fce031b91ffd90893482dba664a8bd0704fac98
git checkout 0fce031b91ffd90893482dba664a8bd0704fac98
git switch -c feature/owner-v119-tafal-course-reminders
test -z "$(git status --porcelain)"
```

**۳.** بسته v119 را از ZIP جدا استخراج و اسکریپت را با مسیر واقعی اجرا کن:

```bash
python3 /path/to/PMM-v119-unpacked/scripts/apply_to_checkout.py "$PWD"
git status --short
git diff --stat
git diff --check
```

اسکریپت، HEAD را با SHA ثابت، همه ۱۸۰ Git blob مندرج در lock v118 را با SHA-1 واقعی Git، دو کلاس جدید ناموجود و Clean Worktree را تأیید می‌کند؛ اگر ناسازگار بود **نباید** با Force یا Replace کلی اجرا شود. چند فایل دستورالعمل/آزمون/قفل جدید علاوه بر ۷ فایل app خواهند بود.

**۴.** فایل‌ها را دقیقاً stage کن:

```bash
git add app/src/main/assets/index.html \
 app/src/main/assets/pmm_offline_course.js \
 app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java \
 app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderScheduler.java \
 app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderReceiver.java \
 app/src/main/java/ir/nahj/towhidkarbordi/CourseReminderScheduler.java \
 app/src/main/java/ir/nahj/towhidkarbordi/PmmReminderClock.java \
 design/owner-v119-main-app-lock.json design/OWNER_V119_REMINDERS_FA.md \
 scripts/verify_owner_v119_lock.py scripts/TestReminderClock.java \
 scripts/test_course_state_compat.js scripts/test_native_compile.sh \
 .github/workflows/verify-layout-lock.yml AGENTS.md OWNER_LOCK.md
```

**۵.** آزمون‌ها:

```bash
python3 scripts/verify_owner_v119_lock.py
node --check app/src/main/assets/pmm_offline_course.js
node scripts/test_v16_back_navigation.js
node scripts/test_owner_v118_back_notes.cjs
node scripts/test_course_state_compat.js
javac -d /tmp/pmm-clock app/src/main/java/ir/nahj/towhidkarbordi/PmmReminderClock.java scripts/TestReminderClock.java
java -cp /tmp/pmm-clock TestReminderClock
bash scripts/test_native_compile.sh
git diff --cached --check
```

**۶.** ساخت Debug آزمایشی باید از SHA مشخص شاخه v119، با Java17، SDK35، Build Tools 35.0.0 و Gradle8.7 انجام شود. برای نداشتن خطر روی اپ رسمی، شناسه آزمایشی منحصر به فرد فقط در runner و پس از بررسی قفل اعمال شود. `app/build.gradle` در `main` ثابت بماند و Secrets رسمی برای Debug لازم نیست. آزمون‌های خروجی: `apksigner verify`، `zipalign -c -v 4`، `aapt dump badging` و SHA256. فایل را در **شاخه دانلود جدید** منتشر و لینک مستقیم را بازآزمایی کن. Workflow `build-v118-owner-review.yml` مخصوص v118 است و به‌صورت کور روی v119 بازاجرا نشود.

**۷.** پیش از ادغام، CI `verify-ui-lock` باید روی PR سبز باشد؛ پس از ادغام نیز اجرای همان آزمون در `main` سبز بماند. قفل v119 شمار ۱۸۲ دارد؛ قفل تاریخی ۱۸۰ فایل v118 را عوض نکن. هیچ Branch/Tag تاریخی را Force-push نکن.

**۸.** تست گوشی: Android 12 و 13+، اعلان اولیه و رد آن، ۰۳:۴۲→۰۷:۰۰، ۱۷:۲۳ و برنامه تکرار تفأل، سکوت شبانه، تنظیم ساعت دوره ۰۵:۰۰، ۲۳:۵۹، ۰۰:۰۰ و هفتگی، بازشدن صفحه با لمس اعلان، نبود دانلود صوت پیش از Play، حفظ یادداشت/پیشرفت، ریبوت، تغییر منطقه زمانی، قطع اینترنت، Doze و لغو پس از تکمیل دوره. اجرای زمان دقیق مطلق در Android با `setAndAllowWhileIdle` تضمین‌شدنی نیست.

## خروجی نهایی که باید تحویل مالک شود

Commit دقیق و URL آن، URL PR ادغام‌شده، URL Actions سبز، SHA256 APK v119، لینک مستقیم تست‌شده APK، لینک/ZIP کامل سورس v119 پس از اعمال، مستند وضعیت Rulesets و تأیید عدم تغییر APK رسمی/کلید/Release/تگ تاریخی. اگر هر مرحله واقعاً اجرا نشد، وضعیت را صریحاً «انجام‌نشده» ثبت کن.

## نکته اضطراری اتصال

در گفت‌وگوی تولید این بسته، GitHub connector از فهرست ابزارهای فعال ناپدید شده بود، Plugin Management نیز خطای داخلی داد و اینترنت container به `github.com` خطای DNS داد. هیچ Commit یا PR جدید v119 در آن گفت‌وگو انجام نشد. برای ادامه، اتصال GitHub یا Work mode با مرورگر متصل را از مالک بخواه و قبل از شروع write مجوزهای واقعی را چک کن.
