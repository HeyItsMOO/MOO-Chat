import { getAllContent } from '@/lib/content';
import { DocsSidebar } from '@/components/site/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getAllContent('docs').map((d) => ({ slug: d.slug, title: d.title }));

  return (
    <div className="container-x py-12">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-mute">Documentation</div>
          <DocsSidebar items={docs} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
