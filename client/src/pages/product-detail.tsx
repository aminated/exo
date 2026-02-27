import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { cart, addToCart, removeFromCart } = useCart();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", slug],
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-muted/30 animate-pulse rounded-md mb-4" />
        <div className="h-4 w-full bg-muted/30 animate-pulse rounded-md mb-2" />
        <div className="h-4 w-3/4 bg-muted/30 animate-pulse rounded-md mb-2" />
        <div className="h-4 w-1/2 bg-muted/30 animate-pulse rounded-md" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">product not found.</p>
        <Link href="/products">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            back to products
          </Button>
        </Link>
      </div>
    );
  }

  const qty = product ? (cart[product.id] || 0) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="section-product-detail">
      <Link href="/products">
        <Button variant="ghost" className="gap-2 mb-6 -ml-2 text-muted-foreground" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          back to products
        </Button>
      </Link>

      <h1
        className="text-2xl font-bold tracking-wide mb-2 text-amber-400"
        data-testid="text-product-name"
      >
        {product.name}
      </h1>

      <div className="glow-line w-full mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {product.concentration && (
          <InfoCard label="concentration" value={product.concentration} />
        )}
        {product.type && <InfoCard label="type" value={product.type} />}
        <InfoCard
          label="price"
          value={`$${Number(product.unitPrice).toFixed(2)}`}
        />
        <InfoCard
          label="status"
          value={product.inStock ? "in stock" : "out of stock"}
          valueClass={product.inStock ? "text-green-400" : "text-destructive"}
        />
      </div>

      {product.description && (
        <div className="border border-dotted border-border rounded-md p-5 bg-card/40">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">
            description
          </h2>
          <div
            className="prose prose-stone max-w-none text-sm leading-relaxed text-foreground/90"
            data-testid="text-product-description"
          >
            {product.description.split("\n").map((paragraph, i) => (
              <p key={i} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border border-dotted border-border rounded-md p-5 bg-amber-700/15" data-testid="section-add-to-cart">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => removeFromCart(product.id)}
              disabled={!product.inStock || qty === 0}
              className="h-9 w-9 border border-dotted border-border"
              data-testid="button-detail-minus"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span
              className="w-10 text-center font-mono text-lg tabular-nums"
              data-testid="text-detail-qty"
            >
              {qty}
            </span>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => addToCart(product.id)}
              disabled={!product.inStock}
              className="h-9 w-9 border border-dotted border-border"
              data-testid="button-detail-plus"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/products">
            <Button
              variant="default"
              disabled={!product.inStock || qty === 0}
              className="gap-2 bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
              data-testid="button-view-cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {qty > 0 ? `view cart (${qty})` : product.inStock ? "add to cart" : "out of stock"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="border border-dotted border-border rounded-md p-3 bg-card/40">
      <div className="text-xs text-muted-foreground tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-sm font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}
