# پای منبر مولا — نقطه شروع واحد چت جدید (v119)

> **یک لینک برای انتقال کامل اطلاعات:** همین صفحه را به چت جدید بدهید. چت جدید باید سه فایل پایین و متن دستور را از همین مخزن بخواند؛ نیازی به بارگذاری مجدد فایل از گوشی نیست.

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
