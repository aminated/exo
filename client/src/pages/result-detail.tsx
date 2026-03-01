import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { FileText, Download } from "lucide-react";
import type { TestResult } from "@shared/schema";

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("data:")) {
    return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(trimmed) ||
           /^data:application\/(pdf|octet-stream|zip);base64,/.test(trimmed);
  }
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/uploads/") ||
    (trimmed.startsWith("/") && !trimmed.startsWith("//"))
  );
}

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
  const rawDataFiles: { name: string; data: string }[] = JSON.parse(result.rawDataFiles || "[]");

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
              {chromatograms.filter(isSafeUrl).map((url, i) => (
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

        {rawDataFiles.length > 0 && (
          <div className="border-t border-dotted border-border pt-4">
            <h3 className="text-xs font-bold tracking-wider text-amber-400 mb-3">raw data</h3>
            <div className="space-y-2">
              {rawDataFiles.filter((f) => isSafeUrl(f.data)).map((file, i) => (
                <a
                  key={i}
                  href={file.data}
                  download={file.name}
                  className="flex items-center gap-2 text-sm border border-dotted border-border rounded-md px-4 py-2.5 hover:border-amber-400/50 hover:text-amber-400 transition-colors group"
                  data-testid={`link-rawfile-${i}`}
                >
                  <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="truncate flex-1 font-mono">{file.name}</span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors shrink-0" />
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
