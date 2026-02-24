import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar } from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function Musings() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-wider mb-1" data-testid="text-musings-heading">
          musings
        </h2>
        <div className="glow-line w-full mb-2" />
        <p className="text-sm text-muted-foreground">
          thoughts, notes, and things worth sharing.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-md p-5 bg-card/40">
              <div className="h-5 w-48 bg-muted/30 animate-pulse rounded-md mb-3" />
              <div className="h-3 w-full bg-muted/30 animate-pulse rounded-md mb-2" />
              <div className="h-3 w-3/4 bg-muted/30 animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/musings/${post.slug}`}
              className="block"
            >
              <article
                className="border border-border rounded-md p-5 bg-card/40 hover:bg-card/60 hover:border-amber-500/30 transition-all cursor-pointer group"
                data-testid={`card-post-${post.id}`}
              >
                <h3 className="text-base font-semibold text-amber-400 group-hover:text-amber-300 transition-colors mb-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Calendar className="h-3 w-3" />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "draft"}
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground" data-testid="text-no-posts">
          <p>no musings yet. check back soon.</p>
        </div>
      )}
    </div>
  );
}
