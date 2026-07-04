"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function verifySession() {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        router.replace("/login");
      }
    }

    verifySession();
  }, [router]);

  if (!ready) {
    return (
      <main>
        <p>Memeriksa sesi login...</p>
      </main>
    );
  }

  return children;
}
