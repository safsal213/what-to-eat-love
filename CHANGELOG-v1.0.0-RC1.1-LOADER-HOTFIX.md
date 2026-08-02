# v1.0.0-rc1.1 — Loader Hotfix

- הוסרה תלות החובה ב־`js/release/*` בזמן העלייה הראשונית.
- Runtime Guard ו־Build Info הוטמעו ישירות ב־`app.js`.
- מסך Recovery יכול כעת לעלות גם ללא מודולי Release חיצוניים.
- Boot Timeout מפעיל Recovery ישירות.
- כפתור "רענון מלא" מנקה Service Workers ו־Cache.
- בוטלה השתלטות מיידית של Service Worker כדי למנוע ערבוב קבצים בין גרסאות.
- אין שינוי ב־API, ב־Apps Script או בגיליונות.
