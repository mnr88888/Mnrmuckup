"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? "" } : null);
      setLoading(false);
    });
  }, []);

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold text-neutral-900">
          Mockup Studio
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Home
          </Link>
          <Link href="/mockups" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Mockups
          </Link>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : user ? (
            <Link
              href="/auth"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              {user.email.split("@")[0]}
            </Link>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
