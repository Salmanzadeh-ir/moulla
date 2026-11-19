# بسته انتقال کامل «پای منبر مولا» - ۱۹ نوامبر ۲۰۲۶

## مهم: هر دو ZIP تمام ۱۸۰ فایل برنامه را دارند؛ فقط پوشه historical releases/ داخل آنها نیست.\n          \n          ## تفاوت دو سورس
- PayeMenbareMola-v117-ACTIVE-MAIN-SOURCE.zip: وضعیت واقعی و فعال مخزن main در SHA 3c2ab679576337fb6a35786f88d8b737d4366a7b؛ شامل ۱۸۰ فایل قفل‌شده برنامه، همه مستندات و کنترل CI.
- PayeMenbareMola-v117-EXACT-BUILD-SOURCE-SNAPSHOT.zip: منبع دقیق بازسازی‌شده v117 از GitHub Actions و قفل‌شده در SHA 22ba3a952cc4e537b25bb731758ecc3c8b0bb965؛ ۱۸۰ فایل برنامه و مشخصات پایه پروژه.
- تفاوت مهم: فایل app/build.gradle در main عمداً همان شناسه و versionName قدیمی V16 را نگه داشته تا نسخه رسمی بازار تغییر نکند. برای ساخت APK آزمایشی با هویت v117، این فایل فقط در محیط موقت اجرای GitHub Actions تغییر می‌کند؛ هرگز بدون اجازه صاحب پروژه در main تغییر ندهید.

## وضعیت قفل و مالکیت
- مخزن: https://github.com/Salmanzadeh-ir/moulla
- شاخه فعال: main
- مرجع نهایی پس از قفل: snapshot/owner-v117-final-frozen-main-20261119
- مرجع سورس دقیق ساخت: snapshot/owner-v117-frozen-source-20261119
- مرجع قبل از ادغام v117: snapshot/owner-main-before-v117-20261119
- فهرست ۱۸۰ اثر انگشت: design/owner-v117-main-app-lock.json
- دستور قفل: OWNER_LOCK.md و AGENTS.md
- آزمون: python3 scripts/verify_owner_v117_lock.py
- آزمون موفق پس از ادغام: https://github.com/Salmanzadeh-ir/moulla/actions/runs/44506253476
- ساخت موفق APK آزمایشی v117: https://github.com/Salmanzadeh-ir/moulla/actions/runs/44502443550
- APK v117 قبلی: https://raw.githubusercontent.com/Salmanzadeh-ir/moulla/download/owner-back-icons-reminder-v117-trial-20261119/downloads/v117/PayeMenbareMola-v117-BACK-ICONS-REMINDER-TRIAL-DEBUG.apk
- SHA-256 APK قبلی: 3e491c0b1953d6e34b0fc751ad1bf03c770286e68d577f92cdade26bd7827240
- شاخه main دارای قفل اثر انگشت و CI است، ولی GitHub Rulesets برای جلوگیری اجباری از تغییرات هنوز فعال نشده.

## ساخت آزمایشی جدید در چت بعدی
1. قبل از هر کاری گزارش، AGENTS.md، OWNER_LOCK.md، design/owner-v117-main-app-lock.json و هر دو سورس را مطالعه کنید. هیچ تغییری در main، release، tags، snapshots یا کلید امضا بدون اجازه صریح مالک انجام ندهید.
2. در شاخه آزمایشی تازه، از main یا snapshot قفل‌شده نسخه بگیرید و برای تست، Java 17، Android SDK 35، Build Tools 35.0.0 و Gradle 8.7 را در GitHub Actions آماده کنید.
3. پیش از ساخت، صحت تمام ۱۸۰ فایل برنامه را با scripts/verify_owner_v117_lock.py روی منبع main بررسی کنید.
4. فقط در workspace ساخت، مقدار debug applicationIdSuffix را به مقدار جدید یکتا (مثلاً .trial118) و versionCode/versionName آزمایشی را به مقدار جدید تغییر دهید. با نمونه موجود در .github/workflows/build-owner-back-icons-reminder-v117-trial.yml در شاخه feature/owner-back-icons-reminder-v117-trial مقایسه کنید. به هویت رسمی، رمز یا keystore دست نزنید.
5. gradle --no-daemon :app:assembleDebug را اجرا کنید؛ پس از موفقیت، app/build/outputs/apk/debug/app-debug.apk را با apksigner، zipalign، aapt و sha256sum بررسی کنید.
6. APK واقعی را به‌عنوان Artifact و برای دانلود مستقیم در شاخه تازه و منحصربه‌فرد download/<trial-name> منتشر کنید؛ نام شاخه دانلود v117 قبلی را دوباره استفاده نکنید، چون Workflow اصلی شرط خالی‌بودن آن شاخه را دارد.
7. آزمایش روی گوشی واقعی را جداگانه انجام دهید. صرف موفقیت ساخت یا آزمون کد به معنی عملکرد تأییدشده گوشی نیست.
8. اگر هیچ تغییر جدیدی از مالک درخواست نشده است، شاخه اصلی یا فایل‌های قفل را حتی برای تمیزکاری/بهینه‌سازی تغییر ندهید.

## دسترسی به تمام تاریخچه مخزن
برای دریافت همه شاخه‌ها، تگ‌ها و تاریخچه، Git clone معمولی یا mirror انجام دهید:
git clone https://github.com/Salmanzadeh-ir/moulla.git
git clone --mirror https://github.com/Salmanzadeh-ir/moulla.git

این دو ZIP خروجی git archive هستند و تمام فایل‌های سورس/ساخت/اسناد در commit مربوط را دارند، اما به‌منظور دانلود روان، پوشه تاریخی releases/ حاوی APKهای قدیمی و قطعات تکراری آن عمداً حذف شده است؛ فایل‌های releases در مخزن اصلی GitHub دست‌نخورده و در دسترس هستند. پوشه .git و تاریخچه همه شاخه‌ها نیز در ZIP نیست. برای تاریخچه و باینری‌های تاریخی کامل از clone --mirror استفاده کنید.
