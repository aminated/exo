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
            <NavLink href="/">
              <Package className="h-3.5 w-3.5" />
              products
            </NavLink>
            <NavLink href="/musings" matchPrefix="/musings">
              <Pen className="h-3.5 w-3.5" />
              musings
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-dotted border-border px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-muted-foreground/50">
          all transactions are final. ship worldwide.
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/musings" component={Musings} />
        <Route path="/musings/:slug" component={PostDetail} />
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
