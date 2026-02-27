import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { worldDots, usDots } from "@/lib/world-map-data";

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
                          <span className="text-sm font-bold leading-none">−</span>
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
                          <span className="text-sm font-bold leading-none">+</span>
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
      <ShippingMap />
    </div>
  );
}

function ShippingMap() {
  return (
    <div className="mt-10 border border-dotted border-border rounded-md p-5 bg-amber-700/15" data-testid="section-shipping-map">
      <h3 className="text-sm font-bold tracking-wider mb-4">we ship to:</h3>
      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 360 180"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {worldDots.map(([x, y], i) => (
            <circle
              key={`w${i}`}
              cx={x}
              cy={y}
              r={1.2}
              fill="none"
              stroke="#fbbf2440"
              strokeWidth="0.3"
              strokeDasharray="0.5 0.5"
            />
          ))}
          {usDots.map(([x, y], i) => (
            <circle
              key={`u${i}`}
              cx={x}
              cy={y}
              r={1.2}
              fill="#fbbf24"
              fillOpacity="0.6"
              stroke="#fbbf24"
              strokeWidth="0.4"
              strokeDasharray="0.5 0.5"
            />
          ))}
        </svg>
      </div>
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
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "", lastName: "", country: "", streetAddress: "",
    city: "", state: "", zipCode: "", email: "",
  });
  const [serviceInfo, setServiceInfo] = useState({
    clientName: "", expectedCompound: "", manufacturer: "", signalSimplex: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; discountType: string; discountValue: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();

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

  const hasProducts = products
    ? Object.entries(cart).some(([id, qty]) => {
        const product = products.find((p) => p.id === Number(id));
        return product && qty > 0 && product.category !== "service";
      })
    : false;

  const hasServices = products
    ? Object.entries(cart).some(([id, qty]) => {
        const product = products.find((p) => p.id === Number(id));
        return product && qty > 0 && product.category === "service";
      })
    : false;

  const shippingValid = !hasProducts || (
    shippingInfo.firstName && shippingInfo.lastName && shippingInfo.country &&
    shippingInfo.streetAddress && shippingInfo.city && shippingInfo.state &&
    shippingInfo.zipCode && shippingInfo.email
  );

  const serviceValid = !hasServices || (
    serviceInfo.clientName && serviceInfo.expectedCompound && serviceInfo.manufacturer && serviceInfo.signalSimplex
  );

  const finalPrice = appliedCoupon ? Math.max(0, totalPrice - appliedCoupon.discount) : totalPrice;

  const applyCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/coupons/validate", { code: couponCode, subtotal: totalPrice });
      return await res.json();
    },
    onSuccess: (data: { code: string; discount: number; discountType: string; discountValue: string }) => {
      setAppliedCoupon(data);
      setCouponError("");
      toast({ title: `coupon "${data.code}" applied` });
    },
    onError: (err: Error) => {
      setCouponError(err.message);
      setAppliedCoupon(null);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        items: cartItems,
        totalPrice: finalPrice,
        paymentMethod: selectedPayment,
      };
      if (hasProducts) body.shippingInfo = shippingInfo;
      if (hasServices) body.serviceInfo = serviceInfo;
      if (appliedCoupon) body.couponCode = appliedCoupon.code;
      const res = await apiRequest("POST", "/api/checkout", body);
      return await res.json();
    },
    onSuccess: (data: { configured: boolean; checkoutUrl?: string; invoiceId?: string; orderUid: string; message?: string; paymentFailed?: boolean }) => {
      if (data.paymentFailed) {
        clearCart();
        toast({
          title: `order ${data.orderUid} saved`,
          description: data.message || "payment invoice could not be created. please try again shortly.",
          variant: "destructive",
        });
      } else if (data.configured && data.invoiceId) {
        clearCart();
        navigate(`/checkout/${data.invoiceId}`);
      } else {
        clearCart();
        toast({
          title: `order ${data.orderUid} created`,
          description: data.message || "payment processing is not configured yet.",
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

  const updateShipping = (field: string, value: string) =>
    setShippingInfo((prev) => ({ ...prev, [field]: value }));

  const updateService = (field: string, value: string) =>
    setServiceInfo((prev) => ({ ...prev, [field]: value }));

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

      {totalItems > 0 && hasProducts && (
        <div className="border border-dotted border-border rounded-md p-5 mt-4 mb-4" data-testid="section-shipping-form">
          <h4 className="text-xs font-bold tracking-wider text-amber-400 mb-3">shipping details:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">first name</label>
              <Input value={shippingInfo.firstName} onChange={(e) => updateShipping("firstName", e.target.value)} className="border-dotted" data-testid="input-shipping-firstname" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">last name</label>
              <Input value={shippingInfo.lastName} onChange={(e) => updateShipping("lastName", e.target.value)} className="border-dotted" data-testid="input-shipping-lastname" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">country/region</label>
              <Input value={shippingInfo.country} onChange={(e) => updateShipping("country", e.target.value)} className="border-dotted" data-testid="input-shipping-country" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">street address</label>
              <Input value={shippingInfo.streetAddress} onChange={(e) => updateShipping("streetAddress", e.target.value)} className="border-dotted" data-testid="input-shipping-street" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">town/city</label>
              <Input value={shippingInfo.city} onChange={(e) => updateShipping("city", e.target.value)} className="border-dotted" data-testid="input-shipping-city" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">state</label>
              <Input value={shippingInfo.state} onChange={(e) => updateShipping("state", e.target.value)} className="border-dotted" data-testid="input-shipping-state" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">zip code</label>
              <Input value={shippingInfo.zipCode} onChange={(e) => updateShipping("zipCode", e.target.value)} className="border-dotted" data-testid="input-shipping-zip" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">email address</label>
              <Input value={shippingInfo.email} onChange={(e) => updateShipping("email", e.target.value)} type="email" className="border-dotted" data-testid="input-shipping-email" />
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && hasServices && (
        <div className="border border-dotted border-border rounded-md p-5 mt-4 mb-4" data-testid="section-service-form">
          <h4 className="text-xs font-bold tracking-wider text-amber-400 mb-3">service details:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">client name</label>
              <Input value={serviceInfo.clientName} onChange={(e) => updateService("clientName", e.target.value)} className="border-dotted" data-testid="input-service-client" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">expected compound</label>
              <Input value={serviceInfo.expectedCompound} onChange={(e) => updateService("expectedCompound", e.target.value)} className="border-dotted" data-testid="input-service-compound" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">manufacturer</label>
              <Input value={serviceInfo.manufacturer} onChange={(e) => updateService("manufacturer", e.target.value)} className="border-dotted" data-testid="input-service-manufacturer" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">signal/simplex</label>
              <Input value={serviceInfo.signalSimplex} onChange={(e) => updateService("signalSimplex", e.target.value)} className="border-dotted" data-testid="input-service-signal" />
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="border-t border-dotted border-border pt-4 pb-2 flex flex-col items-center gap-3">
          <div className="w-full max-w-sm mx-auto" data-testid="section-coupon">
            <div className="relative">
              <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && couponCode && !applyCouponMutation.isPending) applyCouponMutation.mutate(); }}
                placeholder="coupon code — press enter to apply"
                className="border-dotted pl-8 font-mono text-xs"
                data-testid="input-coupon-code"
              />
            </div>
          </div>
          {couponError && <p className="text-xs text-red-400" data-testid="text-coupon-error">{couponError}</p>}
          {appliedCoupon && (
            <div className="flex items-center gap-2 text-xs" data-testid="text-coupon-applied">
              <span className="text-amber-400">coupon "{appliedCoupon.code}" applied:</span>
              <span className="text-green-400">
                −${appliedCoupon.discount.toFixed(2)}
                {appliedCoupon.discountType === "percentage" ? ` (${appliedCoupon.discountValue}%)` : ""}
              </span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-muted-foreground hover:text-foreground" data-testid="button-remove-coupon">✕</button>
            </div>
          )}
          <div className="text-sm text-center">
            {appliedCoupon ? (
              <>
                <span className="text-muted-foreground line-through mr-2">${totalPrice.toFixed(2)}</span>
                <span className="font-bold font-mono text-lg text-amber-400">
                  ${finalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">total:</span>{" "}
                <span className="font-bold font-mono text-lg">
                  ${totalPrice.toFixed(2)}
                </span>
              </>
            )}
            {" "}
            <span className="text-muted-foreground text-xs">
              ({totalItems} item{totalItems > 1 ? "s" : ""})
            </span>
          </div>
          <Button
            variant="default"
            className="gap-2 bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
            disabled={checkoutMutation.isPending || !shippingValid || !serviceValid}
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
