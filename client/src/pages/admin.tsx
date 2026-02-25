import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Pencil, Trash2, Package, Pen, Lock, EyeOff, Eye } from "lucide-react";
import type { Product, BlogPost } from "@shared/schema";

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
                  ${Number(product.unitPrice).toFixed(2)} · {product.inStock ? "in stock" : "out of stock"}{product.isHidden ? " · hidden" : ""}
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

export default function Admin() {
  const [tab, setTab] = useState<"products" | "posts">("products");

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
      </div>

      {tab === "products" ? <ProductsManager /> : <PostsManager />}
    </div>
  );
}
