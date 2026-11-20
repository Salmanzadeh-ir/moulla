# Owner-approved v119 reminder implementation, awaiting full APK tests

'
          'First-run notification consent: Android 13+ OS prompt, older Androids an explicit in-app dialog.
'
          'Wisdom: wall-clock of initial consent, normalized to 07:00 for consent between 00:00 and 06:59, quiet-period notification suppression.
'
          'Course: daily one/two or chosen weekly weekday, user-selected local time 05:00–23:59 plus 00:00 end-of-day, on-device and silent.
'
          'After update/reboot/timezone reset both alarms, with independent PendingIntents and channels.
'
          'App content and MP3s are never fetched by reminder receivers.
'
          'No guarantee of exact-to-the-minute delivery because Android optimizes inexact alarms for battery.
'
          'Historical v118 lock remains untouched. No official release, market APK or signing modifications.
