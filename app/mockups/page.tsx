import Navbar from "@/components/Navbar";
import MockupCard from "@/components/MockupCard";

export default function MockupsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-neutral-900">All Mockups</h1>
        <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <MockupCard />
        </section>
      </main>
    </>
  );
}
