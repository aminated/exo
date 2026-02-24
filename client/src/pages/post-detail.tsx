import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@shared/schema";

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/posts", slug],
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

  if (!post) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground mb-4">post not found.</p>
        <Link href="/musings">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            back to musings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="section-post-detail">
      <Link href="/musings">
        <Button variant="ghost" className="gap-2 mb-6 -ml-2 text-muted-foreground" data-testid="button-back-musings">
          <ArrowLeft className="h-4 w-4" />
          back to musings
        </Button>
      </Link>

      <h1
        className="text-2xl font-bold tracking-wide mb-3 text-amber-400"
        data-testid="text-post-title"
      >
        {post.title}
      </h1>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4">
        <Calendar className="h-3 w-3" />
        {post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "draft"}
      </div>

      <div className="glow-line w-full mb-6" />

      <div
        className="prose prose-stone max-w-none text-sm leading-relaxed"
        data-testid="text-post-content"
      >
        {post.content.split("\n").map((paragraph, i) => (
          <p key={i} className="mb-4 last:mb-0 text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
