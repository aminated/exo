import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { insertProductSchema, insertBlogPostSchema, shippingInfoSchema, serviceInfoSchema } from "@shared/schema";

const BITCART_API_URL = process.env.BITCART_API_URL;
const BITCART_API_TOKEN = process.env.BITCART_API_TOKEN;
const BITCART_STORE_ID = process.env.BITCART_STORE_ID;

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
    const allProducts = await storage.getProducts();
    const visible = allProducts.filter((p) => !p.isHidden);
    res.json(visible);
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
    const sanitized = posts.map(({ lockPassword, ...rest }) => rest);
    res.json(sanitized);
  });

  app.get("/api/posts/:slug", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const { lockPassword, ...rest } = post;
    if (post.isLocked) {
      return res.json({ ...rest, content: "" });
    }
    res.json(rest);
  });

  app.post("/api/posts/:slug/unlock", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!post.isLocked) {
      const { lockPassword, ...rest } = post;
      return res.json(rest);
    }
    const { password } = req.body;
    if (!password || password !== post.lockPassword) {
      return res.status(401).json({ message: "incorrect password" });
    }
    const { lockPassword, ...rest } = post;
    res.json(rest);
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
    if (parsed.data.isLocked && !parsed.data.lockPassword) {
      return res.status(400).json({ message: "Locked posts require a password" });
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

  app.post("/api/checkout", async (req, res) => {
    try {
      const { items, paymentMethod, shippingInfo, serviceInfo } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const validMethods = ["btc", "ltc", "xmr"];
      if (!paymentMethod || !validMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      let computedTotal = 0;
      const verifiedItems = [];
      let hasProducts = false;
      let hasServices = false;
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ message: "Invalid item in cart" });
        }
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product not found: ${item.productId}` });
        }
        if (!product.inStock) {
          return res.status(400).json({ message: `${product.name} is out of stock` });
        }
        if (product.category === "service") {
          hasServices = true;
        } else {
          hasProducts = true;
        }
        computedTotal += Number(product.unitPrice) * item.quantity;
        verifiedItems.push({ productId: product.id, name: product.name, quantity: item.quantity, unitPrice: product.unitPrice, category: product.category });
      }

      let validatedShipping = null;
      let validatedService = null;

      if (hasProducts) {
        const parsed = shippingInfoSchema.safeParse(shippingInfo);
        if (!parsed.success) {
          return res.status(400).json({ message: "Shipping information is required for physical products" });
        }
        validatedShipping = parsed.data;
      }

      if (hasServices) {
        const parsed = serviceInfoSchema.safeParse(serviceInfo);
        if (!parsed.success) {
          return res.status(400).json({ message: "Service information is required for service items" });
        }
        validatedService = parsed.data;
      }

      const orderUid = crypto.randomBytes(8).toString("hex");

      const order = await storage.createOrder({
        orderUid,
        items: JSON.stringify(verifiedItems),
        totalPrice: computedTotal.toFixed(2),
        paymentMethod,
        shippingInfo: validatedShipping ? JSON.stringify(validatedShipping) : null,
        serviceInfo: validatedService ? JSON.stringify(validatedService) : null,
        status: "pending",
      });

      if (!BITCART_API_URL || !BITCART_API_TOKEN || !BITCART_STORE_ID) {
        return res.json({
          orderUid: order.orderUid,
          message: "Order created. BitCart is not configured yet — set BITCART_API_URL, BITCART_API_TOKEN, and BITCART_STORE_ID to enable payment processing.",
          configured: false,
        });
      }

      const invoiceResponse = await fetch(`${BITCART_API_URL}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BITCART_API_TOKEN}`,
        },
        body: JSON.stringify({
          price: computedTotal,
          store_id: BITCART_STORE_ID,
          order_id: `order-${order.orderUid}`,
          currency: paymentMethod.toUpperCase(),
        }),
      });

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error("BitCart invoice creation failed:", errorText);
        return res.status(502).json({ message: "Failed to create payment invoice" });
      }

      const invoice = await invoiceResponse.json() as { id: string; checkout_url?: string };
      await storage.updateOrderBitcartId(order.id, invoice.id);

      res.json({
        orderUid: order.orderUid,
        invoiceId: invoice.id,
        checkoutUrl: invoice.checkout_url || `${BITCART_API_URL}/i/${invoice.id}`,
        configured: true,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  return httpServer;
}
