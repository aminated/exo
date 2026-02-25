import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  concentration: text("concentration"),
  type: text("type"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  inStock: boolean("in_stock").notNull().default(true),
  isHidden: boolean("is_hidden").notNull().default(false),
  category: text("category").notNull().default("product"),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  isLocked: boolean("is_locked").notNull().default(false),
  lockPassword: text("lock_password"),
  publishedAt: timestamp("published_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderUid: text("order_uid").notNull().unique(),
  items: text("items").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  shippingInfo: text("shipping_info"),
  serviceInfo: text("service_info"),
  bitcartInvoiceId: text("bitcart_invoice_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const sitePages = pgTable("site_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SitePage = typeof sitePages.$inferSelect;

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  orderUid: text("order_uid"),
  testingOrdered: text("testing_ordered"),
  sampleReceived: text("sample_received"),
  clientName: text("client_name"),
  sample: text("sample"),
  manufacturer: text("manufacturer"),
  results: text("results"),
  chromatograms: text("chromatograms").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  createdAt: true,
});

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usedCount: true,
  createdAt: true,
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export const shippingInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  country: z.string().min(1),
  streetAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  email: z.string().email(),
});

export const serviceInfoSchema = z.object({
  clientName: z.string().min(1),
  expectedCompound: z.string().min(1),
  manufacturer: z.string().min(1),
  signalSimplex: z.string().min(1),
});

export type ShippingInfo = z.infer<typeof shippingInfoSchema>;
export type ServiceInfo = z.infer<typeof serviceInfoSchema>;
