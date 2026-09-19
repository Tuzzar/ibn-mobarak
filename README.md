# Ibn Mobarak Art Gallery (ইবন মোবারক আর্ট গ্যালারি)

A premium, modern e-commerce platform and art supply gallery built with TanStack Start, React, Tailwind CSS, and Supabase.

## Features

- **Art Gallery Storefront**: Premium hero slider, curated collections & category grids, bestseller showcases, dynamic product filtering, and fast live search.
- **Dynamic Product Variants Engine**: Full support for pad sizes (A3, A4, A5), resin volumes, canvas & frame dimensions, colors, and nib sizes with live price calculation and stock management.
- **Frictionless Shopping Flow**: Intuitive cart drawer, instant Buy Now direct checkout, automated cash-on-delivery (COD) calculations for Dhaka and outside Dhaka.
- **Admin Management Portal**: Comprehensive dashboard for orders, product variants, inventory, site banners, and courier integrations (Steadfast / Pathao).
- **Automated Order Alerts**: Telegram notifications for incoming orders and incomplete order tracking.

## Tech Stack

- **Framework**: TanStack Start (SSR / Fullstack React)
- **Styling**: Tailwind CSS + Radix UI primitives
- **Database & Auth**: Supabase
- **Package Manager / Runtime**: Bun / Node.js

## Getting Started

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

### 3. Development Server
```bash
bun run dev
# or
npm run dev
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

### 4. Production Build
```bash
bun run build
```
