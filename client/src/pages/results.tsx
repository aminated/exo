import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { TestResult } from "@shared/schema";

export default function Results() {
  const { data: results, isLoading } = useQuery<TestResult[]>({
    queryKey: ["/api/results"],
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-lg font-bold tracking-wider mb-1" data-testid="text-results-heading">
          results
        </h2>
        <div className="glow-line w-full mb-6" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      ) : !results || results.length === 0 ? (
        <p className="text-sm text-muted-foreground">no results published yet.</p>
      ) : (
        <div className="border border-dotted border-border rounded-md overflow-hidden">
          <table className="w-full text-sm" data-testid="table-results">
            <thead>
              <tr className="border-b border-dotted border-border bg-card/60">
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground">uid</th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground hidden sm:table-cell">client</th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground">sample</th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground hidden sm:table-cell">manufacturer</th>
                <th className="text-left p-3 font-semibold tracking-wider text-xs text-muted-foreground hidden sm:table-cell">received</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-dotted border-border/50 last:border-b-0 transition-colors"
                  data-testid={`row-result-${r.id}`}
                >
                  <td className="p-3">
                    <Link
                      href={`/results/${r.uid}`}
                      className="text-amber-400 hover:text-amber-300 underline underline-offset-2 decoration-amber-500/40 hover:decoration-amber-400/60 transition-colors font-mono text-xs"
                      data-testid={`link-result-${r.id}`}
                    >
                      {r.uid}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{r.clientName || "-"}</td>
                  <td className="p-3 text-muted-foreground">{r.sample || "-"}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{r.manufacturer || "-"}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell text-xs">{r.sampleReceived || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
