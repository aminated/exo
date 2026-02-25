import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { TestResult } from "@shared/schema";

export default function ResultDetail() {
  const [, params] = useRoute("/results/:uid");
  const uid = params?.uid;

  const { data: result, isLoading } = useQuery<TestResult>({
    queryKey: ["/api/results", uid],
    enabled: !!uid,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="h-8 bg-muted/30 animate-pulse rounded-md mb-4 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted/30 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full max-w-3xl mx-auto text-center mt-20">
        <p className="text-muted-foreground">result not found.</p>
        <Link href="/results" className="text-amber-400 hover:text-amber-300 underline underline-offset-2 text-sm mt-2 inline-block">
          back to results
        </Link>
      </div>
    );
  }

  const chromatograms: string[] = JSON.parse(result.chromatograms || "[]");

  return (
    <div className="w-full max-w-3xl mx-auto" data-testid="page-result-detail">
      <Link href="/results" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block" data-testid="link-back-results">
        ← back to results
      </Link>

      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-wider mb-1" data-testid="text-result-uid">
          <span className="text-muted-foreground">result:</span> <span className="font-mono text-amber-400">{result.uid}</span>
        </h2>
        <div className="glow-line w-full mb-6" />
      </div>

      <div className="border border-dotted border-border rounded-md p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.orderUid && (
            <Field label="order uid" value={result.orderUid} mono />
          )}
          {result.testingOrdered && (
            <Field label="testing ordered" value={result.testingOrdered} />
          )}
          {result.sampleReceived && (
            <Field label="sample received" value={result.sampleReceived} />
          )}
          {result.clientName && (
            <Field label="client name" value={result.clientName} />
          )}
          {result.sample && (
            <Field label="sample" value={result.sample} />
          )}
          {result.manufacturer && (
            <Field label="manufacturer" value={result.manufacturer} />
          )}
        </div>

        {result.results && (
          <div className="border-t border-dotted border-border pt-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-400 mb-2">results</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-result-content">
              {result.results}
            </div>
          </div>
        )}

        {chromatograms.length > 0 && (
          <div className="border-t border-dotted border-border pt-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-400 mb-3">chromatograms</h3>
            <div className="grid grid-cols-1 gap-4">
              {chromatograms.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" data-testid={`img-chromatogram-${i}`}>
                  <img
                    src={url}
                    alt={`chromatogram ${i + 1}`}
                    className="w-full rounded-md border border-dotted border-border"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground/70 block">{label}</span>
      <span className={`text-sm ${mono ? "font-mono text-amber-400" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
