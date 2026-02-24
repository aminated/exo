import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { BlogPost } from "@shared/schema";

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [unlockedPost, setUnlockedPost] = useState<BlogPost | null>(null);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/posts", slug],
  });

  const unlockMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await apiRequest("POST", `/api/posts/${slug}/unlock`, { password: pw });
      return await res.json();
    },
    onSuccess: (data: BlogPost) => {
      setUnlockedPost(data);
    },
    onError: () => {
      toast({ title: "incorrect password", variant: "destructive" });
    },
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
        <Link href="/">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            back to musings
          </Button>
        </Link>
      </div>
    );
  }

  const displayPost = unlockedPost || post;
  const isLocked = post.isLocked && !unlockedPost;

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="section-post-detail">
      <Link href="/">
        <Button variant="ghost" className="gap-2 mb-6 -ml-2 text-muted-foreground" data-testid="button-back-musings">
          <ArrowLeft className="h-4 w-4" />
          back to musings
        </Button>
      </Link>

      {post.isLocked && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500/70 mb-2">
          <Lock className="h-3 w-3" />
          <span>private entry</span>
        </div>
      )}

      <h1
        className="text-2xl font-bold tracking-wide mb-3 text-amber-400"
        data-testid="text-post-title"
      >
        {displayPost.title}
      </h1>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mb-4">
        <Calendar className="h-3 w-3" />
        {displayPost.publishedAt
          ? new Date(displayPost.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "draft"}
      </div>

      <div className="glow-line w-full mb-6" />

      {isLocked ? (
        <div className="border border-dotted border-amber-600/30 rounded-md p-8 text-center" data-testid="section-locked-post">
          <Lock className="h-8 w-8 text-amber-500/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-1">encrypted entry</p>
          <p className="text-xs text-muted-foreground/60 mb-6">
            enter the password to unlock this post.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              unlockMutation.mutate(password);
            }}
            className="max-w-xs mx-auto space-y-3"
          >
            <Input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-dotted text-center"
              data-testid="input-unlock-password"
            />
            <Button
              type="submit"
              disabled={unlockMutation.isPending || !password}
              className="w-full bg-white text-black hover:bg-neutral-200 border border-dotted border-white/40"
              data-testid="button-unlock"
            >
              {unlockMutation.isPending ? "unlocking..." : "unlock"}
            </Button>
          </form>
        </div>
      ) : (
        <div
          className="prose prose-stone max-w-none text-sm leading-relaxed"
          data-testid="text-post-content"
        >
          {displayPost.content.split("\n").map((paragraph, i) => (
            <p key={i} className="mb-4 last:mb-0 text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
