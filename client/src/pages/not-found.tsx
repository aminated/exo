import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-20">
      <h1 className="text-4xl font-bold text-amber-800 mb-2">404</h1>
      <p className="text-muted-foreground mb-6">page not found.</p>
      <Link href="/">
        <Button variant="secondary" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          back to products
        </Button>
      </Link>
    </div>
  );
}
