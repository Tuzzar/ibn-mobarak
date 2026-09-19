## Logo fix plan

### বর্তমান সমস্যাটি
- Live header এখন uploaded **532×464** প্রায়-square image ব্যবহার করছে; এটি horizontal wordmark নয়।
- Saved logo scale **80%**, তাই 56px slot-এ logo-র rendered width মাত্র প্রায় **51px**—এ কারণেই এটি খুব ছোট/অসম্পূর্ণ দেখাচ্ছে।
- Header, mobile drawer এবং admin preview-তে আলাদা sizing/transform rule থাকায় preview ও live result একরকম হচ্ছে না।

### কী ঠিক করা হবে
1. Uploaded image-এর transparent/empty boundary বাদ দিয়ে পুরো artwork অক্ষত রেখে horizontal transparent logo output তৈরি করা হবে; কোনো letter বা key crop হবে না।
2. Header থেকে transform-based scaling সরিয়ে fixed responsive height ও bounded width ব্যবহার করা হবে, যাতে mobile, tablet ও desktop-এ পূর্ণ logo দেখা যায়।
3. Header row-তে logo-র জন্য পর্যাপ্ত width reserve করা হবে; উপর-নিচে অপ্রয়োজনীয় gap থাকবে না এবং cart/menu-এর সঙ্গে center alignment থাকবে।
4. Mobile drawer ও admin logo preview-তে একই aspect-ratio ও sizing rule ব্যবহার করা হবে।
5. Uploader crop canvas displayed image bounds অনুযায়ী কাজ করবে, full-image selection default থাকবে এবং preview live header proportions দেখাবে।
6. 390px mobile, বর্তমান 1091px viewport ও 1280px desktop-এ normal/scroll state যাচাই করা হবে—crop, overlap, extra gap বা size jump থাকবে না।