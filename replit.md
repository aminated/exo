# Supplements Shop

## Overview
A supplement e-commerce site inspired by inject.soy. Features a product catalog with individual product pages, a blog/musings section, lab test results (Janoshik-style), coupon system, and cryptocurrency payment options via BTCPay Server. Black background with gold/amber accents, Doto font in bold, all-lowercase aesthetic.

## Recent Changes
- 2026-02-24: Initial build - full-stack supplement shop with products, blog, crypto payments
- 2026-02-24: Theme updated to black background, bold font, gold/amber accents on dark
- 2026-02-24: Admin portal added at /admin with product and blog post management
- 2026-02-24: Musings moved to front page (/), products moved to /products
- 2026-02-25: Products now have category ("product" or "service") with different checkout forms
- 2026-02-25: Order IDs are now non-sequential (random hex UIDs)
- 2026-02-25: Products can be hidden from public listing via admin toggle
- 2026-02-25: Terms of Service page added, editable from admin "pages" tab
- 2026-02-25: Test results page added (Janoshik-style) with chromatogram image uploads
- 2026-02-25: Site banner added (editable/toggleable from admin pages tab)
- 2026-02-25: Coupon system added with admin CRUD and checkout integration
- 2026-02-25: Switched from BitCart to BTCPay Server for crypto payment processing
- 2026-02-25: Admin orders tab with search, filtering, and sorting

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui with black background, bold Doto font, gold accents
- **Backend**: Express.js with PostgreSQL (Drizzle ORM), multer for file uploads
- **Routing**: wouter for client-side routing
- **State**: TanStack Query for server state, local state for cart

## Key Pages
- `/` - Blog/musings listing (front page)
- `/musings/:slug` - Individual blog post
- `/products` - Product listing with table, quantity controls, payment method selection
- `/product/:slug` - Individual product detail page with description
- `/results` - Test results listing (Janoshik-style table)
- `/results/:uid` - Individual test result detail with chromatograms and downloadable raw data files
- `/checkout/:invoiceId` - Custom payment page with dotted QR codes, address, amount, countdown timer
- `/terms` - Terms of service (editable from admin)
- `/admin` - Admin portal (password-protected) for managing products, blog posts, results, orders, coupons, and pages

## Admin Portal
- Password-based auth using express-session with PostgreSQL session store
- ADMIN_USERNAME + ADMIN_PASSWORD env vars required for login
- Tabs: products, blog posts, results, orders, coupons, pages
- CRUD for products: create, edit name/slug/concentration/type/price/description/inStock/isHidden/category, delete
- Products can be toggled hidden (eye icon) to hide from public listing
- Products have category: "product" (physical, needs shipping) or "service" (needs compound + signal/simplex)
- CRUD for blog posts: create, edit title/slug/content/excerpt/isLocked/lockPassword, delete
- Locked posts: admin can mark posts as "private entry" with a password
- CRUD for test results: uid, order uid, testing ordered, sample received, client name, sample, manufacturer, free text results, chromatogram image uploads, raw data file uploads
- Orders tab: view all orders with search (name, email, order ID, product), filter by status/payment method/date range, sort by date/price
- CRUD for coupons: code, discount type (percentage/fixed), discount value, min order amount, max uses, active toggle
- Pages tab: site banner (text + enable/disable), terms of service content

## Coupon System
- Admin creates coupons with code, discount type (percentage or fixed $), discount value, optional min order amount, optional max uses
- Coupons can be toggled active/inactive
- Customers enter coupon code at checkout (press Enter to apply), validated against server
- Discount applied server-side during checkout; coupon usage count incremented on successful order
- Original and discounted prices shown with strikethrough effect

## Checkout Flow
- Cart detects whether items are products (physical) or services
- Products require shipping form: first name, last name, country/region, street address, town/city, state, zip code, email
- Services require service form: client name, expected compound, manufacturer, signal/simplex
- Coupon code can be applied for discounts
- Mixed carts show both forms
- All info stored as JSON in orders table

## BTCPay Server Integration
- Checkout creates an order with random UID, then calls BTCPay Server Greenfield API to create an invoice
- Maps payment methods: BTC → BTC-OnChain + BTC-LightningNetwork, LTC → LTC-OnChain, XMR → XMR-MoneroLike
- If BTCPay is not configured (env vars missing), orders are still saved but no invoice is created
- Requires: BTCPAY_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID env vars

## Data Models
- `products` - name, slug, concentration, type, unitPrice, description, inStock, isHidden, category
- `blogPosts` - title, slug, content, excerpt, isLocked, lockPassword, publishedAt
- `orders` - orderUid (random hex), items (JSON), totalPrice, paymentMethod, shippingInfo (JSON), serviceInfo (JSON), bitcartInvoiceId (stores BTCPay invoice ID), status, createdAt
- `sitePages` - slug, title, content, updatedAt
- `testResults` - uid, orderUid, testingOrdered, sampleReceived, clientName, sample, manufacturer, results, chromatograms (JSON array of base64 data URLs), rawDataFiles (JSON array of {name, data} objects with base64 content), createdAt
- `coupons` - code, discountType, discountValue, minOrderAmount, maxUses, usedCount, isActive, createdAt

## Project Structure
- `client/src/pages/` - Page components
- `client/src/lib/cart.ts` - Cart state hook
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data
- `shared/schema.ts` - Drizzle schemas and types
- `uploads/` - Uploaded chromatogram images (served statically)
