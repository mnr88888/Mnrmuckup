import { getMockupList, getMockupMeta } from "@/data/mockups";
import MockupEditorClient from "@/components/editor/MockupEditorClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return getMockupList().map((m) => ({ id: m.id }));
}

export default function MockupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meta = getMockupMeta(params.id);

  if (!meta) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Mockup not found</h1>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white"
        >
          Back to mockups
        </a>
      </main>
    );
  }

  return <MockupEditorClient meta={meta} />;
}
