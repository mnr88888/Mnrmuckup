import Link from "next/link";
import Image from "next/image";
import { getMockupList } from "@/data/mockups";

export default function MockupCard() {
  const mockups = getMockupList();
  return (
    <>
      {mockups.map((m) => (
        <Link
          key={m.id}
          href={`/mockups/${m.id}`}
          className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative h-72 w-full overflow-hidden">
            <Image
              src={m.thumb}
              alt={m.title}
              fill
              sizes="(max-width:768px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-neutral-500">{m.category}</p>
            <h3 className="mt-1 text-xl font-semibold text-neutral-900">
              {m.title}
            </h3>
            <span className="mt-4 flex items-center justify-center rounded-xl bg-neutral-900 py-3 font-medium text-white transition group-hover:bg-neutral-800">
              Use Mockup
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}
