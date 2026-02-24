import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { cart, addToCart, removeFromCart } = useCart();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-wider uppercase mb-1" data-testid="text-products-heading">
          Products
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
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm" data-testid="table-products">
            <thead>
              <tr className="border-b border-border bg-card/60">
                <th className="text-left p-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground">
                  Product
                </th>
                <th className="text-left p-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground hidden sm:table-cell">
                  Concentration
                </th>
                <th className="text-left p-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left p-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground">
                  Unit Price
                </th>
                <th className="text-center p-3 font-semibold tracking-wider uppercase text-xs text-muted-foreground">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => {
                const qty = cart[product.id] || 0;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border/50 last:border-b-0 transition-colors"
                    data-testid={`row-product-${product.id}`}
                  >
                    <td className="p-3">
                      <Link
                        href={`/product/${product.slug}`}
                        className="text-purple-300 hover:text-purple-200 underline underline-offset-2 decoration-purple-500/40 hover:decoration-purple-400/60 transition-colors font-medium"
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
                          OUT OF STOCK
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
                          className="h-7 w-7 text-xs"
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
                          className="h-7 w-7 text-xs"
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

      <PaymentSection cart={cart} products={products} />
    </div>
  );
}

function PaymentSection({
  cart,
  products,
}: {
  cart: Record<number, number>;
  products?: Product[];
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("btc");

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = products
    ? Object.entries(cart).reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === Number(id));
        return sum + (product ? Number(product.unitPrice) * qty : 0);
      }, 0)
    : 0;

  const paymentMethods = [
    { id: "btc", label: "Bitcoin (BTC)" },
    { id: "ltc", label: "Litecoin (LTC)" },
    { id: "xmr", label: "Monero (XMR)" },
  ];

  return (
    <div className="mt-8 border border-border rounded-md p-5" data-testid="section-payment">
      <h3 className="text-sm font-bold tracking-wider uppercase mb-4">
        Select Payment Method:
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {paymentMethods.map((pm) => (
          <button
            key={pm.id}
            onClick={() => setSelectedPayment(pm.id)}
            className={`px-5 py-2.5 rounded-md text-sm font-mono tracking-wide transition-all border ${
              selectedPayment === pm.id
                ? "bg-purple-800/60 border-purple-500/60 text-purple-100"
                : "bg-card border-border text-muted-foreground hover:border-purple-500/30"
            }`}
            data-testid={`button-payment-${pm.id}`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-5">
        <span className="text-purple-400 font-semibold">Payment Processing:</span>{" "}
        Bitcoin and Litecoin payments are marked as paid automatically after 1
        confirmation. Monero payments are marked as paid within 72 hours, or
        instantly upon entering the TXID.
      </p>

      {totalItems > 0 && (
        <div className="border-t border-border pt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm">
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-bold font-mono text-lg">
              ${totalPrice.toFixed(2)}
            </span>{" "}
            <span className="text-muted-foreground text-xs">
              ({totalItems} item{totalItems > 1 ? "s" : ""})
            </span>
          </div>
          <Button
            variant="default"
            className="gap-2"
            data-testid="button-checkout"
          >
            <ShoppingCart className="h-4 w-4" />
            Checkout with {paymentMethods.find((p) => p.id === selectedPayment)?.label}
          </Button>
        </div>
      )}
    </div>
  );
}
