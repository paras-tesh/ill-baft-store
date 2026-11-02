# ایل بافت — فروشگاه فرش
اجرا: `npm install` سپس `npm run dev` و باز کردن آدرس نمایش‌داده‌شده (معمولاً http://localhost:5173)
پنل مدیریت: آدرس `/#/admin` را باز کن و رمز `admin123` را بزن (تغییر رمز: ADMIN_PASSWORD در src/store.js)
داده‌ها فعلاً در localStorage مرورگر ذخیره می‌شوند؛ توابع src/store.js را می‌توان با Supabase جایگزین کرد.

صفحه‌ها: / ، /#/login ، /#/signup ، /#/cart ، /#/admin

عکس‌های پیش‌فرض بنر در public/images هستند (hero-desktop.jpg و hero-mobile.jpg)؛ از پنل ادمین هم قابل تغییرند.
