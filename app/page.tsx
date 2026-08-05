import MockupCard from "@/components/MockupCard";
import Navbar from "@/components/Navbar";
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
            Mockup Studio
          </h1>
          <p className="mt-3 text-lg text-neutral-500">
            Upload your artwork and preview it on real product mockups.
          </p>
        </section>
        <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <MockupCard />
        </section>
      </main>
    </>
  );
}
