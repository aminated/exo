import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertBlogPostSchema } from "@shared/schema";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_USERNAME or ADMIN_PASSWORD environment variable is not set. Admin login will be disabled.");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).isAdmin) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:slug", async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getBlogPosts();
    res.json(posts);
  });

  app.get("/api/posts/:slug", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return res.status(503).json({ message: "Admin login is not configured" });
    }
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      (req.session as any).isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: !!(req.session && (req.session as any).isAdmin) });
  });

  app.get("/api/admin/products", requireAdmin, async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid product data", errors: parsed.error.flatten() });
    }
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = insertProductSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid product data", errors: parsed.error.flatten() });
    }
    const product = await storage.updateProduct(id, parsed.data);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/posts", requireAdmin, async (_req, res) => {
    const posts = await storage.getBlogPosts();
    res.json(posts);
  });

  app.post("/api/admin/posts", requireAdmin, async (req, res) => {
    const parsed = insertBlogPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid post data", errors: parsed.error.flatten() });
    }
    const post = await storage.createBlogPost(parsed.data);
    res.status(201).json(post);
  });

  app.patch("/api/admin/posts/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = insertBlogPostSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid post data", errors: parsed.error.flatten() });
    }
    const post = await storage.updateBlogPost(id, parsed.data);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.delete("/api/admin/posts/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteBlogPost(id);
    if (!deleted) return res.status(404).json({ message: "Post not found" });
    res.json({ success: true });
  });

  return httpServer;
}
