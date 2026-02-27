import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Copy, Check, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  paymentMethodId: string;
  destination: string;
  amount: string;
  rate: number;
  paymentLink?: string;
}

interface InvoiceData {
  id: string;
  amount: string;
  currency: string;
  status: string;
  expirationTime: number;
  createdTime: number;
  metadata: { orderId?: string; paymentMethod?: string };
  paymentMethods: PaymentMethod[];
}

function DottedQR({ data, size = 200 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    import("qrcode").then((QRCode) => {
      const modules = QRCode.create(data, { errorCorrectionLevel: "M" }).modules;
      const moduleCount = modules.size;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dotSize = Math.floor(size / (moduleCount + 4));
      const actualSize = dotSize * (moduleCount + 4);
      canvas.width = actualSize;
      canvas.height = actualSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, actualSize, actualSize);

      const offset = dotSize * 2;
      const radius = dotSize * 0.35;

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (modules.get(row, col)) {
            const x = offset + col * dotSize + dotSize / 2;
            const y = offset + row * dotSize + dotSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = "#fbbf24";
            ctx.fill();
          }
        }
      }

      setReady(true);
    });
  }, [data, size]);

  return (
    <div className="flex justify-center">
      <div className="border border-dotted border-amber-600/30 rounded-md p-4 bg-black inline-block">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, imageRendering: "auto" }}
          className={ready ? "opacity-100" : "opacity-0"}
          data-testid="qr-code"
        />
        {!ready && (
          <div style={{ width: size, height: size }} className="flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: `${label} copied` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "copy failed", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-amber-400 transition-colors p-1"
      data-testid={`button-copy-${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Countdown({ expirationTime }: { expirationTime: number }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = expirationTime - now;
      if (diff <= 0) {
        setRemaining("expired");
        return;
      }
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expirationTime]);

  const isExpired = remaining === "expired";

  return (
    <div className={`flex items-center gap-1.5 text-xs ${isExpired ? "text-red-400" : "text-muted-foreground"}`}>
      <Clock className="h-3.5 w-3.5" />
      <span data-testid="text-countdown">{isExpired ? "invoice expired" : `expires in ${remaining}`}</span>
    </div>
  );
}

function getPaymentLabel(methodId: string): string {
  const map: Record<string, string> = {
    "BTC-CHAIN": "bitcoin (on-chain)",
    "BTC-LN": "bitcoin (lightning)",
    "BTC-OnChain": "bitcoin (on-chain)",
    "BTC-LightningNetwork": "bitcoin (lightning)",
    "LTC-CHAIN": "litecoin",
    "LTC-OnChain": "litecoin",
    "XMR-CHAIN": "monero",
    "XMR-MoneroLike": "monero",
  };
  return map[methodId] || methodId.toLowerCase();
}

function getCryptoSymbol(methodId: string): string {
  if (methodId.startsWith("BTC")) return "btc";
  if (methodId.startsWith("LTC")) return "ltc";
  if (methodId.startsWith("XMR")) return "xmr";
  return methodId.split("-")[0].toLowerCase();
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  if (lower === "settled" || lower === "complete") {
    return (
      <div className="flex items-center gap-1.5 text-green-400 text-xs">
        <CheckCircle2 className="h-4 w-4" />
        <span>payment received</span>
      </div>
    );
  }
  if (lower === "expired" || lower === "invalid") {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs">
        <AlertCircle className="h-4 w-4" />
        <span>{lower === "expired" ? "invoice expired" : "payment invalid"}</span>
      </div>
    );
  }
  return null;
}

export default function Checkout() {
  const [, params] = useRoute("/checkout/:invoiceId");
  const invoiceId = params?.invoiceId;
  const [selectedMethod, setSelectedMethod] = useState(0);

  const { data: invoice, isLoading, error } = useQuery<InvoiceData>({
    queryKey: [`/api/invoice/${invoiceId}`],
    enabled: !!invoiceId,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto" data-testid="page-checkout">
        <div className="space-y-4">
          <div className="h-8 bg-muted/30 animate-pulse rounded-md w-48" />
          <div className="h-64 bg-muted/30 animate-pulse rounded-md" />
          <div className="h-32 bg-muted/30 animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="w-full max-w-lg mx-auto text-center mt-20" data-testid="page-checkout">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-muted-foreground mb-2">invoice not found or has expired.</p>
        <Link href="/products" className="text-amber-400 hover:text-amber-300 underline underline-offset-2 text-sm">
          back to products
        </Link>
      </div>
    );
  }

  const isSettled = invoice.status.toLowerCase() === "settled" || invoice.status.toLowerCase() === "complete";
  const isExpired = invoice.status.toLowerCase() === "expired";
  const method = invoice.paymentMethods[selectedMethod];

  return (
    <div className="w-full max-w-lg mx-auto" data-testid="page-checkout">
      <Link href="/products" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block" data-testid="link-back-products">
        ← back to products
      </Link>

      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-wider mb-1">
          <span className="text-muted-foreground">payment:</span>{" "}
          <span className="font-mono text-amber-400">{invoice.metadata?.orderId || invoice.id}</span>
        </h2>
        <div className="glow-line w-full mb-4" />
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-bold">${invoice.amount}</span> {invoice.currency}
          </div>
          {!isSettled && !isExpired && <Countdown expirationTime={invoice.expirationTime} />}
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {isSettled && (
        <div className="border border-dotted border-green-600/50 rounded-md p-6 bg-green-900/10 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
          <h3 className="text-sm font-bold tracking-wider text-green-400">payment confirmed</h3>
          <p className="text-xs text-muted-foreground">
            your order <span className="font-mono text-amber-400">{invoice.metadata?.orderId}</span> has been paid.
          </p>
        </div>
      )}

      {isExpired && (
        <div className="border border-dotted border-red-600/50 rounded-md p-6 bg-red-900/10 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h3 className="text-sm font-bold tracking-wider text-red-400">invoice expired</h3>
          <p className="text-xs text-muted-foreground">
            this invoice has expired. please create a new order.
          </p>
          <Link href="/products" className="text-amber-400 hover:text-amber-300 underline underline-offset-2 text-xs inline-block mt-2">
            back to products
          </Link>
        </div>
      )}

      {!isSettled && !isExpired && method && (
        <div className="space-y-5">
          {invoice.paymentMethods.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {invoice.paymentMethods.map((m, i) => (
                <button
                  key={m.paymentMethodId}
                  onClick={() => setSelectedMethod(i)}
                  className={`px-3 py-1.5 rounded-md text-xs tracking-wider border border-dotted transition-colors ${
                    i === selectedMethod
                      ? "bg-amber-700/15 text-amber-400 border-amber-600/30"
                      : "text-muted-foreground border-border hover:text-foreground"
                  }`}
                  data-testid={`button-method-${m.paymentMethodId}`}
                >
                  {getPaymentLabel(m.paymentMethodId)}
                </button>
              ))}
            </div>
          )}

          <div className="border border-dotted border-border rounded-md p-5 space-y-5">
            <div className="text-center">
              <span className="text-xs text-muted-foreground tracking-wider">
                send exactly
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-lg font-bold font-mono text-amber-400" data-testid="text-crypto-amount">
                  {method.amount}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {getCryptoSymbol(method.paymentMethodId)}
                </span>
                <CopyButton text={method.amount} label="amount" />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                rate: 1 {getCryptoSymbol(method.paymentMethodId)} = ${method.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>

            <DottedQR data={method.paymentLink || method.destination} size={220} />

            <div>
              <span className="text-xs text-muted-foreground tracking-wider block mb-1.5">
                {method.paymentMethodId.includes("LN") || method.paymentMethodId.includes("Lightning") ? "lightning invoice" : "address"}
              </span>
              <div className="flex items-center gap-2 bg-amber-700/10 border border-dotted border-amber-600/20 rounded-md px-3 py-2">
                <code className="text-xs font-mono text-amber-400 break-all flex-1" data-testid="text-address">
                  {method.destination}
                </code>
                <CopyButton text={method.destination} label="address" />
              </div>
            </div>

            {method.paymentLink && (
              <div className="text-center">
                <a
                  href={method.paymentLink}
                  className="text-xs text-muted-foreground hover:text-amber-400 underline underline-offset-2 transition-colors"
                  data-testid="link-open-wallet"
                >
                  open in wallet
                </a>
              </div>
            )}
          </div>

          <div className="border border-dotted border-border rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-muted-foreground tracking-wider">waiting for payment</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              this page will update automatically when your payment is detected. do not close this page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
