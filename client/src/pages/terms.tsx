import { useQuery } from "@tanstack/react-query";

interface SitePage {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function Terms() {
  const { data: page, isLoading } = useQuery<SitePage>({
    queryKey: ["/api/pages/terms"],
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="h-8 bg-muted/30 animate-pulse rounded-md mb-4 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="page-terms">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-wider mb-1" data-testid="text-terms-heading">
          {page?.title || "terms of service"}
        </h2>
        <div className="glow-line w-full mb-6" />
      </div>

      {page?.content ? (
        <div className="prose prose-invert prose-amber max-w-none">
          {page.content.split("\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4" data-testid={`text-terms-paragraph-${i}`}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">no terms of service have been added yet.</p>
      )}
    </div>
  );
}
