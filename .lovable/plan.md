# Incomplete order alert — duplicate ঠিক করা

## সমস্যা

এখন কাস্টমার ফর্ম টাইপ করা শুরু করলেই (ফোন/নাম পাওয়ার সাথে সাথে) Telegram-এ "ইনকমপ্লিট অর্ডার (lead)" চলে যায়। ওই একই কাস্টমার ২ মিনিট পরে Order বাটনে ক্লিক করলে আবার "নতুন অর্ডার" যায় — ফলে একই অর্ডার দুইবার দেখায়।

## সমাধানের ধারণা

Lead অ্যালার্ট সাথে সাথে না পাঠিয়ে **অপেক্ষা করবে**। ওই অপেক্ষার সময়ের মধ্যে কাস্টমার অর্ডার কমপ্লিট করলে lead অ্যালার্ট **কখনোই যাবে না** — শুধু আসল অর্ডারের মেসেজ যাবে। কাস্টমার অর্ডার না করলে অপেক্ষা শেষে তখন lead অ্যালার্ট যাবে (ফলো-আপ কলের জন্য)।

ডিফল্ট অপেক্ষা: **১৫ মিনিট** (Admin থেকে বদলানো যাবে, 0 = বন্ধ)।

```text
কাস্টমার টাইপ করছে ──► lead সেভ (alert pending, ১৫ মিনিট পরে)
        │
        ├── অর্ডার সম্পন্ন হলো  ──► lead cancel, শুধু 🟢 নতুন অর্ডার যাবে
        │
        └── অর্ডার হলো না     ──► ১৫ মিনিট পরে 🟠 ইনকমপ্লিট অর্ডার যাবে
```

## অতিরিক্ত সুরক্ষা (double-safety)

অর্ডার সেভ হওয়ার সময় শুধু session নয়, **একই ফোন নাম্বারের** যেকোনো pending lead-ও বাতিল হয়ে যাবে। ফলে কাস্টমার ট্যাব বদলালে বা পেজ রিফ্রেশ করলেও ডুপ্লিকেট আসবে না।

## Admin-এ যা যোগ হবে

Telegram Alerts কার্ডে নতুন একটি ফিল্ড: **"ইনকমপ্লিট অর্ডার অ্যালার্ট ডিলে (মিনিট)"** — ডিফল্ট 15।

## Technical notes

- Migration: `incomplete_orders`-এ দুটি কলাম — `notify_after timestamptz`, `notified_at timestamptz`; পাশাপাশি partial index (`notified_at is null and status = 'new'`)। নতুন `app_settings` key: `telegram_lead_delay_minutes`।
- `saveIncompleteOrder`: এখনকার সাথে সাথে `notifyOrderEvent({kind:'lead'})` কলটি সরানো হবে; বদলে প্রথম সেভে `notify_after = now() + delay` বসবে।
- Order paths (`placeOrder`, `convertIncomplete`, `markIncompleteConverted`): pending lead গুলোতে `notified_at = now()` (suppressed) সেট করবে — session_key মিললে, না মিললে ফোনের digits মিলিয়ে শেষ ২ ঘণ্টার lead।
- নতুন public route `src/routes/api/public/telegram/flush-leads.ts`: `notify_after <= now()`, `notified_at is null`, `status = 'new'` রো গুলো নিয়ে Telegram পাঠাবে ও `notified_at` সেট করবে (idempotent)। `x-cron-secret` হেডার দিয়ে সুরক্ষিত (`app_settings`-এ auto-generated secret), একবারে সর্বোচ্চ ২০টি।
- শিডিউল: external Supabase-এ `pg_cron` + `pg_net` দিয়ে প্রতি ২ মিনিটে ওই URL কল করবে — migration-এই সেটআপ হবে। ফলব্যাক হিসেবে Admin → Orders পেজ খোলা থাকলেও একবার flush কল হবে, যাতে cron না চললেও অ্যালার্ট আটকে না থাকে।
- Telegram fail করলে অর্ডার/লিড কখনও fail করবে না — নীরবে লগ হবে।
