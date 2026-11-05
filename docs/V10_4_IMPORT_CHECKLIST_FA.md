# دستورالعمل همگام‌سازی واقعی سورس V10.4 با مخزن

**هشدار:** ثبت اسناد وضعیت در GitHub به معنای بارگذاری کامل سورس و تصاویر V10.4 نیست. تا وقتی فایل‌ها انتقال نیافته‌اند، `main` را به عنوان نسخه V10.4 منتشر نکنید.

## فایل‌های ضروری جهت انتقال

- فایل اصلی بدون ویرایش: `app/src/main/assets/images/IMAGE_01_APPROVED_ORIGINAL.png`
- سورس آخرین بسته: `PayeMenbareMola_V10_4_Complete_Source.zip`
- ۱۸ تصویر: `app/src/main/assets/images/guest_album/01.jpg` ... `18.jpg`
- فایل اصلی `app/src/main/assets/index.html` با اصلاحات چرخش آلبوم و حفظ نسبت `941/1672`
- فایل `GUEST_ALBUM_FILES.json`، تنظیمات Gradle، MainActivity.java، اسناد و مانیفست
- آرشیو گزارش: `PayeMenbareMola_V10_4_COMPLETE_HANDOFF_PACKAGE.zip` (در گفت‌وگوی پروژه موجود است)

### کنترل اجباری تصویر مرجع

```bash
sha256sum app/src/main/assets/images/IMAGE_01_APPROVED_ORIGINAL.png
# EXPECTED:
# 6ebba68081773d58a63dd5f4ec25561f9fb8b86bea46ea62ca7e5e8866c973a1
```

### راهنمای ساخت و آزمایش

```bash
gradle --no-daemon :app:assembleDebug
$ANDROID_HOME/build-tools/35.0.0/zipalign -c -v 4 app/build/outputs/apk/debug/app-debug.apk
$ANDROID_HOME/build-tools/35.0.0/apksigner verify --verbose app/build/outputs/apk/debug/app-debug.apk
```

بررسی نصب در گوشی واقعی و گزارش خطا، پس از ساخت ضروری است.

**مانع انتقال در گفت‌وگوی فعلی:** اتصال موجود به GitHub امکان نوشتن فایل‌های متنی را دارد، ولی باینری‌های جدید از محیط فایل محلی گفتگو مستقیماً به آن قابل عبور نیستند. به همین دلیل تا زمان انتقال واقعی تصاویر و سورس، فایل‌های اجرایی فعلی مخزن را با ارجاع‌های شکسته جایگزین نکنید.
