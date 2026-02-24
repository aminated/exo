# Supplements Shop

## Overview
A supplement e-commerce site with a dark purple aesthetic inspired by inject.soy. Features a product catalog with individual product pages, a blog/musings section, and cryptocurrency payment options.

## Recent Changes
- 2026-02-24: Initial build - full-stack supplement shop with products, blog, crypto payments

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui with dark purple monospace theme
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Routing**: wouter for client-side routing
- **State**: TanStack Query for server state, local state for cart

## Key Pages
- `/` - Product listing with table, quantity controls, payment method selection
- `/product/:slug` - Individual product detail page with description
- `/musings` - Blog post listing
- `/musings/:slug` - Individual blog post

## Data Models
- `products` - name, slug, concentration, type, unitPrice, description, inStock
- `blogPosts` - title, slug, content, excerpt, publishedAt

## Project Structure
- `client/src/pages/` - Page components
- `client/src/lib/cart.ts` - Cart state hook
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data
- `shared/schema.ts` - Drizzle schemas and types
