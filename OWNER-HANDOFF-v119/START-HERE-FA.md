# پای منبر مولا — نقطه شروع واحد چت جدید (v119)

## تازه‌ترین تحویل مستقیم به مالک: v124، هفت اصلاح و پخش پس‌زمینه تمام صوت‌ها — ۲۰ نوامبر ۲۰۲۶

> آخرین وضعیت مقدم بر مطالب تاریخی پایین: **v124 Debug آزمایشی مستقیم، هر هفت اصلاح ثبت‌شده و CI موفق؛ آزمون مالک روی این APK هنوز باقی است**. `main` همچنان v119 تأییدشده و بدون تغییر، HEAD `c38804038eebd8bc62a36d9fc37cd305bdab1207`.

- **[دانلود مستقیم بدون ZIP نسخه v124](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v124-seven-fixes-44723623951/downloads/v124/PayeMenbareMola-v124-SEVEN-FIXES-OWNER-TEST-DEBUG.apk)**؛ package `ir.nahj.towhidkarbordi.ownersevenreview124`، versionCode124؛ SHA-256 **`770a2c1802026028844de31c58e04f1e6142250c96080b593929880974ddae4e`**. GitHub Actions [Run 44723623951 SUCCESS](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44723623951) فایل مستقیم را پس از انتشار دانلود و SHA آن را با APK امضاشده تطبیق داده است. [Artifact 14623032163](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44723623951/artifacts/14623032163).
- **[PR #20 در حالت Draft، بدون ادغام](https://github.com/Salmanzadeh-ir/moulla/pull/20)**؛ سورس `feature/owner-v124-seven-owner-fixes-test-20261120`، [راهنمای دقیق آزمون فارسی v124](https://github.com/Salmanzadeh-ir/moulla/blob/feature/owner-v124-seven-owner-fixes-test-20261120/docs/OWNER_V124_SEVEN_FIXES_TEST_FA.md) و قفل **۱۹۷ فایل** در `design/owner-v124-test-app-lock.json`.
- **هفت اصلاح**: متن رضایت محترمانه ورود؛ ضخیم‌تر شدن فونت شابلون در شش عنوان تک‌خطی؛ کارکرد بازگشت دوره آفلاین بدون تیک قوانین؛ حذف کامل ماژول ناخواسته نشانک/یادداشت تفأل از فایل‌های فعال؛ محدودسازی تنظیمات تفأل به چهار تکرار و Back ثابت؛ سرویس واحد پخش صوت بومی برای نهج/کافی/دوره با Play دستی و اندازه‌گیری زمان واقعی شنیدن برای شرط ۲/۳؛ اصلاح تمرکز دکمه Back پس از ایتا. **تست خودکار و ساخت موفق، نه تأیید فنیِ گوشی**.
- **مالک باید روی v124 همین SHA تأیید کند**: همه ۷ مورد به‌ویژه ادامه صوت در جابه‌جایی صفحات/خروج از اپ/قفل صفحه، عدم دانلود خودکار، گیت دوسوم و Back ایتا. قبل از تأیید مالک، نه `main` تغییر کند نه پاکسازی انجام شود. امضا/فونت رسمی بازار مجوز جداگانه می‌خواهد و پشتیبان نسخه قبل محفوظ بماند.

---

## تازه‌ترین خروجی آزمایشی مالک: v123 با فونت شابلون و به‌روزرسانی داخلی — ۲۰ نوامبر ۲۰۲۶

> **این جدیدترین وضعیت پروژه است و بر بندهای قدیمی پایین صفحه مقدم است.** `main` هنوز تنها منبع فعال **v119 تأییدشده** با HEAD `c38804038eebd8bc62a36d9fc37cd305bdab1207` است. نسخه **v123** فقط **Debug آزمایشی مستقل، ساخت موفق و در انتظار آزمایش/تأیید مالک** است؛ هنوز ادغام در `main` یا انتشار در بازار انجام نشده است.

- **[دانلود APK v123 از GitHub Actions](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44712680502/artifacts/14617753219)**، فایل داخلی `PayeMenbareMola-v123-FINAL-OWNER-TEST-DEBUG.apk`، حجم **۳۲٬۱۸۱٬۱۲۸ بایت**، SHA-256 واقعی **`2e298a037d6d1fd5a67808ea701de7eecfdaec0c41af8de55d4c53e2b6898118`**، شناسه نصب `ir.nahj.towhidkarbordi.ownerfinalreview123`، versionCode=123. [GitHub Actions Run 44712680502 با نتیجه SUCCESS](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44712680502)، `apksigner`، `zipalign`، `aapt`، SHA، Build و آزمون‌های رگرسیون PASS.
- **سورس آزمایشی** [Commit دقیق ساخت APK `da1a4d4c9202219cd846df2d23e0bdb02ed189da`](https://github.com/Salmanzadeh-ir/moulla/commit/da1a4d4c9202219cd846df2d23e0bdb02ed189da) روی `feature/owner-v123-final-unified-speed-review-20261120`. گزارش آزمون و راهنمای نصب [`docs/OWNER_V123_FINAL_OWNER_TEST_FA.md`](https://github.com/Salmanzadeh-ir/moulla/blob/feature/owner-v123-final-unified-speed-review-20261120/docs/OWNER_V123_FINAL_OWNER_TEST_FA.md).
- **اصلاحات:** فونت اصلی **A Shablon Cut** دانلودشده از لینک رسمی FontYab فقط برای شش عنوان اصلی، اندازه متناسب با عرض واقعی و یک‌خطی؛ جداسازی Exit فقط Home و Back همه صفحات فرعی و حذف Exit حک‌شده در تصویر آن‌ها؛ گالری ۱۰۵ عکس (۹۳ موجود + ۱۲ تاریخچه)، نشانک و یادداشت آفلاین ۴۸۹ حکمت، `DocumentFragment` برای ساخت یک‌مرحله‌ای دکمه‌های گالری و محاسبه اندازه فونت یک‌بار در هر frame برای کاهش دست‌کاری DOM. **بهبود عملکرد روی گوشی هنوز سنجش عددی نشده است.**
- **بروزرسانی داخلی:** در `main/v119` فایل به‌روزرسانی موجود بود ولی فراخوانی آغازین غیرفعال؛ `v123` آن را با رضایت مستقل کاربر و بررسی HTTPS Manifest (بدون دانلود/پخش خودکار) فعال کرده است. سورس پنل مدیریت `online-content/` در همین شاخه است؛ تست Mock موفق و در بررسی زنده قبلی `/admin`=200 و `/api/admin/state` بدون احراز هویت=401 بود؛ **ورود واقعی مالک و بارگذاری Production در این دوره تأیید نشده و Worker دوباره Deploy نشده است**.
- **قفل فایل‌های آزمایشی:** `design/owner-v123-test-app-lock.json` شامل **۱۹۷** فایل app؛ v119 ۱۸۲ فایل در `main` دست‌نخورده است. امضا/کلید/شناسه رسمی بازار، فایل Gradle اصلی، داده کاربران، قفل‌های تاریخی و APK رسمی تغییر نکرده‌اند. **مجوز بازتوزیع تجاری فونت شابلون قبل از Release رسمی جداگانه بررسی شود.**
- **آزمون واقعی مالک باقی است**: Home فقط خروج، هر زیرصفحه فقط بازگشت بدون تصویر خروج، فونت شابلون ۶ عنوان همگی تک‌خطی روی گوشی، اعلان تفأل و دوره، رضایت بررسی محتوای جدید، گالری ۱۰۵ عکس، دفترچه و پیشرفت ۱۰۱۹ صوت و بازگشت. APK با شناسه مستقل به‌طور خودکار اطلاعات نصب بازار را منتقل نمی‌کند. **تا تأیید صریح همین APK با همین SHA، ادغام در main و هر پاکسازی نسخه‌ها ممنوع است.**

---

## آخرین وضعیت یکپارچه‌سازی و پشتیبان مالک — ۲۰ نوامبر ۲۰۲۶

> **این بخش جدیدترین وضعیت مستند و مقدم بر تمام بخش‌های تاریخی پایین صفحه است.** مالک در گفتگو اعلام کرد فایل اصلی پشتیبان کامل روی گوشی دانلود شده و دستور ادامه یکپارچه‌سازی را داد. دانلود کامل گزارش شده، **اما هش SHA-256 فایل ذخیره‌شده روی خود گوشی هنوز به طور مستقل بررسی نشده است.**

- **تنها مرجع فعال و تأییدشده development:** `main` با سورس **v119** و HEAD [`c38804038eebd8bc62a36d9fc37cd305bdab1207`](https://github.com/Salmanzadeh-ir/moulla/commit/c38804038eebd8bc62a36d9fc37cd305bdab1207). تغییر آخر [PR #19](https://github.com/Salmanzadeh-ir/moulla/pull/19) فقط سیاست و ممیزی SHA بوده؛ فایل‌های `app/` و قفل تأییدشده **۱۸۲ فایل** تغییر نکرده‌اند. CI [قفل/رگرسیون موفق](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44687450940) و [gov CI موفق](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44687450943).
- **نسخه آزمایشی یکپارچه تازه v121 (هنوز تأیید گوشی ندارد):** شاخه `feature/owner-v121-unified-learning-safe-trial-20261120`. [GitHub Actions ساخت و آزمون واقعی موفق 44686143758](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44686143758)، APK `PayeMenbareMola-v121-OWNER-UNIFIED-TRIAL-DEBUG.apk`، دقیقاً **۳۰٬۱۱۹٬۱۴۲ بایت**، SHA-256 `f5d0092f1c821ea5c85dc7fb57c999d54407aacb0359819b6a682f9c142ccdb2`، [دانلود از Artifact 14606447442](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44686143758/artifacts/14606447442)، شناسه مستقل `ir.nahj.towhidkarbordi.ownerunifiedreview121`، versionCode=121. [Commit دقیق APK `d14e1048af2fc62e17f62b2dc0e23fe728a3162c`](https://github.com/Salmanzadeh-ir/moulla/commit/d14e1048af2fc62e17f62b2dc0e23fe728a3162c).
- **محدوده v121:** ۱۲ عکس تاریخی اصل + ۹۳ عکس ثابت = ۱۰۵؛ ابزار اختیاری آفلاین نشانک/یادداشت حکمت، موضوعات صرفاً واژه‌ای، برگزیده‌های کوتاه و حالت مطالعه آرام؛ قفل آزمایشی **۱۹۵ فایل**. هویت رسمی، پخش، ناوبری، دوره ۱۰۱۹ صوت، آستانه دوسوم، یادداشت صوت، اعلان‌ها و امضا دست‌نخورده‌اند. [گزارش کامل آزمون و مسیر پذیرش](https://github.com/Salmanzadeh-ir/moulla/blob/feature/owner-v121-unified-learning-safe-trial-20261120/docs/OWNER_V121_UNIFIED_TRIAL_FA.md). سرویس‌های اختیاری قدیمی Native (کش MP3، پخش پس‌زمینه، تایمر خواب) هنوز منتقل/تأیید نشده‌اند؛ «ادغام همه نسخه‌ها کامل شد» گفته نشود.
- **فایل اصلی پشتیبان روی گوشی:** [Artifact 14603476394](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44678498751/artifacts/14603476394)، ZIP ۳۸۷٬۵۵۹٬۰۰۶ بایت، SHA-256 `2b32807107ac7d44cbecb74881d51a42d452bb4201e17bf0b73d5909e1362a07`؛ [GitHub Actions به‌تازگی دوباره SHA سرور را تایید کرد](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44686986438)، اما بایت‌های کپی گوشی هنوز جداگانه تایید نشده‌اند.
- **ممیزی دقیق پاک‌سازی:** [Run 44686986438](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44686986438)، [فهرست نام و SHA همه شاخه‌ها Artifact 14606234171](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44686986438/artifacts/14606234171)، [سند در main](https://github.com/Salmanzadeh-ir/moulla/blob/main/docs/OWNER_VERIFIED_PHONE_BACKUP_CLEANUP_PLAN_FA.md): ۸۴ شاخه موجود، ۸۰ شاخه در پشتیبان اصلی، ۷۸ HEAD یکسان، **۲۹ نامزد فقط بررسی، ۵۵ مورد محفوظ**، ۴ SHA جدید و ۲ ref جابه‌جا شده. **صفر حذف**. تا تأیید APK v121، تعیین تکلیف سرویس‌های Native قدیمی، SHA کپی گوشی، پشتیبان افزایشی و تأیید فهرست موردی حذف توسط مالک، پاک‌سازی ممنوع.
- **Rulesets اجباری main/Tag** هنوز به‌وسیله connector قابل فعال‌سازی نیست؛ GitHub API آخرین بار `[]` نشان داده بود. تاریخچه، امضای بازار، تگ‌ها و Releaseها محفوظ‌اند.

---

## مرحله آزمایشی بعدی — v120 با ۱۰۵ عکس و بدون تغییر main (۲۰ نوامبر ۲۰۲۶)

> **جدیدترین گزارش در این صفحه؛ مقدم بر همه وضعیت‌های قدیمی:** پس از دستور مالک برای شروع ادغام همه نسخه‌ها، شاخه آزمایشی جدا `feature/owner-v120-restore-12-historical-photos-20261120` ساخته شد. **`main` هنوز v119 تأییدشده و Commit `12016838e98d8c1eadadbb0a96321f4855f1c5cd` است.** v120 فقط نام نسخه آزمایشی جدید است و هنوز تأیید گوشی یا اجازه ادغام ندارد.

- در [گزارش آزمون موفق v120 Run 44682609679](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44682609679)، ۱۲ فایل JPEG تاریخی اصلی v10.4.9 که تطابق بایتی در گالری فعلی نداشتند، بدون تغییر در عکس‌های ۱–۹۳، به شماره‌های ۹۴–۱۰۵ اضافه شدند. ۱۰۵ تصویر یکتا با SHAهای Git متمایز کنترل شد.
- قفل آزمایشی دقیق `design/owner-v120-gallery-review-app-lock.json` برای **۱۹۴ فایل** ساخته شد؛ ۱۸۲ فایل v119 بجز `photo_quotes_manifest.js` بایت‌به‌بایت بدون تغییر. آزمون‌های Back، یادداشت، صوت فقط با Play، دوره ۱۰۱۹ صوت، اعلان و Java native همگی Pass.
- [دانلود APK آزمایشی v120 از GitHub Actions Artifact](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44682609679/artifacts/14604239144)، فایل `PayeMenbareMola-v120-GALLERY105-OWNER-TRIAL-DEBUG.apk`، **۳۰٬۱۱۴٬۶۶۳ بایت**، **SHA-256 `54e957ea408492c17dce029a79a6016ba2ac07ea129076913a4a17a9b77578e1`**. applicationId آزمایشی مستقل `ir.nahj.towhidkarbordi.ownerphotoreview120`، versionCode=120، امضای Debug معتبر. [Commit دقیق سورس APK `21bc344cafd41a6c4144235a54c63f9f94d5fec8`](https://github.com/Salmanzadeh-ir/moulla/commit/21bc344cafd41a6c4144235a54c63f9f94d5fec8).
- [راهنمای دقیق آزمون گوشی و محدوده این نسخه آزمایشی](https://github.com/Salmanzadeh-ir/moulla/blob/feature/owner-v120-restore-12-historical-photos-20261120/docs/OWNER_V120_GALLERY105_TRIAL_FA.md).
- **این نسخه فقط ۱۲ تصویر تاریخی را بازمی‌گرداند**؛ ماژول‌های optional آموزشی/صوتی v108 هنوز بررسی و انتقال نشده‌اند. این نسخه را «ادغام تمام نسخه‌ها» یا «نسخه نهایی تأییدشده مالک» ننامید.
- پشتیبان قبلی کامل در [Run 44678498751](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44678498751/artifacts/14603476394) ساخته و بازیابی شد، مالک هنوز در حال دانلود روی گوشی بود. تأیید نگهداری مستقل و SHA روی گوشی دریافت نشده. **هیچ شاخه، تگ، Release، APK قدیمی یا تاریخچه حذف نشده‌اند.**

---

## وضعیت رسمی پس از ممیزی عمیق همه نسخه‌ها — ۲۰ نوامبر ۲۰۲۶

> **مقدم بر تمام بخش‌های تاریخی این صفحه.** نسخه فعال پروژه **فقط `main` با کد v119** است و *نه* ادعای ادغام بدون بررسی همه شاخه‌های قدیمی. آخرین Commit `main`: [`12016838e98d8c1eadadbb0a96321f4855f1c5cd`](https://github.com/Salmanzadeh-ir/moulla/commit/12016838e98d8c1eadadbb0a96321f4855f1c5cd). PR ابزار ممیزی [#18](https://github.com/Salmanzadeh-ir/moulla/pull/18) با **صفر تغییر در `app/`** ادغام شده و [CI قفل‌های تاریخی](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44680874855) و [CI سیاست نسخه واحد](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44680874908) پس از Merge هر دو **success** هستند.

- [گزارش معتبر ممیزی همه نسخه‌ها در main](https://github.com/Salmanzadeh-ir/moulla/blob/main/docs/OWNER_DEEP_UNIFICATION_AUDIT_20261120_FA.md): ۸۱ شاخه و ۶ تگ در زمان ممیزی؛ ۳۸ شاخه با Git blob برنامه متفاوت نسبت به base جداشدن؛ ۱۸ تصویر قدیمی با ۶ تطبیق دقیق و ۱۲ مورد نیازمند تصمیم؛ ماژول‌های آزمایشی قدیمی v108 دارای برخی قابلیت‌های اضافی بدون معادل دقیقِ ثابت‌شده در v119.
- [Run ممیزی کامل 81 شاخه + آزمون‌ها](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44679750448)، [تصویر تطبیق و داده‌های JSON](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44679750448/artifacts/14602834520)، [APK امضا/شناسه/هش واقعی Run 44680293745](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44680293745)، [CSV/JSON هر APK](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44680293745/artifacts/14603723235).
- **پشتیبان قابل دانلود برای گوشی:** [Artifact 14603476394](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44678498751/artifacts/14603476394)، ZIP اصلی `PayeMenbareMola-COMPLETE-OWNER-BACKUP-44678498751.zip`، **۳۸۷٬۵۵۹٬۰۰۶ بایت**، SHA-256 `2b32807107ac7d44cbecb74881d51a42d452bb4201e17bf0b73d5909e1362a07`. در Actions دو بار recovery و hash pass شده؛ **دریافت و صحت فایل روی گوشی مالک هنوز تایید نشده**. شامل ۸۰ شاخه هنگام تهیه و ۸ Release asset.
- **خطر انتشار رسمی:** بسته `ir.nahj.towhidkarbordi` از v10.4.9 رسمی versionCode=15 گواهی امضای متفاوت از APK بازار 10.5.1 versionCode=26 دارد؛ نباید جایگزینی مستقیم با حفظ داده فرض شود. `app/build.gradle` رسمی دست‌نخورده، versionCode=16 و نباید برای بازار بدون مجوز جداگانه استفاده شود.
- **ادغام تغییرات عملکردی/حذف هنوز انجام نشده:** `main` تحت قفل ۱۸۲ فایل و v119 گوشی‌تاییدشده باقی است. ۱۲ تصویر قدیمی و ماژول‌های اختیاری v108 نیازمند بررسی تأیید مالک؛ هر نسخه عملکردی تازه نیازمند Debug APK مستقل و تأیید همان APK است. حذف فقط بعد از SHA-256 و حفظ فایل توسط مالک روی گوشی، تصمیم درباره موارد اختلافی، و موافقت دقیق با فهرست حذف. در [Issue #17](https://github.com/Salmanzadeh-ir/moulla/issues/17) پیگیری شود.
- [سورس کامل main در این نقطه](https://github.com/Salmanzadeh-ir/moulla/archive/12016838e98d8c1eadadbb0a96321f4855f1c5cd.zip)؛ [APK v119 گوشی‌تاییدشده با SHA درست](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v119-review-44670627786-1/downloads/v119/PayeMenbareMola-v119-OWNER-REVIEW-DEBUG.apk) با SHA-256 `94702d41e292a8d84f7cdc0ad4af8e5ce5ae1727c68cc0cfb568d03d99e438e2`.

---

> **یک لینک برای انتقال کامل اطلاعات:** همین صفحه را به چت جدید بدهید. چت جدید باید سه فایل پایین و متن دستور را از همین مخزن بخواند؛ نیازی به بارگذاری مجدد فایل از گوشی نیست.

## وضعیت نهایی رسمی v119 — ادغام در main و CI موفق (۲۰ نوامبر ۲۰۲۶)

> **جدیدترین وضعیت — مقدم بر تمام گزارش‌های قدیمی در پایین صفحه.** مالک آزمایش نسخه v119 روی گوشی را صریحاً تأیید کرد و درخواست تکمیل ادغام داد. PR شماره ۱۵ در GitHub ادغام شد؛ این دیگر «فقط بسته آماده یا PR باز» نیست.

- **Commit نهایی فعلی main، مستقیماً تأییدشده:** [`ca1dd669f181e328071567b3e41b4bf06744895b`](https://github.com/Salmanzadeh-ir/moulla/commit/ca1dd669f181e328071567b3e41b4bf06744895b).
- **PR ادغام‌شده:** [#15](https://github.com/Salmanzadeh-ir/moulla/pull/15)، وضعیت `merged: true` و `closed`، Merge عادی برای حفظ تاریخچه.
- **CI خودکار بعد از ادغام در main:** [Actions Run 44671672004](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44671672004)، نتیجه نهایی **success** با job `verify-ui-lock`. پیش از ادغام نیز [Run 44670904838](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44670904838) **success** بوده است.
- **قفل فعال:** [`design/owner-v119-main-app-lock.json`](https://github.com/Salmanzadeh-ir/moulla/blob/main/design/owner-v119-main-app-lock.json) با دقیقاً **۱۸۲** entry فایل app؛ فایل قفل تاریخی v118 با ۱۸۰ entry و قفل تاریخی v117 نسبت به Commit مبنا SHA ثابت دارند. `app/build.gradle` رسمی نیز blob SHA ثابت `7a0961e43a670c6914a6f65809daa9594669b478` دارد.
- **تغییرات سورس main نسبت به v118:** فقط ۱۶ فایل مجاز v119، شامل ۵ فایل app و ۲ کلاس تازه، اسناد، قفل و آزمون‌ها. نسخه رسمی بازار و امضا/Secrets/تگ‌های تاریخی دست‌نخورده‌اند.
- **[دانلود ZIP سورس کامل main نسخه ادغام‌شده v119](https://github.com/Salmanzadeh-ir/moulla/archive/ca1dd669f181e328071567b3e41b4bf06744895b.zip)**.
- **[دانلود مستقیم APK آزمایشی v119](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v119-review-44670627786-1/downloads/v119/PayeMenbareMola-v119-OWNER-REVIEW-DEBUG.apk)**، package آزمایشی مستقل `ir.nahj.towhidkarbordi.ownerreview119` و SHA-256 واقعی و کنترل‌شده `94702d41e292a8d84f7cdc0ad4af8e5ce5ae1727c68cc0cfb568d03d99e438e2`. [ساخت موفق Run 44670627786](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44670627786)؛ [تأیید دانلود عمومی و SHA Run 44671078072](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44671078072).
- **نکته:** موفقیت CI به‌معنای انتشار رسمی در بازار نیست و این ادغام فقط سورس `main` را به v119 رسانده است. قفل سمت فایل/آزمون فعال است، اما Rulesets اجباری سمت سرور پیش‌تر خالی مشاهده شده‌اند؛ چنین حفاظتی را فعال‌شده ادعا نکنید.

---

## به‌روزرسانی راستی‌آزمایی‌شده پس از انتقال — ۲۰ نوامبر ۲۰۲۶

> **این بخش جدیدتر از «وضعیت تأییدشده» پایین صفحه است.** مطالب پایین تاریخچه لحظه انتقال‌اند؛ اکنون v119 در شاخه مستقل اعمال و APK آزمایشی ساخته شده، اما هنوز در main ادغام نشده است.

- **main در آخرین بررسی:** همان v118 با SHA `0fce031b91ffd90893482dba664a8bd0704fac98`.
- **سورس v119 در شاخه مجزا:** `feature/owner-v119-tafal-course-reminders` با Commit نهایی [7554ee346d44ec39328a924c87976049dbf10852](https://github.com/Salmanzadeh-ir/moulla/commit/7554ee346d44ec39328a924c87976049dbf10852).
- **PR ثبت‌شده و باز، هنوز ادغام نشده:** [Pull Request #15](https://github.com/Salmanzadeh-ir/moulla/pull/15)، شامل ۱۶ فایل تغییر و قفل ۱۸۲ فایل app.
- **ساخت واقعی Android Debug، آزمون‌ها، apksigner، zipalign، badging، SHA و بارگذاری:** [Actions Run 44670627786 — success](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44670627786).
- **CI بر روی PR، حفاظت v119 و تاریخچه v118/v117/V16/V10.4.9:** [Actions Run 44670904838 — success](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44670904838)، job `verify-ui-lock`.
- **آزمایش دانلود عمومی فایل APK، تطبیق بایت‌ها با SHA و دسترسی URL آرشیو کامل:** [Actions Run 44671078072 — success](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44671078072).
- **[دانلود مستقیم APK آزمایشی v119](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v119-review-44670627786-1/downloads/v119/PayeMenbareMola-v119-OWNER-REVIEW-DEBUG.apk)**؛ ۲۹٬۲۰۳٬۱۴۳ بایت؛ Package مستقل `ir.nahj.towhidkarbordi.ownerreview119`.
- **SHA-256 نسخه قابل دانلود:** `94702d41e292a8d84f7cdc0ad4af8e5ce5ae1727c68cc0cfb568d03d99e438e2`؛ [SHA256SUMS.txt](https://github.com/Salmanzadeh-ir/moulla/blob/download/owner-v119-review-44670627786-1/downloads/v119/SHA256SUMS.txt).
- **[دانلود ZIP سورس کامل اعمال‌شده v119](https://github.com/Salmanzadeh-ir/moulla/archive/7554ee346d44ec39328a924c87976049dbf10852.zip)**.
- **اصلاح ایمن الگوی patch:** در بسته اصلی شرط تطبیق دقیق `@Override public void onNewIntent` با v118 حقیقی (`protected`) تفاوت داشت؛ الگوی فایل اسکریپت فقط در محیط موقت رانر، با بررسی یکتایی دقیق، هماهنگ شد. محتوای ZIP اصلی و قفل‌های v117/v118 تغییر نکرد.
- **کار باقی‌مانده:** بررسی اعلان‌ها روی گوشی واقعی Android 12 و Android 13+، ریبوت/تغییر ساعت/منطقه زمانی، لمس اعلان بدون دانلود MP3 قبل از Play و سازگاری داده‌ها توسط مالک. بدون تأیید آزمون گوشی، PR نباید ادغام شود. نسخه رسمی بازار، Secrets، امضا و Git refs تاریخی تغییری نکرده‌اند. Rulesets مخزن در آخرین API query خالی (`[]`) بوده و محافظت سمت سرور برای main فعال گزارش نشده است.

---


## وضعیت تأییدشده — ۲۰ نوامبر ۲۰۲۶

- مخزن اصلی: https://github.com/Salmanzadeh-ir/moulla
- آخرین Commit اصلی (`main`) که مستقیماً بررسی شده: `0fce031b91ffd90893482dba664a8bd0704fac98` (v118).
- **v118 تأییدشده**: بازگشت متنی با فونت Estedad، فهرست یادداشت‌های متصل به صوت، جلوگیری از بافر اضافی MP3. همه ۱۸۰ فایل v118 با `design/owner-v118-main-app-lock.json` قفل هستند.
- **v119 هنوز اعمال و ادغام نشده است**: اصلاح اعلان تفأل و یادآور دوره آفلاین فقط به‌صورت بسته کد/گزارش/راهنما آماده است. هیچ APK رسمی یا آزمایشی v119 تأیید نشده.
- این شاخه `owner-v119-handoff-20261120` صرفاً **محفظه انتقال فایل‌ها** است؛ ایجاد آن به معنی ثبت اصلاحات v119 در `main` نیست. هیچ فایل کد برنامه، قفل تاریخی یا نسخه رسمی در `main` توسط این بسته تغییر داده نشده است.

## سه فایل اصلی لازم — روی همین GitHub

۱. **[بسته کدهای v119، ابزار اعمال و آزمون‌ها](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/owner-v119-handoff-20261120/OWNER-HANDOFF-v119/PMM-v119-OWNER-SOURCE-DELTA-NOT-MERGED.zip)**

   `PMM-v119-OWNER-SOURCE-DELTA-NOT-MERGED.zip` — ZIP معتبر، ۱۳۹٬۰۲۴ بایت، ۱۸ ورودی. SHA-256:
   `208aaa74911663ff54848db0a29c78f4acc82dfafdcea0dacac3255a2ba603a4`

   در ZIP موجودند: `scripts/apply_to_checkout.py`، `patch_main_activity.py`، `edit_web_assets.py`، `test_activity_patch_safety.py`، `test_native_compile.sh`، `test_course_state_compat.js`، `TestReminderClock.java`، فایل‌های HTML/JS تغییر یافته و کلاس‌های Java مربوط به Reminder.

۲. **[گزارش جامع پروژه، تاریخچه و وضعیت واقعی](https://github.com/Salmanzadeh-ir/moulla/blob/owner-v119-handoff-20261120/OWNER-HANDOFF-v119/PMM-v119-COMPLETE-PROJECT-REPORT-FA.md)**

   `PMM-v119-COMPLETE-PROJECT-REPORT-FA.md` — SHA-256:
   `fb18269d1f04af78f71dc7f993343b29492e747da8d88ae2ca09519238cde6bc`

۳. **[راهنمای اعمال ایمن v119 روی v118](https://github.com/Salmanzadeh-ir/moulla/blob/owner-v119-handoff-20261120/OWNER-HANDOFF-v119/PMM-v119-OWNER-APPLY-GUIDE-FA.md)**

   `PMM-v119-OWNER-APPLY-GUIDE-FA.md` — SHA-256:
   `2615b6ac3547b75ef8b9f76cf61f30c6fda277a9cefcea6da54ef36df3f846e3`

**متن کامل آماده چت بعدی** نیز جداگانه در همین شاخه هست: [PMM-NEXT-CHAT-START-HERE-FA.txt](https://github.com/Salmanzadeh-ir/moulla/blob/owner-v119-handoff-20261120/OWNER-HANDOFF-v119/PMM-NEXT-CHAT-START-HERE-FA.txt).

## سورس کاملِ پایه برای اعمال تغییرات

**[سورس مرجع v118 — دانلود ZIP مستقیم از GitHub](https://github.com/Salmanzadeh-ir/moulla/archive/0fce031b91ffd90893482dba664a8bd0704fac98.zip)**

بسته v119 بالا فقط **تغییرات و ابزار اعمال (delta)** است، نه سورس مستقل کامل. ابتدا همین Commit دقیق v118 را دریافت کنید، طبق راهنما اسکریپت محافظت‌شده را تنها روی checkout تمیز آن اجرا کنید و صحت SHA و قفل v118 را پیش از هر دست‌کاری بررسی کنید.

## محدوده دستور صریح مالک

**تفأل:** درخواست مجوز در ورود اولیه؛ Android 13+ مجوز سیستمی، Android 12 و پایین‌تر رضایت صریح داخل برنامه؛ فقط با تأیید فعال شود. ساعت محلی اولین تأیید مبنای تکرار؛ از ۰۰:۰۰ تا ۰۶:۵۹ اعلان ارسال نشود و موعد به ۰۷:۰۰ منتقل گردد. امکان خاموش/روزانه/هفتگی/ماهانه و پایداری تنظیمات بعد از آپدیت/ری‌استارت.

**دوره آفلاین:** دریافت ساعت یادآوری همراه با تنظیم روزی ۱/۲ صوت یا هفته‌ای ۱ صوت؛ ساعات ۰۵:۰۰ تا ۲۳:۵۹ و ۰۰:۰۰ فقط به معنای انتهای روز. اعلان محلی با متن **«قرار امروز، پای منبر مولا»**؛ ورود به دوره با لمس اعلان، بدون دریافت MP3 قبل از Play؛ حفظ دفترچه، پیشرفت و گیت دوسوم شنیدن. قطع اعلان پس از اتمام ۱۰۱۹ صوت.

**حدود تغییرات:** نسخه‌های رسمی بازار، امضا و Keystore، `app/build.gradle` رسمی، فایل‌های v117/v118 قفل‌شده خارج از مجوز، Branch/Tag قدیمی، فونت‌ها، تصاویر و سایر ویژگی‌ها نباید تغییر کنند. فقط با شاخه مستقل، PR، آزمون کامل، APK Debug مستقل و بررسی مالک پیش بروید. GitHub Rulesets روی `main` در آخرین بررسی هنوز فعال نشده بود؛ بعداً مجدداً بررسی شود.

## دستور لازم برای چت بعدی

این لینک را به چت جدید بدهید و بگویید:

> «این صفحه GitHub بسته انتقال رسمی من برای ادامه پروژه پای منبر مولا است. همه سه فایل و متن راهنما را مستقیم از GitHub بخوان. ابتدا وضعیت واقعی مخزن و Commit فعلی main را کنترل کن، تغییرات v119 را با حفاظت v118 و نگهداری تاریخچه در شاخه مستقل اعمال کن، آزمون‌ها و ساخت APK Debug را انجام بده و نتیجه واقعی را با لینک Commit/PR/CI/APK و SHA-256 اعلام کن. نسخه رسمی را تغییر نده و هیچ موفقیتی را قبل از راستی‌آزمایی اعلام نکن.»

## لینک‌های تاریخی مهم

- [آخرین ادغام رسمی کد برنامه v118 — PR 14](https://github.com/Salmanzadeh-ir/moulla/pull/14)
- [ساخت موفق APK آزمایشی v118](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44603122562)
- [آزمون قفل v118 پس از ادغام](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44606447716)
- [قفل v118 در main](https://github.com/Salmanzadeh-ir/moulla/blob/main/design/owner-v118-main-app-lock.json)
- [تنظیمات Rulesets مالک](https://github.com/Salmanzadeh-ir/moulla/settings/rules)

**تأیید آرشیو:** ZIP و متن‌ها بر اساس فایل‌های واقعی تهیه‌شده در گفتگو با هش‌های بالا به این شاخه منتقل شده‌اند. ارائه این لینک به چت بعدی کافی است؛ نیازی به آپلود فایل حجیم در گفتگو نیست.
