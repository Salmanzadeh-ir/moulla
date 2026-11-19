# گزارش جامع، وضعیت مخزن و بسته انتقال پروژه «پای منبر مولا» — آمادگی v119

**تاریخ گزارش:** ۲۰ نوامبر ۲۰۲۶ (۲۹ آبان ۱۴۰۵)  
**مخزن:** https://github.com/Salmanzadeh-ir/moulla  
**اصل مهم:** این گزارش میان «تأییدشده در GitHub»، «ساخته و آزموده‌شده»، و «صرفاً آماده اعمال» تفکیک می‌کند. هر موردی که در این جلسه در GitHub اعمال نشده است، صراحتاً با وضعیت *اعمال‌نشده* مشخص شده است.

## ۰. خلاصه اجرایی و وضعیت حقیقی

| مؤلفه | وضعیت قابل اتکا |
|---|---|
| آخرین سورس اصلی ثبت‌شده و آزمون‌شده | v118 در `main`، Commit `0fce031b91ffd90893482dba664a8bd0704fac98` |
| آخرین APK با ساخت موفق و تأیید صریح مالک | v118 Debug، GitHub Actions Run `44603122562`، SHA256 `3493b203c9ce13b7c4e81874262051b6dabe514e01c6a31b2b7792340c1e8edb` |
| بهبودهای v119 برای یادآور تفأل و دوره آفلاین | **کد آماده و تست اولیه موفق، ولی هنوز در GitHub ثبت نشده** |
| APK اندرویدی v119 | **ساخته نشده؛ وجود ندارد** |
| ثبت نهایی v119 در `main`، PR، Merge و Actions | **انجام نشده**؛ در این نوبت هیچ ابزار متصل GitHubِ خواندن/نوشتن در فهرست ابزارهای دستیار وجود نداشت و شبکه مستقیم محیط نیز به GitHub دسترسی DNS نداشت |
| حفاظت `main` با Rulesets سمت سرور | آخرین مشاهده قبلی `protected: false` و Rulesets خالی؛ این جلسه تأیید روزآمد ممکن نشد |
| تغییری در APK رسمی بازار، امضا، کلیدها، تگ‌ها یا مراجع تاریخی | **هیچ تغییری در این نوبت انجام نشده است** |

**درخواست جاری مالک:** «مخزن را با تغییرات ثبت‌نشده به‌روزرسانی کن، گزارش کامل و متن آغاز چت بعدی بده، لینک دانلود جدا برای مالک و لینک سورس جدید قرار بده.» در این نوبت همه فایل‌های تحویل، آموزش و آزمون بازبینی شدند، ولی به‌علت عدم دسترسی نوشتن GitHub، مخزن و `main` تغییر داده نشدند. برای چت بعدی دستور انجام عملیات تا انتها ثبت شده است. هیچ ادعای انتشار v119 یا ساخت APK v119 صحیح نیست.

## ۱. هویت فنی پروژه و اصول حفاظت

- نام برنامه: **پای منبر مولا**؛ مالک مخزن: `Salmanzadeh-ir`؛ repo: `moulla`.
- پلتفرم: Android Java + WebView با محتوای HTML، CSS، JavaScript محلی و پل محدود `PMMNative` برای امکانات بومی.
- محیط ساخت موفق پیشین: Java 17، Android SDK/compile SDK 35، Build Tools 35.0.0 و Gradle 8.7؛ ساخت APK به‌صورت GitHub Actions.
- بخش‌های عمده: شش گزینه اصلی، شرح نهج‌البلاغه و صوت خطبه/نامه/حکمت، دو زیرمنوی توحید کاربردی و دیدن خدا در زندگی، کلیپ‌ها، گالری ۹۳ تصویر، تفأل و حکمت‌ها، شرح اصول کافی، دوره برنامه‌دار ۱۰۱۹ صوتی با یادداشت، ثبت دوسوم شنیدن، تنظیم سرعت و ادامه پخش.
- سیاست کلیدی صوتی: ورود به صفحه، ساخت فهرست، بازگشت یا بازکردن یادداشت نباید باعث دانلود MP3 شود؛ **فقط Play کاربر** مجوز اتصال منبع صوت و دریافت آن است؛ هنگام ترک بخش بافر قبلی آزاد شود.
- قفل تاریخی v117 و قفل فعال v118: اثرانگشت دقیق فایل‌های `app/` به‌همراه آزمون `verify-ui-lock`. هر تغییر تازه باید مجوز صریح مالک، شاخه مستقل، قفل جدید و تست CI داشته باشد. قفل تاریخی را هرگز به گذشته بازنویسی نکنید.
- فایل `app/build.gradle` عمداً مشخصات V16/نسخه سابق را حفظ کرده و نباید در `main` برای تغییر هویت یا امضا دستکاری شود. هویت مستقل Debug فقط در runner ساخت اعمال شود.
- نسخه رسمی بازار، APKهای تاریخی، شاخه‌های `release/*`، تگ‌های `v10.4.9` و سایر مراجع، امضا و Secrets ممنوع‌التغییرند مگر مجوز **جداگانه** مالک.
- کاربر در آخرین دستور **اجازه به‌روزرسانی مخزن با اصلاحات یادآور v119** را صریحاً داده است؛ این دستور جایگزین اجازه انتشار رسمی یا تغییر برنامه‌های دیگر نیست.

## ۲. سوابق نسخه‌ها و Commitهای ضروری

| رخداد | مرجع / لینک |
|---|---|
| مخزن اصلی | https://github.com/Salmanzadeh-ir/moulla |
| آخرین `main` تأییدشده v118 | https://github.com/Salmanzadeh-ir/moulla/commit/0fce031b91ffd90893482dba664a8bd0704fac98 |
| نمایش آخرین سورس ثبت‌شده | https://github.com/Salmanzadeh-ir/moulla/tree/0fce031b91ffd90893482dba664a8bd0704fac98 |
| ZIP سورس پایه v118 به‌شکل آرشیو GitHub (نیازمند دسترسی به GitHub) | https://github.com/Salmanzadeh-ir/moulla/archive/0fce031b91ffd90893482dba664a8bd0704fac98.zip |
| ادغام تغییرات مورد تأیید v118 | https://github.com/Salmanzadeh-ir/moulla/pull/14 |
| آزمایش قفل بعد از ادغام v118 | https://github.com/Salmanzadeh-ir/moulla/actions/runs/44606447716 |
| سورس شاخه آزمایشی که APK v118 از آن ساخته شد | https://github.com/Salmanzadeh-ir/moulla/tree/feature/owner-v118-back-text-linked-notes-preview-20261119 |
| ساخت APK v118، اعتبار امضای Debug و آپلود | https://github.com/Salmanzadeh-ir/moulla/actions/runs/44603122562 |
| APK مستقیم v118، تأیید انتشار قبلی | https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v118-ui-notes-44603122562-1/downloads/v118/PayeMenbareMola-v118-OWNER-REVIEW-DEBUG.apk |
| SHA مربوط به APK v118 در GitHub | https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v118-ui-notes-44603122562-1/downloads/v118/SHA256SUMS.txt |
| قفل کنونی v118 | https://github.com/Salmanzadeh-ir/moulla/blob/main/design/owner-v118-main-app-lock.json |
| آزمون قفل v118 | https://github.com/Salmanzadeh-ir/moulla/blob/main/scripts/verify_owner_v118_lock.py |
| گردش کار حفاظت v118 | https://github.com/Salmanzadeh-ir/moulla/blob/main/.github/workflows/verify-layout-lock.yml |
| قواعد مالک | https://github.com/Salmanzadeh-ir/moulla/blob/main/OWNER_LOCK.md |
| دستور عوامل کدنویسی | https://github.com/Salmanzadeh-ir/moulla/blob/main/AGENTS.md |
| سورس مرجع v117 ـ Commit فعال تاریخی | https://github.com/Salmanzadeh-ir/moulla/commit/3c2ab679576337fb6a35786f88d8b737d4366a7b |
| Snapshot بنای APK v117 | https://github.com/Salmanzadeh-ir/moulla/tree/snapshot/owner-v117-frozen-source-20261119 |
| Snapshot نهایی main v117 | https://github.com/Salmanzadeh-ir/moulla/tree/snapshot/owner-v117-final-frozen-main-20261119 |
| قفل تاریخی v117 | https://github.com/Salmanzadeh-ir/moulla/blob/main/design/owner-v117-main-app-lock.json |
| مرجع رسمی تأییدشده قدیمی | https://github.com/Salmanzadeh-ir/moulla/tree/v10.4.9 |
| Workflow امن بازسازی v117 | https://github.com/Salmanzadeh-ir/moulla/blob/main/.github/workflows/build-v117-owner-manual-rebuild.yml |
| PR اصلاح Workflow امن v117 | https://github.com/Salmanzadeh-ir/moulla/pull/13 |
| درخواست تاریخی اصلاح صوت | https://github.com/Salmanzadeh-ir/moulla/pull/12 ؛ تغییرات آن بعداً در سورس v118 ثبت شده‌اند؛ وضعیت PR قدیمی را از GitHub مجدداً بررسی کنید |
| تنظیمات Rulesets مدیریتی | https://github.com/Salmanzadeh-ir/moulla/settings/rules |

**مهم:** لینک ZIP GitHub برای Commit مشخص، لینک آرشیو *پایه v118* است، نه سورس اعمال‌شده v119. چون دسترسی GitHub این نوبت برقرار نبود، دانلودپذیری لینک‌های GitHub در این جلسه مجدداً آزمایش نشد. فایل v119 مستقلِ قابل دانلود از این گفتگو **بسته تغییرات سورس و دستور اعمال** است، نه آرشیو کامل همه فایل‌های مخزن. برای تهیه ZIP کامل v119 ابتدا آرشیو/کلون پایه v118 لازم است.

## ۳. تاریخچه عملکرد تأییدشده تا v118

- v111: دوره برنامه‌دار ۱۰۱۹ صوت با برنامه روزی ۱، روزی ۲ یا هفته‌ای ۱؛ پیشرفت و ثبت دوسوم شنیدن واقعی؛ یادداشت اختصاصی هر صوت، سرعت و ذخیره جای شنیدن.
- v112–v116: بهبودهای محدود ظاهر، بازگشت، مسیرهای درونی، ابعاد کارت‌ها، زیرمنوها و آیکون‌های موردنظر مالک.
- v113: قاعده ممنوعیت درخواست MP3 قبل از Play کاربر و جلوگیری از دانلود اضافی.
- v117: بازگشت متحدالشکل با تصویر، دو لوگوی تصویری «الله» و «کعبه»، انتقال تنظیم یادآوری به چرخ‌دنده تفأل، قفل ۱۸۰ فایل و APK مستقل تست‌شده.
- اصلاح صوت بعد از v117: آزادسازی منابع صوتی غیرفعال شرح نهج‌البلاغه و دوره، پس از ثبت موقعیت شنیدن.
- v118: **با تأیید صریح مالک**، تبدیل شکل بازگشت به متن «بازگشت» با فونت مخزن «PMM Estedad»؛ نمایش کامل یادداشت‌های ذخیره‌شده در فهرست «یادداشت‌ها»، عنوان صوت، مسیر لمس برای بازگشت به صوت همان یادداشت؛ حفظ همان آیکون کوچک دفترچه و ممنوعیت دانلود صوت پیش از Play.
- APK v118 مشخصات آزمایشی: Debug جدا با package `ir.nahj.towhidkarbordi.ownerreview118`، versionCode `35`، versionName `10.5.10-owner-review-118-debug`؛ SHA256 بالا. **با اپ رسمی به‌سبب تفاوت package جداگانه نصب می‌شود؛ داده‌های `localStorage` دو بسته به‌صورت خودکار یکسان نیستند.**
- Lock v118: ۱۸۰ فایل؛ دو فایل نسبت به v117 تغییر کردند: `app/src/main/assets/index.html` با Git blob SHA1 `759056c5b8cb6cad399b1eebf5551106b89b4742` و `app/src/main/assets/pmm_offline_course.js` با Git blob SHA1 `274b15a07e941dba8ea460e17f1aa3cf5d2bc3ba`؛ ۱۷۸ فایل دیگر بدون تغییر. قفل اصلی v117 همچنان محفوظ.

## ۴. دستور جدید مالک برای v119 ـ متن دقیق رفتار مدنظر

### تفأل به نهج‌البلاغه

۱. **لحظه ورود نخست**، درخواست اجازه اعلان نمایش داده شود؛ در Android 13+ مجوز واقعی سیستم `POST_NOTIFICATIONS` و در اندرویدهای قدیمی‌تر که این نوع مجوز سیستمی ندارند، گفت‌وگوی رضایت آشکار داخل برنامه؛ اگر کاربر رد کرد هیچ اعلان فعال نشود. با تأیید، یادآور تفأل فعال شود.  
۲. ساعت و دقیقه زمان **فعال‌سازی/رضایت**، مبنای تکرار آن کاربر باشد (روزی/هفتگی/ماهی).  
۳. اعلان تفأل از ۰۰:۰۰ تا قبل از ۰۷:۰۰ نباید نمایش داده شود؛ فعال‌سازی شبانه در این فاصله به ساعت ۰۷:۰۰ تبدیل گردد.  
۴. تنظیمات در به‌روزرسانی برنامه، راه‌اندازی مجدد گوشی و تغییر ساعت/منطقه زمانی حفظ و باززمان‌بندی شوند؛ خاموش کردن توسط کاربر محترم شمرده شود.  
۵. اعلان‌ها محلی و بی‌صدا باشند و هیچ فایل صوتی خودکار دریافت نشود.

### دوره آفلاین نهج‌البلاغه

۱. کنار انتخاب برنامه روزی ۱، روزی ۲ یا هفته‌ای ۱ صوت، **انتخاب ساعت یادآوری** افزوده شود؛ ساعت دلخواه در دامنه ۰۵:۰۰ تا ۲۳:۵۹، و ۰۰:۰۰ به معنی نیمه‌شب پایان روز مجاز است.  
۲. روزانه یک اعلان در روزهای برنامه روزانه و یک اعلان در روز هفته منتخب برای برنامه هفتگی؛ دو صوت در روز لزوماً به دو اعلان تبدیل نشود مگر فرمان تازه مالک.  
۳. عنوان اعلان دقیقاً **«قرار امروز، پای منبر مولا»** باشد.  
۴. لمس اعلان برنامه را به دوره ببرد؛ دانلود MP3 تا Play ممنوع.  
۵. داده‌های برنامه قبلی، یادداشت‌ها، موقعیت شنیدن، شرط دوسوم، وضعیت تکمیل ۱۰۱۹ صوت و سایر قسمت‌ها حفظ شوند.  
۶. اگر برنامه قدیمیِ ذخیره‌شده ساعت یادآوری ندارد، زمان تصادفی یا پیش‌فرض را به‌صورت اعلان فعال تحمیل نکنید؛ پس از ورود کاربر به تنظیم برنامه، ساعت با آگاهی کاربر ذخیره شود.  
۷. یادآور دوره پس از تکمیل دوره غیرفعال شود؛ پس از ریبوت و تغییر ساعت قابل بازیابی باشد.

**تفسیر نیازمند توجه در زمان آزمون:** در کد آماده، «نوبت اول تفأل» اولین نوبت زمان‌بندی‌شده بعد از فعال‌سازی است، نه اعلان فوری لحظه تأیید؛ قاعده آزمایشی قدیمی «۵ دقیقه پس از نخستین ورود» حذف شده است. صحت این تفسیر با درخواست مالک هنگام آزمون APK بررسی شود. همچنین به‌دلیل محدودیت‌های Android Doze/OEM، تحویل دقیق دقیقه‌ای با `setAndAllowWhileIdle` تضمین‌شدنی نیست؛ پکیج درخواست مجوز Exact Alarm یا فرایند پرمصرف پس‌زمینه اضافه نکرده است.

## ۵. کد آماده v119 ـ محتویات دقیق بسته

**پوشه منبع بسته:** `PMM-v119-Tafal-Course-Reminders-CODE-PREPARED-NOT-APPLIED.zip` و بسته جدید `PMM-v119-OWNER-SOURCE-DELTA-NOT-MERGED.zip`. نسخه دوم با راهنما و ثبت اثرانگشت مجدد آماده شده است. هر دو فقط تغییرات و ابزارهای لازم برای اعمال روی سورس v118 را دربردارند؛ **هیچ‌یک سورس کامل مخزن نیستند**.

**فایل‌های برنامه که قرار است تغییر کنند (۵ فایل):**

- `app/src/main/assets/index.html` ـ متن تنظیم تفأل، ورودی ساعت و CSS تنظیمات ساعت در بخش دوره.
- `app/src/main/assets/pmm_offline_course.js` ـ ذخیره ساعت در plan، حفظ داده‌های قدیمی و فراخوانی رابط یادآور بومی؛ هماهنگی پس از تکمیل.
- `app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java` ـ **نسخه کامل این فایل داخل بسته نیست**؛ اسکریپت `scripts/patch_main_activity.py` آن را بر سورس اصلی صحیح v118 با جایگزینی‌های محدود اعمال می‌کند و اگر قطعه‌ای مطابق نبود رد می‌کند.
- `app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderScheduler.java` ـ ساعت مبنای فعال‌سازی، تکرار و سکوت شبانه و حفظ رضایت.
- `app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderReceiver.java` ـ دو مسیر اعلان و بازیابی پس از ریبوت/تغییر ساعت.

**دو فایل کلاس بومی تازه (تعداد فایل‌های app از ۱۸۰ به ۱۸۲):**

- `app/src/main/java/ir/nahj/towhidkarbordi/CourseReminderScheduler.java` ـ زمان‌بندی مجزا و اعلان «قرار امروز، پای منبر مولا» و بازکردن صفحه دوره.
- `app/src/main/java/ir/nahj/towhidkarbordi/PmmReminderClock.java` ـ محاسبه زمان‌های محلی و سکوت شبانه، سازگار با Calendar و ماه/هفته.

**ابزارهای اعمال و آزمون داخل بسته:**

- `scripts/apply_to_checkout.py`: فقط از کپی تمیز `main@0fce031...` و فقط پس از بررسی Git blob SHA تمام ۱۸۰ فایل اقدام می‌کند. از هرگونه اعمال مجدد/تداخل جلوگیری می‌کند؛ هیچ Push/Merge انجام نمی‌دهد.
- `scripts/patch_main_activity.py`: اعمال دقیق ۱۰ جایگزینی در MainActivity؛ بدون متن کامل پایه کار نمی‌کند.
- `scripts/edit_web_assets.py`: سند و ابزار تغییرات محدود HTML/JS هنگام ساخت بسته.
- `scripts/TestReminderClock.java`: ۱۴ تست زمان‌بندی.
- `scripts/test_course_state_compat.js`: حفظ state و یادداشت‌های نسخه قدیم.
- `scripts/test_activity_patch_safety.py`: بررسی محدوده الگوهای تغییر.
- `scripts/test_native_compile.sh`: بررسی کامپایل جاوا با stubهای رابط Android؛ **جایگزین ساخت Android SDK نیست**.

**فایل‌هایی که اسکریپت اعمال در سورس واقعی تولید/به‌روز می‌کند:**

- `design/owner-v119-main-app-lock.json`: قفل جدید **۱۸۲** فایل app، بدون تغییر قفل ۱۸۰ فایل v118.
- `design/OWNER_V119_REMINDERS_FA.md`: گزارش مجوز و محدوده تغییرات v119.
- `scripts/verify_owner_v119_lock.py`: کنترل کامل blob hashes هر ۱۸۲ فایل.
- `.github/workflows/verify-layout-lock.yml`: حفظ نام check الزامی `verify-ui-lock`، اضافه‌شدن تست‌های v119 و بررسی تاریخی v118/v117/V16/V10.4.9.
- `AGENTS.md` و `OWNER_LOCK.md`: افزودن مقدمه تازه v119؛ حفظ متن تاریخی قبل.

**فایل‌های حساس که نباید تغییر کنند:** `app/build.gradle`، `app/src/main/AndroidManifest.xml` (مجوز `POST_NOTIFICATIONS` و گیرنده BOOT قبلاً وجود دارند)، همه فایل‌های داده/صوت/گالری/فونت، APK رسمی، امضا، Secrets، تمام snapshotها و تگ‌های قدیمی، فایل قفل v118.

## ۶. آزمون‌هایی که واقعاً انجام شده‌اند

- اجرای `javac` روی `PmmReminderClock.java` و `TestReminderClock.java` و اجرای ۱۴ تست: **PASS**؛ شامل ۰۳:۴۲→۰۷:۰۰، ساعت ثابت ۱۷:۲۳، تکرار روزانه/هفتگی، ۰۵:۰۰، ۲۳:۵۹، ۰۰:۰۰ پایان روز و رد ۰۴:۵۹/۰۰:۰۱.
- `node --check app/src/main/assets/pmm_offline_course.js`: **PASS**.
- `node scripts/test_course_state_compat.js`: **PASS**؛ برنامه قدیمی، یادداشت‌ها و موقعیت شنیدن باقی می‌مانند؛ ساعت جدید بدون اجازه اختراع نمی‌شود.
- `python scripts/test_activity_patch_safety.py`: **PASS** روی ورودی نمونه؛ نه روی سورس واقعی MainActivity v118.
- `bash scripts/test_native_compile.sh`: **PASS** برای چهار کلاس اعلان در مقابل نمونه‌تعاریف (stubs) Android؛ نه Android SDK واقعی.
- آزمون‌های قبلی بسته اولیه شامل بررسی ۷ قطعه JS داخل HTML نیز موفق گزارش شده‌اند.
- اعتبار APK **v118** مستقل: SHA256 فایل موجود در این چت دقیقاً `3493b203c9ce13b7c4e81874262051b6dabe514e01c6a31b2b7792340c1e8edb` است و با `SHA256SUMS.txt` داخل artifact GitHub قدیمی تطبیق مجدد داده شد.

**آزمون‌هایی که انجام نشده و نباید به‌عنوان موفق گزارش شوند:** اعمال روی تمام سورس واقعی v118، کامپایل واقعی v119 با Android SDK، GitHub Actions v119، ساخت/امضای APK v119، نصب و تست روی گوشی، آزمون تحویل اعلان در پس‌زمینه/Doze/ری‌استارت/منطقه زمانی/نسخه‌های اندروید، PR یا Merge v119.

## ۷. روش ایمن تکمیل کار توسط چت بعدی / توسعه‌دهنده

**گام ۱ — اتصال:** ابتدا ابزارهای متصل GitHub را پیدا و دسترسی خواندن/نوشتن مخزن را آزمون کن. اگر ابزار مدیریت Ruleset نیست، ادعای روشن‌بودن حفاظت سمت سرور نکن. با وب صرفاً عمومی نمی‌توان تغییر در repo اعمال کرد؛ از Work با مرورگر متصل به حساب مالک یا اتصال GitHub استفاده شود.

**گام ۲ — تثبیت مبنا:** تازه‌ترین `main` و سورس آن را بخوان. اگر SHA هنوز `0fce031b91ffd90893482dba664a8bd0704fac98` است، یک شاخه مستقل مانند `feature/owner-v119-tafal-course-reminders` از همان Commit بساز. اگر SHA تغییر کرده، ابتدا diff و اثر آن را دقیق بازبینی کن؛ هرگز حدسی روی نسخه دیگر patch نزن.

**گام ۳ — استخراج و اعمال:** بسته سورس v119 این تحویل را باز کن؛ کلون تمیز v118 و بدون تغییر داشته باش. دستور `python3 /PATH/TO/PATCH/scripts/apply_to_checkout.py /PATH/TO/CLONE` را اجرا کن. اسکریپت باید Git blob SHA، clean worktree، قفل ۱۸۰ فایل، وجود نداشتن کلاس‌های جدید و HEAD دقیق را تأیید کند. اگر شکست خورد، هرگز force یا global replace نکن.

```bash
git clone https://github.com/Salmanzadeh-ir/moulla.git
cd moulla
git fetch --all --tags
git checkout 0fce031b91ffd90893482dba664a8bd0704fac98
git switch -c feature/owner-v119-tafal-course-reminders
python3 /path/to/unzipped/scripts/apply_to_checkout.py "$PWD"
git status --short
# فقط ۵ فایل app اصلاحی و ۲ فایل کلاس تازه، به‌همراه آزمون، قفل و راهنما باید وجود داشته باشند.
```

**گام ۴ — تست پیش از PR:**

```bash
git add app/src/main/assets/index.html app/src/main/assets/pmm_offline_course.js \
 app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java \
 app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderScheduler.java \
 app/src/main/java/ir/nahj/towhidkarbordi/WisdomReminderReceiver.java \
 app/src/main/java/ir/nahj/towhidkarbordi/CourseReminderScheduler.java \
 app/src/main/java/ir/nahj/towhidkarbordi/PmmReminderClock.java \
 design/owner-v119-main-app-lock.json design/OWNER_V119_REMINDERS_FA.md \
 scripts/verify_owner_v119_lock.py scripts/TestReminderClock.java \
 scripts/test_course_state_compat.js scripts/test_native_compile.sh \
 .github/workflows/verify-layout-lock.yml AGENTS.md OWNER_LOCK.md
python3 scripts/verify_owner_v119_lock.py
node scripts/test_v16_back_navigation.js
node scripts/test_owner_v118_back_notes.cjs
node --check app/src/main/assets/pmm_offline_course.js
node scripts/test_course_state_compat.js
bash scripts/test_native_compile.sh
git diff --cached --check
```

**گام ۵ — ساخت APK آزمایشی:** روی GitHub Actions یک Workflow مستقل بساز که SHA قفل‌شده شاخه v119 را checkout کند، lock182 و تست‌ها را اجرا کند، Java17 + SDK35/BuildTools35 + Gradle8.7 را آماده کند و فقط داخل runner `applicationIdSuffix`، versionCode/versionName Debug یکتا اعمال کند. از ساخت Workflow قدیمی که patchهای تاریخی را بازپخش می‌کند استفاده نکن. APK خروجی را با `apksigner`, `zipalign`, `aapt`, SHA256 و اجرای واقعی روی گوشی کنترل کن. انتشار فقط در شاخه دانلود جدید با نام یکتای run انجام شود؛ هرگز فایل دانلود قبلی را overwrite نکن.

**گام ۶ — تست‌های واقعی اعلان:** رضایت/رد اولیه در Android <=12 و >=13؛ فعال‌سازی تفأل در ۰۳:۴۲ و ۱۷:۲۳؛ سکوت شبانه ۰۰–۰۷ حتی هنگام تأخیر alarm؛ تغییر روزانه/هفتگی/ماهانه/خاموش؛ ساعت دوره ۰۵:۰۰/۲۳:۵۹/۰۰:۰۰ و رد موارد خارج؛ روز هفته انتخابی؛ بازگشت از لمس اعلان به همان صفحه، بدون MP3 قبل Play؛ بستن برنامه و Force Stop (توجه: force-stop توسط کاربر می‌تواند Alarmها را متوقف کند)، reboot، Timezone/Time set، محدودیت باتری، revoke/grant permission، حفظ پیشرفت و یادداشت‌ها و مهاجرت v118 به v119 در همان package.

**گام ۷ — ثبت مخزن:** پس از تأیید تست‌های قابل انجام و مجوز مالک برای همین تغییرات (در چت فعلی صریح داده شده)، PR با توضیح Diff، SHA و آزمون‌ها ایجاد کن؛ CI check `verify-ui-lock` را موفق کن و ادغام در `main` را انجام بده. سپس SHA نهایی، لینک PR، Run موفق، SHA256 APK و لینک مستقیم دانلود **واقعاً آزمایش‌شده** را به مالک بده. نسخه رسمی و تاریخی untouched.

**گام ۸ — باقیمانده امنیت GitHub:** آخرین وضعیت Rulesets قبلی فاقد قفل سمت سرور بود. مستقلاً بررسی کن؛ اعمال Rulesets فقط با دسترسی Admin GitHub و تنظیمی که به‌اشتباه خود مالک را از Merge محروم نکند. هیچ ادغام یا انتشار نباید با ادعای جعلی «protected» همراه شود.

## ۸. مخاطرات و نکات فنی که باید در چت بعدی آزموده شوند

۱. **ابهام اولین اعلان:** ساعت تأیید/فعال‌سازی مبنای تکرار است؛ در بسته فعلی اولین رخداد، نوبت بعدی است، نه اعلان فوری؛ این مسئله با مالک در تست روشن شود، بدون تغییر خودسرانه سیاست.  
۲. **مهاجرت تفأل:** کاربران قبلی v118 ممکن است `consent=true` ولی timestamp لنگر فعال‌سازی جدید نداشته باشند. در کد آماده هنگام نخستین sync پس از آپدیت لنگر ساخته می‌شود؛ ساعت فعال‌سازی تاریخی پیش از v119 قابل بازیابی قطعی نیست.  
۳. **اعلان غیر دقیق:** `AlarmManager.setAndAllowWhileIdle` ممکن است عقب بیفتد و اعلان زمان دقیق تضمین ندارد. بهینه‌سازی باتری بعضی تولیدکنندگان شدیدتر است.  
۴. **تفاوت package:** اگر APK آزمایشی با شناسه مستقل بسازی، داده‌های v118 آزمایشی یا اپ بازار به‌طور خودکار به آن منتقل نمی‌شوند؛ تست مهاجرت باید روی package سازگار و بدون پاک‌کردن داده انجام شود.  
۵. **Force Stop:** پس از Force Stop صریح از تنظیمات اندروید، زمان‌بندی‌ها ممکن است تا اجرای دوباره برنامه فعال نشوند.  
۶. **مجوز اعلان:** هیچ اپی نمی‌تواند بدون رضایت واقعی کاربر، مجوز سیستم‌عامل را تضمین کند؛ در Android <=12 باید از گفت‌وگوی رضایت خود برنامه استفاده شود.  
۷. **تکمیل دوره:** `CourseReminderScheduler.clearPlan` باید بعد از رسیدن تعداد شنیده‌شده‌ها به ۱۰۱۹ اجرا و روی گوشی تست شود.  
۸. **امنیت اتصال JS به Java:** ورودی‌های ساعت، روز هفته و mode باید در Java کنترل شوند. کد آماده این محدودیت‌ها را دارد؛ تست یکپارچه لازم است.  
۹. **نتیجه آزمون کد جاوا:** استاب‌ها و بررسی نحو در این گفتگو موفق شده‌اند، اما پذیرش بدون ساخت واقعی Android و دستگاه صحیح نیست.  
۱۰. **قفل تاریخی:** هیچ‌گاه `design/owner-v118-main-app-lock.json` را با هش جدید جایگزین نکن؛ v119 قفل مستقل ۱۸۲ فایلی خواهد داشت.  
۱۱. **بازگشت به برنامه از اعلان:** `MainActivity.openCourseIfPending` و `openWisdomIfPending` باید روی سردشروع و `onNewIntent` واقعی آزموده شوند.  
۱۲. **پایداری زمان محلی:** تغییر ساعت گوشی، DST و timezone باید روی برنامه‌ها کنترل شوند.  
۱۳. **تأخیر و دوگانگی اعلان:** روی `onResume` و دریافت Alarm نزدیک زمان مقرر احتمال جاافتادن یا تکرار را در سناریوی Doze بررسی کن؛ از اعلام تضمین صددرصدی خودداری کن.

## ۹. لینک‌ها و فایل‌های لازم برای مالک و چت بعدی

**دسته A: آرشیو مالک برای نگهداری مستقل**

- `PMM-v119-OWNER-SOURCE-DELTA-NOT-MERGED.zip` — کامل‌ترین **سورس تغییرات v119** و ابزار اجرای patch، نه کل سورس مخزن.
- `PayeMenbareMola-v118-OWNER-REVIEW-DEBUG.apk` — آخرین APK ساخته‌شده، موفق و تأییدشده برای بازگشت ایمن؛ **نه APK v119**.
- `PayeMenbareMola-v118-OWNER-REVIEW-ARTIFACT.zip` — ZIP اصل artifact با APK، SHA256SUMS و اطلاعات package برای بررسی ثانویه.
- `PMM-v119-COMPLETE-PROJECT-REPORT-FA.md` — همین گزارش جامع.
- `PMM-v119-OWNER-APPLY-GUIDE-FA.md` — راهنمای اعمال و آزمون محافظت‌شده.
- `PMM-v119-SHA256SUMS.txt` — کنترل یکپارچگی بسته‌ها.
- `PayeMenbareMola-v117-FULL-REPORT-FA(1).md` — تاریخچه کامل v117 و سوابق قدیمی که برای تحلیل گذشته مفید است.
- سورس **کامل پایه v118** را از لینک آرشیو GitHub روی Commit دقیق بالا ذخیره کنید؛ چون بسته v119، delta است و آرشیو کامل محلی v118 در این نوبت موجود نبود. برای backup همه Git refs: `git clone --mirror`.

**دسته B: آغاز چت بعدی**

- `PMM-NEXT-CHAT-START-HERE-FA.txt` — متن مستقل آماده Copy/Paste با مسیر انجام و هشدارها.
- این گزارش و بسته ZIP v119 باید به چت بعدی **ضمیمه** شود؛ لینک‌های `sandbox:/...` لزوماً در یک گفت‌وگوی جدید قابل خواندن نیستند؛ فایل‌ها را دانلود و مجدداً آپلود کنید.

## ۱۰. نتیجه نهایی و محدودیت صریح

**اطمینان از ثبت در GitHub مربوط به v118 است، نه v119.** در این نوبت نه GitHub نوشتن در دسترس بود، نه قابلیت شبکه مستقیم GitHub؛ لذا هیچ Commit، PR، Merge، Run یا APK جدید v119 ایجاد نشد. انجام آزمایش‌های اولیه و تهیه بسته کد «ثبت مخزن» محسوب نمی‌شود. دقیق‌ترین نقطه شروع چت بعدی عبارت است از: **دریافت و بررسی تازه `main`، شاخه‌سازی امن، اجرای patch محافظت‌شده v119، تست lock182 و Android، ایجاد PR، ادغام کنترل‌شده و ساخت APK آزمایشی**. تمام مراجع رسمی و تاریخی باید حفظ شوند.
