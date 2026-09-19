import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { landingPagesListOptions } from "@/lib/landing-queries";

export const Route = createFileRoute("/landing/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingPagesListOptions({ activeOnly: true }));
  },
  head: () => ({
    meta: [
      { title: "Landing Pages — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LandingHub,
});

function LandingHub() {
  const { data: pages } = useSuspenseQuery(landingPagesListOptions({ activeOnly: true }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl text-primary mb-2">Landing Pages</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Active ad landing pages. Each page targets one product / campaign.
      </p>
      {pages.length === 0 ? (
        <div className="text-muted-foreground text-sm border border-dashed rounded-lg p-8 text-center">
          No active landing pages yet.
        </div>
      ) : (
        <ul className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden">
          {pages.map((p) => (
            <li key={p.id}>
              <Link
                to="/landing/$slug"
                params={{ slug: p.slug }}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.hero_headline || p.slug}</div>
                  <div className="text-xs text-muted-foreground truncate">/landing/{p.slug}</div>
                </div>
                <span className="text-xs text-primary shrink-0">View →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
