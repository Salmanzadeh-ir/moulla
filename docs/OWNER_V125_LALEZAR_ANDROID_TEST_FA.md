# نسخه آزمایشی v125 — شش عنوان اصلی با لاله‌زار درشت و وسط‌چین

**تاریخ:** ۲۰ نوامبر ۲۰۲۶  
**وضعیت:** APK آزمایشی آماده، CI سبز؛ منتظر تأیید واقعی مالک روی گوشی.

## تغییر دقیق نسبت به نسخه آزمایشی v124

- تنها فایل موجود برنامه که تغییر کرده `app/src/main/assets/index.html` است.
- فونت اصلی و آزاد **Lalezar Regular** با مجوز **SIL Open Font License 1.1** از [Google Fonts](https://github.com/google/fonts/tree/main/ofl/lalezar) همراه متن کامل مجوز در دو فایل `app/src/main/assets/fonts/Lalezar-Regular.ttf` و `Lalezar-OFL.txt` به APK اضافه شده است.
- **فقط شش عنوان اصلی صفحه اول** از لاله‌زار استفاده می‌کنند، همگی **وسط‌چین** و **تک‌خطی**، با اندازه حداکثر ممکن برای هر عنوان به صورت مستقل، نه یک اندازه کوچک مشترک برای تمام عناوین.
- تابع `fitHomeMainMenuTitles()` عرض واقعی متن را با Canvas و فونت بارگذاری‌شده محاسبه می‌کند؛ چرخش/تغییر عرض موبایل، ResizeObserver و `document.fonts.ready` آن را مجدداً تنظیم می‌کنند.
- سایر صفحه‌ها، بازگشت و خروج، پخش و دوره ۱۰۱۹ صوتی، شرط شنیدن دوسوم، اعلان‌ها، رضایت به‌روزرسانی، پخش پس‌زمینه و اصلاحات هفت‌گانه v124 بدون تغییر مانده‌اند.

## آزمون و تحویل

- [GitHub Actions Run 44728332789 — SUCCESS](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44728332789)
- [دانلود مستقیم APK از GitHub](https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-v125-lalezar-44728332789/downloads/v125/PayeMenbareMola-v125-LALEZAR-OWNER-TEST-DEBUG.apk)
- [پشتیبان GitHub Actions APK + SHA](https://github.com/Salmanzadeh-ir/moulla/actions/runs/44728332789/artifacts/14625745371)
- نام: `PayeMenbareMola-v125-LALEZAR-OWNER-TEST-DEBUG.apk`
- اندازه: **۳۲٬۳۱۴٬۶۲۸ بایت**
- SHA-256: **`b1815f92cbc0b5047584099d9545de9af1fbb3f672a57fa74d02a9f2ecbe77ee`** — خود فایل منتشرشده به‌صورت مستقیم دوباره دانلود و SHA آن تطبیق داده شد.
- شناسه نصب Debug مستقل `ir.nahj.towhidkarbordi.ownerlalezarreview125`؛ versionCode=125.
- **Commit دقیق سورس APK:** `5745d31303dbd89bf725a3cd68bd7c959cb0e694`.
- قفل آزمایشی دقیق **۱۹۹ فایل برنامه** در `design/owner-v125-test-app-lock.json`؛ ۱۹۶ فایل از ۱۹۷ فایل قبلی v124 کاملاً دست‌نخورده و فقط دو فایل فونت/مجوز اضافه شدند.
- آزمون‌های همه هفت اصلاح v124، ناوبری، یادداشت و پیشرفت دوره ۱۰۱۹ صوتی، اعلان، رضایت به‌روزرسانی، تست پنل محتوا در Mock، API 35/Gradle، امضای Debug و ZIP alignment موفق.

**آزمون واقعی روی گوشی هنوز ضروری است:** هر شش عنوان کامل، درشت، خوانا و وسط‌چین بوده و حتی در گوشی باریک دوخطی یا بریده نباشند؛ سایر قابلیت‌های قبلاً آزمایش‌شده بدون اختلال کار کنند. این نسخه هنوز تأیید نهایی مالک نیست.

**حفاظت:** `main` همچنان v119 تأییدشده و بدون تغییر است؛ شناسه نصب رسمی، امضای بازار، اطلاعات کاربران، APK بازار، تاریخچه و نسخه‌های قبلی حذف یا تغییر نکرده‌اند. تا تأیید صریح همین APK، ادغام در `main` انجام نشود.
