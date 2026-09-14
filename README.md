# Welcome Motor — Premium Car Dealership Web Platform

Production-ready automotive dealership web application built for **WELCOME MOTOR**.

- **Owner:** Arslan Farooq
- **Experience:** 17 Years of Trust (Est. 2007)
- **Cars Sold:** 2,179+ Cars Delivered
- **Google Rating:** 4.8★
- **Showroom Location:** Rawalpindi Cricket Stadium, J3VG+FWR, Murree Rd, Rawalpindi Stadium Rd, Satellite Town, Rawalpindi 46000, Pakistan
- **Google Maps:** [https://maps.app.goo.gl/shWDXxyVJ9MNbEK27](https://maps.app.goo.gl/shWDXxyVJ9MNbEK27)
- **Phone / WhatsApp:** 0313-3884499 (`+92 313 3884499`)
- **Hours:** Open 24/7

---

## 🚀 Key Features

### 1. Customer-Facing Showroom (`/index.html`)
- **Luxury Automotive Aesthetic:** Red, White, and Deep Charcoal palette with official Welcome Motor shield logo.
- **Hero Slogan & Live Counters:** *"17 Years of Trust. 2,179 Cars Driven Home."* featuring dynamic counters for 17+ Years, 2,179+ Cars Sold, 4.8★ Google Rating, and 24/7 Availability.
- **Hero Quick Search:** Filter by Brand, Budget, and Model Year with direct jump to inventory.
- **Featured Vehicles Showcase:** Dynamically showcases vehicles flagged as "Featured" in Admin.
- **Advanced Inventory Engine:**
  - Real-time keyword search.
  - Multi-faceted filters: Brand/Make, Min/Max Price, Year, Fuel Type, Transmission, Condition.
  - Sorting: Price (Low to High, High to Low), Year (Newest/Oldest), Recently Added.
  - Badges: `Available` (Green), `Reserved` (Amber), `Sold` (Red).
  - Empty state when no vehicles match or before inventory is added.
- **Why Choose Us:** 17 Years of Trust, 100% Document & Biometric Verification, 24/7 Availability, 2,179+ Happy Owners.
- **About Section:** Tribute to Arslan Farooq and the 17-year legacy at Rawalpindi Cricket Stadium.
- **Customer Reviews:** 4.8★ Google rating highlight with authentic client reviews and Google Maps review link.
- **Contact & Location:** Embedded Google Map of Rawalpindi Cricket Stadium, direct dialer (`0313-3884499`), and inquiry form.
- **Floating WhatsApp Button:** Direct chat with showroom support.

### 2. Dedicated Vehicle Details (`/vehicle.html?id=...`)
- Interactive multi-image gallery with zoom/thumbnail selector.
- Formatted PKR pricing (automatic Lacs / Crore conversion).
- Specification sheet with **conditional field rendering** (empty optional fields are cleanly hidden).
- Key features & safety feature badges.
- **Dynamic Pre-Filled WhatsApp Inquiry:**
  > *"Hello Welcome Motor (Arslan Farooq), I am interested in this vehicle: 2023 Toyota Fortuner Legender..."*
- Direct phone dialer button.

### 3. Secure Admin Portal (`/admin/login.html`)
- **No public signup** — Private access for owner & staff only.
- **Dashboard (`/admin/index.html`):** Real-time metric cards for Total, Available, Reserved, Sold, and Featured vehicles.
- **Inventory Manager (`/admin/inventory.html`):** Quick status changer, featured toggle, edit, delete, and public preview links.
- **Add Vehicle Form (`/admin/add-vehicle.html`):**
  - **Required:** Brand, Model, Year, Price, Status, At least 1 Image.
  - **Optional:** Variant, Mileage, Fuel Type, Transmission, Engine Capacity, Exterior Color, Registration City, Condition, Assembly, Owners Count, Description, Key Features, Safety Features, Featured.
  - **Multi-Image Drag & Drop Uploader** with instant preview and remove capability.
- **Edit Vehicle Form (`/admin/edit-vehicle.html`):** Full editing capabilities.
- **Dealership Settings (`/admin/settings.html`):** Edit phone numbers, address, owner name, tagline, and optional business license field (hidden publicly if empty).

---

## 🗄️ Backend & Database (Supabase)

- **Supabase URL:** `https://rupvcvvwfmsrsbnfqzdf.supabase.co`
- **Publishable Key:** `sb_publishable_ykKqBEAwsSYMY_i4RPdUgw_aRmq8emL`
- **Storage Bucket:** `vehicle-images`
- **SQL Migration Script:** [`supabase-schema.sql`](supabase-schema.sql)

### Supabase Tables
1. `vehicles` (UUID, brand, model, year, price, status, images, optional fields, features, safety_features, featured, timestamps)
2. `settings` (Dealership profile, contact info, owner, stats, hidden license field)
3. `inquiries` (Customer inquiry messages)

---

## 🔑 Admin Login Credentials

- **Email:** `arslan@welcomemotor.pk` | **Password:** `arslan17`
- **Email:** `admin@welcomemotor.pk`  | **Password:** `welcome2026`
- **Staff:** `admin`                  | **Password:** `admin123`

---

## 🏃‍♂️ Running Locally

```bash
# Start server
node server.js
```
Then open `http://localhost:3000` in your web browser.
