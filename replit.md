# Supplements Shop

## Overview
A supplement e-commerce site inspired by inject.soy. Features a product catalog with individual product pages, a blog/musings section, and cryptocurrency payment options. Black background with gold/amber accents, Doto font in bold, all-lowercase aesthetic.

## Recent Changes
- 2026-02-24: Initial build - full-stack supplement shop with products, blog, crypto payments
- 2026-02-24: Theme updated to black background, bold font, gold/amber accents on dark
- 2026-02-24: Admin portal added at /admin with product and blog post management
- 2026-02-24: Musings moved to front page (/), products moved to /products
- 2026-02-24: BitCart crypto payment integration added (requires BITCART_API_URL, BITCART_API_TOKEN, BITCART_STORE_ID)
- 2026-02-25: Products now have category ("product" or "service") with different checkout forms
- 2026-02-25: Order IDs are now non-sequential (random hex UIDs)
- 2026-02-25: Products can be hidden from public listing via admin toggle

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui with black background, bold Doto font, gold accents
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Routing**: wouter for client-side routing
- **State**: TanStack Query for server state, local state for cart

## Key Pages
- `/` - Blog/musings listing (front page)
- `/musings/:slug` - Individual blog post
- `/products` - Product listing with table, quantity controls, payment method selection
- `/product/:slug` - Individual product detail page with description
- `/admin` - Admin portal (password-protected) for managing products and blog posts

## Admin Portal
- Password-based auth using express-session with PostgreSQL session store
- ADMIN_USERNAME + ADMIN_PASSWORD env vars required for login
- CRUD for products: create, edit name/slug/concentration/type/price/description/inStock/isHidden/category, delete
- Products can be toggled hidden (eye icon) to hide from public listing
- Products have category: "product" (physical, needs shipping) or "service" (needs compound + signal/simplex)
- CRUD for blog posts: create, edit title/slug/content/excerpt/isLocked/lockPassword, delete
- Locked posts: admin can mark posts as "private entry" with a password

## Checkout Flow
- Cart detects whether items are products (physical) or services
- Products require shipping form: first name, last name, country/region, street address, town/city, state, zip code, email
- Services require service form: expected compound, signal/simplex
- Mixed carts show both forms
- All info stored as JSON in orders table

## BitCart Integration
- Checkout creates an order with random UID, then calls BitCart API to create an invoice
- If BitCart is not configured (env vars missing), orders are still saved but no invoice is created
- Requires: BITCART_API_URL, BITCART_API_TOKEN, BITCART_STORE_ID env vars

## Data Models
- `products` - name, slug, concentration, type, unitPrice, description, inStock, isHidden, category
- `blogPosts` - title, slug, content, excerpt, isLocked, lockPassword, publishedAt
- `orders` - orderUid (random hex), items (JSON), totalPrice, paymentMethod, shippingInfo (JSON), serviceInfo (JSON), bitcartInvoiceId, status, createdAt

## Project Structure
- `client/src/pages/` - Page components
- `client/src/lib/cart.ts` - Cart state hook
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data
- `shared/schema.ts` - Drizzle schemas and types
