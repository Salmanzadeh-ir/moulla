پای منبر مولا — نسخه آزمایشی دوره آفلاین نهج‌البلاغه‌خوانی v111

این سورس بر اساس بسته‌ای است که مالک برای بازطراحی صفحه اصلی بارگذاری کرد.

تغییرهای مجاز این مرحله فقط شامل سه فایل برنامه است:
- app/src/main/assets/index.html
- app/src/main/assets/pmm_offline_course_logic.js
- app/src/main/assets/pmm_offline_course.js

تمام ۱۰۱۹ لینک MP3 از کاتالوگ اصلی استفاده می‌شوند. محتوا و فایل‌های دیگر برنامه قفل شده‌اند.

ساخت APK آزمایشی:
- Workflow: .github/workflows/build-owner-offline-course-v111-trial.yml
- Branch: feature/owner-offline-nahj-course-v111-trial-20261118
- Package: ir.nahj.towhidkarbordi.offlinecourse111
- versionCode: 28
- versionName: 10.5.3-offline-course-trial-debug
- امضای Debug مستقل؛ هیچ کلید Release یا رمز بازار در این بسته وجود ندارد.

Workflow باید روی GitHub Actions اجرا شود. این محیط به Android SDK/Gradle دسترسی نداشت و اتصال GitHub نیز در زمان آماده‌سازی خطای داخلی داشت؛ بنابراین APK هنوز در این بسته وجود ندارد.

پیش‌نمایش مرورگری جداگانه در فایل ZIP دیگری تحویل شده است. برای پخش صوت MP3 اینترنت لازم است؛ برنامه، یادداشت‌ها و پیشرفت روی دستگاه ذخیره می‌شوند.

نسخه رسمی بازار ۱۰.۵.۱، کلید امضا، رمز، main و snapshotهای قبلی دست‌نخورده‌اند.
