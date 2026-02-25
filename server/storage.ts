import { type Product, type InsertProduct, type BlogPost, type InsertBlogPost, type Order, type InsertOrder, type SitePage, type TestResult, type InsertTestResult, products, blogPosts, orders, sitePages, testResults } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderBitcartId(id: number, bitcartInvoiceId: string): Promise<Order | undefined>;
  getSitePage(slug: string): Promise<SitePage | undefined>;
  upsertSitePage(slug: string, title: string, content: string): Promise<SitePage>;
  getTestResults(): Promise<TestResult[]>;
  getTestResultByUid(uid: string): Promise<TestResult | undefined>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  updateTestResult(id: number, result: Partial<InsertTestResult>): Promise<TestResult | undefined>;
  deleteTestResult(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(blogPosts.publishedAt);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts).set(post).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return result.length > 0;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderBitcartId(id: number, bitcartInvoiceId: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ bitcartInvoiceId }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getSitePage(slug: string): Promise<SitePage | undefined> {
    const [page] = await db.select().from(sitePages).where(eq(sitePages.slug, slug));
    return page;
  }

  async upsertSitePage(slug: string, title: string, content: string): Promise<SitePage> {
    const existing = await this.getSitePage(slug);
    if (existing) {
      const [updated] = await db.update(sitePages).set({ title, content, updatedAt: new Date() }).where(eq(sitePages.slug, slug)).returning();
      return updated;
    }
    const [created] = await db.insert(sitePages).values({ slug, title, content }).returning();
    return created;
  }

  async getTestResults(): Promise<TestResult[]> {
    return await db.select().from(testResults).orderBy(desc(testResults.createdAt));
  }

  async getTestResultByUid(uid: string): Promise<TestResult | undefined> {
    const [result] = await db.select().from(testResults).where(eq(testResults.uid, uid));
    return result;
  }

  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    const [created] = await db.insert(testResults).values(result).returning();
    return created;
  }

  async updateTestResult(id: number, result: Partial<InsertTestResult>): Promise<TestResult | undefined> {
    const [updated] = await db.update(testResults).set(result).where(eq(testResults.id, id)).returning();
    return updated;
  }

  async deleteTestResult(id: number): Promise<boolean> {
    const res = await db.delete(testResults).where(eq(testResults.id, id)).returning();
    return res.length > 0;
  }
}

export const storage = new DatabaseStorage();
