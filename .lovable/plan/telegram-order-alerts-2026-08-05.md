# Telegram Order Alerts

নতুন অর্ডার আর ইনকমপ্লিট অর্ডার — দুটোই Telegram-এ চলে আসবে, মেসেজের উপরে স্পষ্ট লেখা থাকবে কোনটা আসল অর্ডার আর কোনটা ইনকমপ্লিট।

## Settings (Admin → Site Content)

নতুন "Telegram Notifications" কার্ড:
- Bot Token (BotFather থেকে)
- Chat ID (নিজের / গ্রুপের)
- Toggle: নতুন অর্ডার অ্যালার্ট চালু/বন্ধ
- Toggle: ইনকমপ্লিট অর্ডার অ্যালার্ট চালু/বন্ধ
- "Send test message" বাটন — সেটিংস ঠিক আছে কিনা সাথে সাথেই বোঝা যাবে

সেটিংস ডেটাবেজে থাকবে বলে Cloudflare-এ publish করলেও কাজ করবে, আলাদা env var লাগবে না।

## Message format

```text
🟢 নতুন অর্ডার #১০২৪
নাম: রহিম উদ্দিন
ফোন: 017xxxxxxxx
ঠিকানা: …  (Inside Dhaka)
—
২ × পাঞ্জাবি (M) … ৳২,৪০০
ডেলিভারি ৳৭০
মোট: ৳২,৪৭০
নোট: …
```

ইনকমপ্লিট হলে হেডার হবে `🟠 ইনকমপ্লিট অর্ডার (lead)` এবং যতটুকু তথ্য আছে ততটুকু যাবে (নাম/ফোন খালি থাকলে "—")।

## কখন পাঠাবে

- Checkout বা Landing page থেকে অর্ডার সফলভাবে সেভ হওয়ার পর
- ইনকমপ্লিট লিড সেভ হওয়ার পর — একই লিডের প্রতিটি টাইপিং-আপডেটে নয়, প্রতি লিডে একবার (ফোন নাম্বার দেওয়ার পর প্রথমবার), যাতে স্প্যাম না হয়
- Telegram fail করলে অর্ডার কখনও fail করবে না — নীরবে লগ হবে

## Technical notes

- নতুন সার্ভার-ওনলি হেল্পার `src/lib/telegram.server.ts`: `sendTelegram(text)` — `site_content` থেকে `telegram_bot_token` / `telegram_chat_id` / দুইটি enable ফ্ল্যাগ পড়বে (external Supabase admin client), তারপর Bot API `sendMessage` (HTML parse mode) কল করবে।
- `telegram_bot_token` কী-নামে "token" থাকায় পাবলিক read policy এটি এমনিতেই ব্লক করে — শুধু staff পড়তে পারবে।
- `src/lib/orders.functions.ts` (placeOrder) এবং landing/incomplete flow (`src/lib/incomplete-orders.functions.ts`) থেকে fire-and-forget কল, ঠিক যেভাবে courier check করা হয়।
- একটি ছোট server fn `sendTelegramTest` (staff-only) টেস্ট বাটনের জন্য।
- Admin UI: `src/routes/admin.site-content.tsx`-এ নতুন সেকশন, বিদ্যমান site_content সেভ প্যাটার্ন ব্যবহার করে।
- স্কিমা পরিবর্তন লাগবে না; `site_content`-এ শুধু নতুন key.

## যা আপনাকে দিতে হবে

BotFather থেকে bot token আর chat id — Admin → Site Content-এ বসিয়ে Save + Test চাপলেই চালু।
