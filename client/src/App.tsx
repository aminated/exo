import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ProductDetail from "@/pages/product-detail";
import Musings from "@/pages/musings";
import PostDetail from "@/pages/post-detail";
import Admin from "@/pages/admin";
import { Package, Pen } from "lucide-react";

function NavLink({
  href,
  children,
  matchPrefix,
}: {
  href: string;
  children: React.ReactNode;
  matchPrefix?: string;
}) {
  const [location] = useLocation();
  const isActive = matchPrefix
    ? location === href || location.startsWith(matchPrefix)
    : location === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs tracking-wider transition-colors ${
        isActive
          ? "bg-amber-700/15 text-amber-400 border border-dotted border-amber-600/30"
          : "text-muted-foreground hover:text-foreground border border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}

function RotatingPill() {
  return (
    <div className="animate-spin-slow" data-testid="rotating-pill">
      <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="pill-right-half">
            <rect x="24" y="0" width="24" height="24" />
          </clipPath>
        </defs>
        <rect x="1" y="1" width="46" height="22" rx="11" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="1" y="1" width="46" height="22" rx="11" fill="#FFD700" fillOpacity="0.3" clipPath="url(#pill-right-half)" />
        <line x1="24" y1="3" x2="24" y2="21" stroke="#FFD700" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-dotted border-border px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <h1
              className="text-base font-bold tracking-widest text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              data-testid="link-logo"
            >
              "supplements"
            </h1>
          </Link>
          <nav className="flex items-center gap-2" data-testid="nav-main">
            <NavLink href="/" matchPrefix="/musings">
              <Pen className="h-3.5 w-3.5" />
              musings
            </NavLink>
            <NavLink href="/products" matchPrefix="/product">
              <Package className="h-3.5 w-3.5" />
              products
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-dotted border-border px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg">"</span>
            <RotatingPill />
            <span className="text-amber-400 font-bold text-lg">"</span>
          </div>
          <div className="text-xs text-muted-foreground/50">
            all transactions are final. ship worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Musings} />
        <Route path="/musings/:slug" component={PostDetail} />
        <Route path="/products" component={Home} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
