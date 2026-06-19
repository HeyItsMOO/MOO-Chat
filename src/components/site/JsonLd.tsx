/**
 * Renders schema.org structured data as a JSON-LD <script>. Search engines read
 * this for rich results (org info, FAQ, breadcrumbs, articles, pricing).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Content is built from our own typed objects, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
