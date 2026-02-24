import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { cart, addToCart, removeFromCart, clearCart } = useCart();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-wider mb-1" data-testid="text-products-heading">
          products
        </h2>
        <div className="glow-line w-full mb-6" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 bg-muted/30 animate-pulse rounded-md"
            />
          ))}
        </div>
      ) : (
        <div className="border border-dotted border-border rounded-md overflow-hidden">
          <table className="w-full text-sm" data-testid="table-products">
            <thead>
              <tr className="border-b border-dotted border-border bg-card/60">
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground">
                  product
                </th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground hidden sm:table-cell">
                  concentration
                </th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground hidden sm:table-cell">
                  type
                </th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground">
                  unit price
                </th>
                <th className="text-center p-3 font-semibold tracking-wider text-xs text-muted-foreground">
                  quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-dotted border-border/50 last:border-b-0 transition-colors"
                    data-testid={`row-product-${product.id}`}
                  >
                    <td className="p-3">
                      <Link
                        href={`/product/${product.slug}`}
                        className="text-amber-400 hover:text-amber-300 underline underline-offset-2 decoration-amber-500/40 hover:decoration-amber-400/60 transition-colors font-medium"
                        data-testid={`link-product-${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">
                      {product.inStock ? (
                        product.concentration || "-"
                      ) : (
                        <span className="text-destructive font-bold tracking-wider text-xs">
                          out of stock
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">
                      {product.inStock ? product.type || "-" : ""}
                    </td>
                    <td className="p-3 font-mono">
                      ${Number(product.unitPrice).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => removeFromCart(product.id)}
                          disabled={!product.inStock || qty === 0}
                          className="h-7 w-7 text-xs border border-dotted border-border"
                          data-testid={`button-minus-${product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span
                          className="w-8 text-center font-mono tabular-nums"
                          data-testid={`text-qty-${product.id}`}
                        >
                          {qty}
                        </span>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => addToCart(product.id)}
                          disabled={!product.inStock}
                          className="h-7 w-7 text-xs border border-dotted border-border"
                          data-testid={`button-plus-${product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PaymentSection cart={cart} products={products} clearCart={clearCart} />
    </div>
  );
}

function PaymentSection({
  cart,
  products,
  clearCart,
}: {
  cart: Record<number, number>;
  products?: Product[];
  clearCart: () => void;
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("btc");
  const { toast } = useToast();

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = products
    ? Object.entries(cart).reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === Number(id));
        return sum + (product ? Number(product.unitPrice) * qty : 0);
      }, 0)
    : 0;

  const cartItems = products
    ? Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const product = products.find((p) => p.id === Number(id));
          return product ? { productId: product.id, name: product.name, quantity: qty, unitPrice: product.unitPrice } : null;
        })
        .filter(Boolean)
    : [];

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout", {
        items: cartItems,
        totalPrice,
        paymentMethod: selectedPayment,
      });
      return await res.json();
    },
    onSuccess: (data: { configured: boolean; checkoutUrl?: string; orderId: number; message?: string }) => {
      if (data.configured && data.checkoutUrl) {
        clearCart();
        window.open(data.checkoutUrl, "_blank");
        toast({ title: `order #${data.orderId} created — redirecting to payment` });
      } else {
        clearCart();
        toast({
          title: `order #${data.orderId} created`,
          description: "bitcart is not configured yet. set up your bitcart instance to enable payment processing.",
        });
      }
    },
    onError: () => {
      toast({ title: "checkout failed", variant: "destructive" });
    },
  });

  const paymentMethods = [
    { id: "btc", label: "bitcoin (btc)" },
    { id: "ltc", label: "litecoin (ltc)" },
    { id: "xmr", label: "monero (xmr)" },
  ];

  return (
    <div className="mt-8 border border-dotted border-border rounded-md p-5" data-testid="section-payment">
      <h3 className="text-sm font-bold tracking-wider mb-4">
        select payment method:
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {paymentMethods.map((pm) => (
          <button
            key={pm.id}
            onClick={() => setSelectedPayment(pm.id)}
            className={`px-5 py-2.5 rounded-md text-sm font-mono tracking-wide transition-all border ${
              selectedPayment === pm.id
                ? "bg-amber-700/15 border-dotted border-amber-600/50 text-amber-400"
                : "bg-card border-dotted border-border text-muted-foreground hover:border-amber-600/30"
            }`}
            data-testid={`button-payment-${pm.id}`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-5">
        <span className="text-amber-400 font-semibold">payment processing:</span>{" "}
        bitcoin and litecoin payments are marked as paid automatically after 1
        confirmation. monero payments are marked as paid within 72 hours, or
        instantly upon entering the txid.
      </p>

      {totalItems > 0 && (
        <div className="border-t border-dotted border-border pt-4 pb-2 flex flex-col items-center gap-3">
          <div className="text-sm text-center">
            <span className="text-muted-foreground">total:</span>{" "}
            <span className="font-bold font-mono text-lg">
              ${totalPrice.toFixed(2)}
            </span>{" "}
            <span className="text-muted-foreground text-xs">
              ({totalItems} item{totalItems > 1 ? "s" : ""})
            </span>
          </div>
          <Button
            variant="default"
            className="gap-2 bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
            disabled={checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate()}
            data-testid="button-checkout"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {checkoutMutation.isPending ? "processing..." : `checkout with ${paymentMethods.find((p) => p.id === selectedPayment)?.label}`}
          </Button>
        </div>
      )}
    </div>
  );
}
