import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { insertProductSchema, insertBlogPostSchema, insertTestResultSchema, insertCouponSchema, shippingInfoSchema, serviceInfoSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const BTCPAY_URL = process.env.BTCPAY_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;

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

  const uploadDir = path.join(process.cwd(), "uploads");
  if (fs.existsSync(uploadDir)) {
    app.use("/uploads", (await import("express")).default.static(uploadDir));
  }

  app.get("/api/results", async (_req, res) => {
    const results = await storage.getTestResults();
    res.json(results);
  });

  app.get("/api/results/:uid", async (req, res) => {
    const result = await storage.getTestResultByUid(req.params.uid);
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  });

  app.get("/api/admin/results", requireAdmin, async (_req, res) => {
    const results = await storage.getTestResults();
    res.json(results);
  });

  app.post("/api/admin/results", requireAdmin, async (req, res) => {
    const parsed = insertTestResultSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid result data", errors: parsed.error.flatten() });
    }
    const result = await storage.createTestResult(parsed.data);
    res.status(201).json(result);
  });

  app.patch("/api/admin/results/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = insertTestResultSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid result data", errors: parsed.error.flatten() });
    }
    const result = await storage.updateTestResult(id, parsed.data);
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  });

  app.delete("/api/admin/results/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteTestResult(id);
    if (!deleted) return res.status(404).json({ message: "Result not found" });
    res.json({ success: true });
  });

  app.post("/api/admin/upload", requireAdmin, upload.array("files", 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const urls = files.map((f) => {
      const mimeType = f.mimetype || "image/png";
      const base64 = f.buffer.toString("base64");
      return `data:${mimeType};base64,${base64}`;
    });
    res.json({ urls });
  });

  app.post("/api/admin/upload-files", requireAdmin, upload.array("files", 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const result = files.map((f) => {
      const mimeType = f.mimetype || "application/octet-stream";
      const base64 = f.buffer.toString("base64");
      return {
        name: f.originalname,
        data: `data:${mimeType};base64,${base64}`,
      };
    });
    res.json({ files: result });
  });

  app.post("/api/admin/migrate-images", requireAdmin, async (_req, res) => {
    try {
      const results = await storage.getTestResults();
      let migrated = 0;
      for (const result of results) {
        const chromatograms: string[] = JSON.parse(result.chromatograms || "[]");
        let changed = false;
        const updated = chromatograms.map((url) => {
          if (url.startsWith("/uploads/")) {
            const filePath = path.join(process.cwd(), url);
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
              const mimeType = mimeMap[ext] || "image/png";
              changed = true;
              return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
            }
          }
          return url;
        });
        if (changed) {
          await storage.updateTestResult(result.id, { chromatograms: JSON.stringify(updated) });
          migrated++;
        }
      }
      res.json({ success: true, migrated });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ message: "Migration failed" });
    }
  });

  app.get("/api/pages/:slug", async (req, res) => {
    const page = await storage.getSitePage(req.params.slug);
    if (!page) {
      return res.json({ slug: req.params.slug, title: "", content: "", updatedAt: null });
    }
    res.json(page);
  });

  app.put("/api/admin/pages/:slug", requireAdmin, async (req, res) => {
    const { title, content } = req.body;
    if (typeof title !== "string" || typeof content !== "string") {
      return res.status(400).json({ message: "Title and content are required" });
    }
    const page = await storage.upsertSitePage(req.params.slug, title, content);
    res.json(page);
  });

  app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
    const allOrders = await storage.getOrders();
    res.json(allOrders);
  });

  app.get("/api/admin/coupons", requireAdmin, async (_req, res) => {
    const allCoupons = await storage.getCoupons();
    res.json(allCoupons);
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    const parsed = insertCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid coupon data", errors: parsed.error.flatten() });
    }
    const coupon = await storage.createCoupon(parsed.data);
    res.status(201).json(coupon);
  });

  app.patch("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = insertCouponSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid coupon data", errors: parsed.error.flatten() });
    }
    const coupon = await storage.updateCoupon(id, parsed.data);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteCoupon(id);
    if (!deleted) return res.status(404).json({ message: "Coupon not found" });
    res.json({ success: true });
  });

  app.post("/api/coupons/validate", async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Coupon code is required" });
    }
    const coupon = await storage.getCouponByCode(code);
    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ message: "Invalid or expired coupon code" });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: "This coupon has reached its maximum uses" });
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return res.status(400).json({ message: `Minimum order amount of $${coupon.minOrderAmount} required` });
    }
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
    } else {
      discount = Math.min(Number(coupon.discountValue), subtotal);
    }
    res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: Math.round(discount * 100) / 100,
    });
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { items, paymentMethod, shippingInfo, serviceInfo, couponCode } = req.body;

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

      let appliedCoupon = null;
      if (couponCode && typeof couponCode === "string") {
        const coupon = await storage.getCouponByCode(couponCode);
        if (coupon && coupon.isActive) {
          const withinMaxUses = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
          const meetsMinimum = !coupon.minOrderAmount || computedTotal >= Number(coupon.minOrderAmount);
          if (withinMaxUses && meetsMinimum) {
            let discount = 0;
            if (coupon.discountType === "percentage") {
              discount = (computedTotal * Number(coupon.discountValue)) / 100;
            } else {
              discount = Math.min(Number(coupon.discountValue), computedTotal);
            }
            discount = Math.round(discount * 100) / 100;
            computedTotal = Math.max(0, computedTotal - discount);
            appliedCoupon = coupon;
          }
        }
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

      if (appliedCoupon) {
        await storage.incrementCouponUsage(appliedCoupon.id);
      }

      if (!BTCPAY_URL || !BTCPAY_API_KEY || !BTCPAY_STORE_ID) {
        return res.json({
          orderUid: order.orderUid,
          message: "Order created. BTCPay Server is not configured yet — set BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID to enable payment processing.",
          configured: false,
        });
      }

      const paymentMethodMap: Record<string, string[]> = {
        btc: ["BTC-OnChain", "BTC-LightningNetwork"],
        ltc: ["LTC-OnChain"],
        xmr: ["XMR-MoneroLike"],
      };

      const invoiceResponse = await fetch(`${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `token ${BTCPAY_API_KEY}`,
          "X-Api-Key": BTCPAY_API_KEY,
          "User-Agent": "SupplementsShop/1.0",
        },
        body: JSON.stringify({
          amount: computedTotal,
          currency: "USD",
          metadata: {
            orderId: order.orderUid,
            paymentMethod: paymentMethod,
          },
          checkout: {
            paymentMethods: paymentMethodMap[paymentMethod] || ["BTC-OnChain"],
            speedPolicy: "MediumSpeed",
          },
        }),
      });

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error("BTCPay invoice creation failed:", errorText);
        return res.json({
          orderUid: order.orderUid,
          configured: true,
          paymentFailed: true,
          message: "your order has been saved, but we couldn't generate a payment invoice right now. please contact us or try again shortly.",
        });
      }

      const invoice = await invoiceResponse.json() as { id: string; checkoutLink?: string };
      await storage.updateOrderBitcartId(order.id, invoice.id);

      res.json({
        orderUid: order.orderUid,
        invoiceId: invoice.id,
        checkoutUrl: invoice.checkoutLink || `${BTCPAY_URL}/i/${invoice.id}`,
        configured: true,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  return httpServer;
}
