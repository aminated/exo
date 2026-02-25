import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Pencil, Trash2, Package, Pen, Lock, EyeOff, Eye, FileText, FlaskConical, Upload, X, Tag, ShoppingCart, ChevronDown, ChevronUp, Search } from "lucide-react";
import type { Product, BlogPost, TestResult, Coupon, Order } from "@shared/schema";

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      await apiRequest("POST", "/api/admin/login", creds);
    },
    onSuccess: onLogin,
    onError: () => {
      toast({ title: "invalid credentials", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-sm mx-auto mt-20">
      <h1 className="text-lg font-bold tracking-wider text-amber-400 mb-6 text-center">
        admin login
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loginMutation.mutate({ username, password });
        }}
        className="space-y-4"
      >
        <Input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border-dotted"
          data-testid="input-admin-username"
        />
        <Input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-dotted"
          data-testid="input-admin-password"
        />
        <Button
          type="submit"
          className="w-full bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
          disabled={loginMutation.isPending}
          data-testid="button-admin-login"
        >
          {loginMutation.isPending ? "logging in..." : "login"}
        </Button>
      </form>
    </div>
  );
}

function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    concentration: product?.concentration || "",
    type: product?.type || "",
    unitPrice: product?.unitPrice || "",
    description: product?.description || "",
    inStock: product?.inStock ?? true,
    isHidden: product?.isHidden ?? false,
    category: product?.category || "product",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const body = {
        ...data,
        unitPrice: data.unitPrice.toString(),
        concentration: data.concentration || null,
        type: data.type || null,
        description: data.description || null,
      };
      if (product) {
        await apiRequest("PATCH", `/api/admin/products/${product.id}`, body);
      } else {
        await apiRequest("POST", "/api/admin/products", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: product ? "product updated" : "product created" });
      onSave();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !product) {
        updated.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return updated;
    });
  };

  return (
    <div className="border border-dotted border-border rounded-md p-5 space-y-4">
      <h3 className="text-sm font-bold tracking-wider text-amber-400">
        {product ? "edit product" : "new product"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">name</label>
          <Input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="border-dotted"
            data-testid="input-product-name"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">slug</label>
          <Input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="border-dotted"
            data-testid="input-product-slug"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">concentration</label>
          <Input
            value={form.concentration}
            onChange={(e) => updateField("concentration", e.target.value)}
            className="border-dotted"
            data-testid="input-product-concentration"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">type</label>
          <Input
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="border-dotted"
            data-testid="input-product-type"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">unit price</label>
          <Input
            value={form.unitPrice}
            onChange={(e) => updateField("unitPrice", e.target.value)}
            className="border-dotted"
            data-testid="input-product-price"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">category</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField("category", "product")}
              className={`px-4 py-2 rounded-md text-xs tracking-wider border ${
                form.category === "product"
                  ? "bg-amber-700/15 border-dotted border-amber-600/50 text-amber-400"
                  : "border-dotted border-border text-muted-foreground"
              }`}
              data-testid="input-product-category-product"
            >
              product
            </button>
            <button
              type="button"
              onClick={() => updateField("category", "service")}
              className={`px-4 py-2 rounded-md text-xs tracking-wider border ${
                form.category === "service"
                  ? "bg-amber-700/15 border-dotted border-amber-600/50 text-amber-400"
                  : "border-dotted border-border text-muted-foreground"
              }`}
              data-testid="input-product-category-service"
            >
              service
            </button>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => updateField("inStock", e.target.checked)}
              data-testid="input-product-instock"
            />
            in stock
          </label>
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isHidden}
              onChange={(e) => updateField("isHidden", e.target.checked)}
              data-testid="input-product-hidden"
            />
            hidden
          </label>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">description</label>
        <Textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className="border-dotted"
          data-testid="input-product-description"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !form.name || !form.slug || !form.unitPrice}
          className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
          data-testid="button-product-save"
        >
          {mutation.isPending ? "saving..." : "save"}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="border border-dotted border-border" data-testid="button-product-cancel">
          cancel
        </Button>
      </div>
    </div>
  );
}

function PostForm({
  post,
  onSave,
  onCancel,
}: {
  post?: BlogPost;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    isLocked: post?.isLocked || false,
    lockPassword: post?.lockPassword || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const body = {
        ...data,
        excerpt: data.excerpt || null,
        lockPassword: data.isLocked ? data.lockPassword : null,
      };
      if (post) {
        await apiRequest("PATCH", `/api/admin/posts/${post.id}`, body);
      } else {
        await apiRequest("POST", "/api/admin/posts", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: post ? "post updated" : "post created" });
      onSave();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && !post) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return updated;
    });
  };

  return (
    <div className="border border-dotted border-border rounded-md p-5 space-y-4">
      <h3 className="text-sm font-bold tracking-wider text-amber-400">
        {post ? "edit post" : "new post"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">title</label>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="border-dotted"
            data-testid="input-post-title"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">slug</label>
          <Input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="border-dotted"
            data-testid="input-post-slug"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">excerpt</label>
        <Input
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          className="border-dotted"
          data-testid="input-post-excerpt"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">content</label>
        <Textarea
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={10}
          className="border-dotted"
          data-testid="input-post-content"
        />
      </div>
      <div className="border border-dotted border-border rounded-md p-3 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.isLocked}
            onChange={(e) => setForm((prev) => ({ ...prev, isLocked: e.target.checked }))}
            className="accent-amber-500"
            data-testid="input-post-locked"
          />
          <span className="text-muted-foreground">private entry (password-locked)</span>
        </label>
        {form.isLocked && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">unlock password</label>
            <Input
              value={form.lockPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, lockPassword: e.target.value }))}
              placeholder="password to unlock this post"
              className="border-dotted"
              data-testid="input-post-lock-password"
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !form.title || !form.slug || !form.content}
          className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
          data-testid="button-post-save"
        >
          {mutation.isPending ? "saving..." : "save"}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="border border-dotted border-border" data-testid="button-post-cancel">
          cancel
        </Button>
      </div>
    </div>
  );
}

function ProductsManager() {
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "product deleted" });
    },
  });

  const toggleHiddenMutation = useMutation({
    mutationFn: async ({ id, isHidden }: { id: number; isHidden: boolean }) => {
      await apiRequest("PATCH", `/api/admin/products/${id}`, { isHidden });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  if (editing) {
    return (
      <ProductForm
        product={editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (creating) {
    return (
      <ProductForm
        onSave={() => setCreating(false)}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider">products</h3>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="gap-1.5 bg-amber-500 text-black hover:bg-amber-400 border border-dotted border-amber-400/40"
          data-testid="button-add-product"
        >
          <Plus className="h-3.5 w-3.5" />
          add product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products?.map((product) => (
            <div
              key={product.id}
              className="border border-dotted border-border rounded-md p-3 flex items-center justify-between gap-3"
              data-testid={`admin-product-${product.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate flex items-center gap-1.5 ${product.isHidden ? "text-muted-foreground" : "text-amber-400"}`}>
                  {product.isHidden && <EyeOff className="h-3 w-3 flex-shrink-0" />}
                  {product.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${Number(product.unitPrice).toFixed(2)} · {product.category} · {product.inStock ? "in stock" : "out of stock"}{product.isHidden ? " · hidden" : ""}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => toggleHiddenMutation.mutate({ id: product.id, isHidden: !product.isHidden })}
                  className={`h-7 w-7 border border-dotted border-border ${product.isHidden ? "text-muted-foreground" : ""}`}
                  title={product.isHidden ? "show product" : "hide product"}
                  data-testid={`button-toggle-hidden-${product.id}`}
                >
                  {product.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setEditing(product)}
                  className="h-7 w-7 border border-dotted border-border"
                  data-testid={`button-edit-product-${product.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    if (confirm("delete this product?")) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                  className="h-7 w-7 border border-dotted border-border text-destructive"
                  data-testid={`button-delete-product-${product.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostsManager() {
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/posts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "post deleted" });
    },
  });

  if (editing) {
    return (
      <PostForm
        post={editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (creating) {
    return (
      <PostForm
        onSave={() => setCreating(false)}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider">blog posts</h3>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="gap-1.5 bg-amber-500 text-black hover:bg-amber-400 border border-dotted border-amber-400/40"
          data-testid="button-add-post"
        >
          <Plus className="h-3.5 w-3.5" />
          new post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {posts?.map((post) => (
            <div
              key={post.id}
              className="border border-dotted border-border rounded-md p-3 flex items-center justify-between gap-3"
              data-testid={`admin-post-${post.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-amber-400 truncate flex items-center gap-1.5">
                  {post.isLocked && <Lock className="h-3 w-3 text-amber-500/70 flex-shrink-0" />}
                  {post.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {post.excerpt || "no excerpt"}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setEditing(post)}
                  className="h-7 w-7 border border-dotted border-border"
                  data-testid={`button-edit-post-${post.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    if (confirm("delete this post?")) {
                      deleteMutation.mutate(post.id);
                    }
                  }}
                  className="h-7 w-7 border border-dotted border-border text-destructive"
                  data-testid={`button-delete-post-${post.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultForm({
  result,
  onSave,
  onCancel,
}: {
  result?: TestResult;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const existingChromatograms: string[] = result ? JSON.parse(result.chromatograms || "[]") : [];
  const [form, setForm] = useState({
    uid: result?.uid || "",
    orderUid: result?.orderUid || "",
    testingOrdered: result?.testingOrdered || "",
    sampleReceived: result?.sampleReceived || "",
    clientName: result?.clientName || "",
    sample: result?.sample || "",
    manufacturer: result?.manufacturer || "",
    results: result?.results || "",
  });
  const [chromatograms, setChromatograms] = useState<string[]>(existingChromatograms);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const body = {
        ...data,
        orderUid: data.orderUid || null,
        testingOrdered: data.testingOrdered || null,
        sampleReceived: data.sampleReceived || null,
        clientName: data.clientName || null,
        sample: data.sample || null,
        manufacturer: data.manufacturer || null,
        results: data.results || null,
        chromatograms: JSON.stringify(chromatograms),
      };
      if (result) {
        await apiRequest("PATCH", `/api/admin/results/${result.id}`, body);
      } else {
        await apiRequest("POST", "/api/admin/results", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: result ? "result updated" : "result created" });
      onSave();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setChromatograms((prev) => [...prev, ...data.urls]);
    } catch {
      toast({ title: "upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeChromatogram = (index: number) => {
    setChromatograms((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-dotted border-border rounded-md p-5 space-y-4">
      <h3 className="text-sm font-bold tracking-wider text-amber-400">
        {result ? "edit result" : "new result"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">uid</label>
          <Input value={form.uid} onChange={(e) => updateField("uid", e.target.value)} className="border-dotted font-mono" data-testid="input-result-uid" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">order uid (service)</label>
          <Input value={form.orderUid} onChange={(e) => updateField("orderUid", e.target.value)} className="border-dotted font-mono" data-testid="input-result-order-uid" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">testing ordered</label>
          <Input value={form.testingOrdered} onChange={(e) => updateField("testingOrdered", e.target.value)} className="border-dotted" placeholder="e.g. 2026-02-25" data-testid="input-result-testing-ordered" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">sample received</label>
          <Input value={form.sampleReceived} onChange={(e) => updateField("sampleReceived", e.target.value)} className="border-dotted" placeholder="e.g. 2026-02-26" data-testid="input-result-sample-received" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">client name</label>
          <Input value={form.clientName} onChange={(e) => updateField("clientName", e.target.value)} className="border-dotted" data-testid="input-result-client" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">sample</label>
          <Input value={form.sample} onChange={(e) => updateField("sample", e.target.value)} className="border-dotted" data-testid="input-result-sample" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">manufacturer</label>
          <Input value={form.manufacturer} onChange={(e) => updateField("manufacturer", e.target.value)} className="border-dotted" data-testid="input-result-manufacturer" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">results</label>
        <Textarea
          value={form.results}
          onChange={(e) => updateField("results", e.target.value)}
          rows={8}
          className="border-dotted font-mono text-xs"
          data-testid="input-result-results"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">chromatograms</label>
        {chromatograms.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {chromatograms.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`chromatogram ${i + 1}`} className="w-full h-24 object-cover rounded-md border border-dotted border-border" />
                <button
                  type="button"
                  onClick={() => removeChromatogram(i)}
                  className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-chromatogram-${i}`}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-dotted border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "uploading..." : "upload images"}
          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} data-testid="input-result-upload" />
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !form.uid}
          className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
          data-testid="button-result-save"
        >
          {mutation.isPending ? "saving..." : "save"}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="border border-dotted border-border" data-testid="button-result-cancel">
          cancel
        </Button>
      </div>
    </div>
  );
}

function ResultsManager() {
  const [editing, setEditing] = useState<TestResult | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const { data: results, isLoading } = useQuery<TestResult[]>({
    queryKey: ["/api/admin/results"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/results/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "result deleted" });
    },
  });

  if (editing) {
    return <ResultForm result={editing} onSave={() => setEditing(null)} onCancel={() => setEditing(null)} />;
  }

  if (creating) {
    return <ResultForm onSave={() => setCreating(false)} onCancel={() => setCreating(false)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider">test results</h3>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="gap-1.5 bg-amber-500 text-black hover:bg-amber-400 border border-dotted border-amber-400/40"
          data-testid="button-add-result"
        >
          <Plus className="h-3.5 w-3.5" />
          add result
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {results?.map((r) => (
            <div
              key={r.id}
              className="border border-dotted border-border rounded-md p-3 flex items-center justify-between gap-3"
              data-testid={`admin-result-${r.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-amber-400 truncate font-mono">
                  {r.uid}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.clientName || "no client"} · {r.sample || "no sample"} · {r.manufacturer || "no manufacturer"}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setEditing(r)}
                  className="h-7 w-7 border border-dotted border-border"
                  data-testid={`button-edit-result-${r.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    if (confirm("delete this result?")) {
                      deleteMutation.mutate(r.id);
                    }
                  }}
                  className="h-7 w-7 border border-dotted border-border text-destructive"
                  data-testid={`button-delete-result-${r.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersManager() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-high" | "price-low">("newest");

  const { data: allOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const parseJson = (str: string | null) => { try { return str ? JSON.parse(str) : null; } catch { return null; } };

  const filteredOrders = allOrders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (order.createdAt && new Date(order.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (order.createdAt && new Date(order.createdAt) > to) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const shipping = parseJson(order.shippingInfo);
      const service = parseJson(order.serviceInfo);
      const items = parseJson(order.items) || [];
      const searchableFields = [
        order.orderUid,
        order.status,
        order.paymentMethod,
        order.totalPrice,
        shipping?.firstName, shipping?.lastName, shipping?.email,
        shipping?.city, shipping?.state, shipping?.country, shipping?.streetAddress,
        service?.clientName, service?.expectedCompound, service?.manufacturer, service?.signalSimplex,
        ...items.map((i: { name: string }) => i.name),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchableFields.includes(q)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === "price-high") return Number(b.totalPrice) - Number(a.totalPrice);
    return Number(a.totalPrice) - Number(b.totalPrice);
  });

  const hasActiveFilters = search || statusFilter !== "all" || paymentFilter !== "all" || dateFrom || dateTo;

  if (isLoading) {
    return <div className="h-40 bg-muted/30 animate-pulse rounded-md" />;
  }

  return (
    <div>
      <h3 className="text-sm font-bold tracking-wider mb-4">orders ({allOrders.length})</h3>

      <div className="border border-dotted border-border rounded-md p-4 mb-4 space-y-3" data-testid="section-order-filters">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search by name, email, order id, product, compound..."
            className="border-dotted pl-8 text-xs"
            data-testid="input-order-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {["all", "pending", "paid"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs tracking-wider transition-colors border ${
                  statusFilter === s
                    ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                    : "text-muted-foreground border-dotted border-border hover:text-foreground"
                }`}
                data-testid={`button-filter-status-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {["all", "btc", "ltc", "xmr"].map((p) => (
              <button
                key={p}
                onClick={() => setPaymentFilter(p)}
                className={`px-3 py-1.5 rounded-md text-xs tracking-wider transition-colors border ${
                  paymentFilter === p
                    ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                    : "text-muted-foreground border-dotted border-border hover:text-foreground"
                }`}
                data-testid={`button-filter-payment-${p}`}
              >
                {p === "all" ? "all methods" : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">from</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-dotted text-xs w-36" data-testid="input-order-date-from" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">to</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-dotted text-xs w-36" data-testid="input-order-date-to" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">sort</label>
            <div className="flex gap-1">
              {([["newest", "newest"], ["oldest", "oldest"], ["price-high", "$ high"], ["price-low", "$ low"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`px-2 py-1.5 rounded-md text-xs tracking-wider transition-colors border ${
                    sortBy === val
                      ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                      : "text-muted-foreground border-dotted border-border hover:text-foreground"
                  }`}
                  data-testid={`button-sort-${val}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setPaymentFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5"
              data-testid="button-clear-filters"
            >
              clear filters
            </button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          showing {filteredOrders.length} of {allOrders.length} orders
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dotted border-border rounded-md">
          {allOrders.length === 0 ? "no orders yet." : "no orders match your filters."}
        </div>
      )}

      {filteredOrders.length > 0 && (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const items = parseJson(order.items) || [];
            const shipping = parseJson(order.shippingInfo);
            const service = parseJson(order.serviceInfo);
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="border border-dotted border-border rounded-md" data-testid={`order-row-${order.id}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                  data-testid={`button-order-toggle-${order.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-amber-400">{order.orderUid}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border border-dotted ${
                        order.status === "pending" ? "text-yellow-400 border-yellow-600/30 bg-yellow-700/15" :
                        order.status === "paid" ? "text-green-400 border-green-600/30 bg-green-700/15" :
                        "text-muted-foreground border-border"
                      }`}>{order.status}</span>
                      <span className="font-mono text-sm font-bold">${order.totalPrice}</span>
                      <span className="text-xs text-muted-foreground">{order.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                      {" · "}
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-dotted border-border pt-3">
                    <div>
                      <h5 className="text-xs font-bold text-amber-400 mb-2">items</h5>
                      <div className="space-y-1">
                        {items.map((item: { name: string; quantity: number; unitPrice: string }, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-mono">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {shipping && (
                      <div>
                        <h5 className="text-xs font-bold text-amber-400 mb-2">shipping info</h5>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>{shipping.firstName} {shipping.lastName}</p>
                          <p>{shipping.streetAddress}</p>
                          <p>{shipping.city}, {shipping.state} {shipping.zipCode}</p>
                          <p>{shipping.country}</p>
                          <p>{shipping.email}</p>
                        </div>
                      </div>
                    )}

                    {service && (
                      <div>
                        <h5 className="text-xs font-bold text-amber-400 mb-2">service info</h5>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>client: {service.clientName}</p>
                          <p>compound: {service.expectedCompound}</p>
                          <p>manufacturer: {service.manufacturer}</p>
                          <p>signal/simplex: {service.signalSimplex}</p>
                        </div>
                      </div>
                    )}

                    {order.bitcartInvoiceId && (
                      <div className="text-xs text-muted-foreground">
                        bitcart invoice: <span className="font-mono">{order.bitcartInvoiceId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CouponsManager() {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: allCoupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setIsActive(true);
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (c: Coupon) => {
    setEditing(c);
    setCreating(false);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderAmount(c.minOrderAmount || "");
    setMaxUses(c.maxUses?.toString() || "");
    setIsActive(c.isActive);
  };

  const startCreate = () => {
    resetForm();
    setCreating(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        code,
        discountType,
        discountValue,
        isActive,
      };
      if (minOrderAmount) body.minOrderAmount = minOrderAmount;
      if (maxUses) body.maxUses = parseInt(maxUses);
      if (editing) {
        await apiRequest("PATCH", `/api/admin/coupons/${editing.id}`, body);
      } else {
        await apiRequest("POST", "/api/admin/coupons", body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: editing ? "coupon updated" : "coupon created" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "coupon deleted" });
      if (editing) resetForm();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      await apiRequest("PATCH", `/api/admin/coupons/${id}`, { isActive: active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
  });

  if (isLoading) {
    return <div className="h-40 bg-muted/30 animate-pulse rounded-md" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider">coupons ({allCoupons.length})</h3>
        <Button size="sm" onClick={startCreate} className="gap-1.5 bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40" data-testid="button-coupon-add">
          <Plus className="h-3.5 w-3.5" /> add coupon
        </Button>
      </div>

      {(creating || editing) && (
        <div className="border border-dotted border-border rounded-md p-5 space-y-4 mb-4" data-testid="form-coupon">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="border-dotted font-mono" placeholder="e.g. SAVE10" data-testid="input-coupon-code" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">discount type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType("percentage")}
                  className={`flex-1 px-3 py-2 rounded-md text-xs tracking-wider transition-colors border ${
                    discountType === "percentage"
                      ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                      : "text-muted-foreground border-dotted border-border hover:text-foreground"
                  }`}
                  data-testid="button-coupon-type-percentage"
                >
                  percentage (%)
                </button>
                <button
                  onClick={() => setDiscountType("fixed")}
                  className={`flex-1 px-3 py-2 rounded-md text-xs tracking-wider transition-colors border ${
                    discountType === "fixed"
                      ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                      : "text-muted-foreground border-dotted border-border hover:text-foreground"
                  }`}
                  data-testid="button-coupon-type-fixed"
                >
                  fixed ($)
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                discount value {discountType === "percentage" ? "(%)" : "($)"}
              </label>
              <Input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} type="number" step="0.01" className="border-dotted" placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 5.00"} data-testid="input-coupon-value" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">min order amount ($, optional)</label>
              <Input value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} type="number" step="0.01" className="border-dotted" placeholder="e.g. 50.00" data-testid="input-coupon-min" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">max uses (optional)</label>
              <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" className="border-dotted" placeholder="unlimited if empty" data-testid="input-coupon-max-uses" />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-2 rounded-md text-xs tracking-wider transition-colors border ${
                  isActive
                    ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
                    : "text-muted-foreground border-dotted border-border"
                }`}
                data-testid="button-coupon-active-toggle"
              >
                {isActive ? "active" : "inactive"}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !code || !discountValue} className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40" data-testid="button-coupon-save">
              {saveMutation.isPending ? "saving..." : editing ? "update coupon" : "create coupon"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="border-dotted" data-testid="button-coupon-cancel">cancel</Button>
          </div>
        </div>
      )}

      {allCoupons.length === 0 && !creating && (
        <div className="text-sm text-muted-foreground text-center py-8 border border-dotted border-border rounded-md">
          no coupons yet. click "add coupon" to create one.
        </div>
      )}

      {allCoupons.length > 0 && (
        <div className="space-y-2">
          {allCoupons.map((c) => (
            <div key={c.id} className="border border-dotted border-border rounded-md p-4 flex items-center justify-between" data-testid={`coupon-row-${c.id}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-400">{c.code}</span>
                  {!c.isActive && <span className="text-xs text-red-400">(inactive)</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.discountType === "percentage" ? `${c.discountValue}% off` : `$${c.discountValue} off`}
                  {c.minOrderAmount ? ` · min $${c.minOrderAmount}` : ""}
                  {c.maxUses ? ` · ${c.usedCount}/${c.maxUses} used` : ` · ${c.usedCount} used`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate({ id: c.id, active: !c.isActive })} className="h-8 w-8 p-0" data-testid={`button-coupon-toggle-${c.id}`}>
                  {c.isActive ? <Eye className="h-3.5 w-3.5 text-amber-400" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => startEdit(c)} className="h-8 w-8 p-0" data-testid={`button-coupon-edit-${c.id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(c.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300" data-testid={`button-coupon-delete-${c.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SitePage {
  slug: string;
  title: string;
  content: string;
  updatedAt: string | null;
}

function BannerManager() {
  const { toast } = useToast();
  const [bannerText, setBannerText] = useState("");
  const [bannerLoaded, setBannerLoaded] = useState(false);

  const { data: bannerPage, isLoading: bannerLoading } = useQuery<SitePage>({
    queryKey: ["/api/pages/banner"],
  });

  if (bannerPage && !bannerLoaded) {
    setBannerText(bannerPage.content || "");
    setBannerLoaded(true);
  }

  const saveBannerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/admin/pages/banner", {
        title: "banner",
        content: bannerText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages/banner"] });
      toast({ title: "banner saved" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const disableBannerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/admin/pages/banner", {
        title: "banner",
        content: "",
      });
    },
    onSuccess: () => {
      setBannerText("");
      queryClient.invalidateQueries({ queryKey: ["/api/pages/banner"] });
      toast({ title: "banner disabled" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  if (bannerLoading) {
    return <div className="h-20 bg-muted/30 animate-pulse rounded-md" />;
  }

  return (
    <div>
      <h3 className="text-sm font-bold tracking-wider mb-4">site banner</h3>
      <div className="border border-dotted border-border rounded-md p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">banner text (leave empty to disable)</label>
          <Input
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="border-dotted"
            placeholder="e.g. free shipping on orders over $100"
            data-testid="input-banner-text"
          />
        </div>
        {bannerText && (
          <div className="bg-amber-700/15 border border-dotted border-amber-600/30 rounded-md px-4 py-2 text-center">
            <p className="text-xs text-amber-400 tracking-wider">{bannerText}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => saveBannerMutation.mutate()}
            disabled={saveBannerMutation.isPending}
            className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
            data-testid="button-banner-save"
          >
            {saveBannerMutation.isPending ? "saving..." : "save banner"}
          </Button>
          {bannerText && (
            <Button
              onClick={() => disableBannerMutation.mutate()}
              disabled={disableBannerMutation.isPending}
              variant="outline"
              className="border-dotted text-red-400 hover:text-red-300 hover:bg-red-900/20"
              data-testid="button-banner-disable"
            >
              {disableBannerMutation.isPending ? "disabling..." : "disable banner"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PagesManager() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: page, isLoading } = useQuery<SitePage>({
    queryKey: ["/api/pages/terms"],
  });

  if (page && !loaded) {
    setContent(page.content || "");
    setLoaded(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/admin/pages/terms", {
        title: "terms of service",
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages/terms"] });
      toast({ title: "terms of service saved" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="h-40 bg-muted/30 animate-pulse rounded-md" />;
  }

  return (
    <div className="space-y-8">
      <BannerManager />
      <div>
        <h3 className="text-sm font-bold tracking-wider mb-4">terms of service</h3>
        <div className="border border-dotted border-border rounded-md p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="border-dotted font-mono text-xs"
              placeholder="enter your terms of service here..."
              data-testid="input-terms-content"
            />
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
            data-testid="button-terms-save"
          >
            {saveMutation.isPending ? "saving..." : "save terms"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"products" | "posts" | "results" | "orders" | "coupons" | "pages">("products");

  const { data: authData, isLoading: authLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
    },
  });

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-muted-foreground">
        loading...
      </div>
    );
  }

  if (!authData?.isAdmin) {
    return (
      <AdminLogin
        onLogin={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] })}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-wider text-amber-400" data-testid="text-admin-heading">
          admin panel
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          className="gap-1.5 border border-dotted border-border"
          data-testid="button-admin-logout"
        >
          <LogOut className="h-3.5 w-3.5" />
          logout
        </Button>
      </div>

      <div className="glow-line w-full mb-6" />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("products")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "products"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-products"
        >
          <Package className="h-3.5 w-3.5" />
          products
        </button>
        <button
          onClick={() => setTab("posts")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "posts"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-posts"
        >
          <Pen className="h-3.5 w-3.5" />
          blog posts
        </button>
        <button
          onClick={() => setTab("results")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "results"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-results"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          results
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "orders"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-orders"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          orders
        </button>
        <button
          onClick={() => setTab("coupons")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "coupons"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-coupons"
        >
          <Tag className="h-3.5 w-3.5" />
          coupons
        </button>
        <button
          onClick={() => setTab("pages")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs tracking-wider transition-colors border ${
            tab === "pages"
              ? "bg-amber-700/15 text-amber-400 border-dotted border-amber-600/30"
              : "text-muted-foreground border-dotted border-border hover:text-foreground"
          }`}
          data-testid="tab-pages"
        >
          <FileText className="h-3.5 w-3.5" />
          pages
        </button>
      </div>

      {tab === "products" && <ProductsManager />}
      {tab === "posts" && <PostsManager />}
      {tab === "results" && <ResultsManager />}
      {tab === "orders" && <OrdersManager />}
      {tab === "coupons" && <CouponsManager />}
      {tab === "pages" && <PagesManager />}
    </div>
  );
}
