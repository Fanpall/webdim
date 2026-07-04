"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const API_URL = `${API_BASE}/students`;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: "", nim: "", jurusan: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(form),
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Gagal menambahkan mahasiswa");
      return;
    }

    router.push("/");
  }

  return (
    <AuthGuard>
      <main>
        <h1>Tambah Mahasiswa Baru</h1>
        <p>Isi form berikut untuk menambahkan data mahasiswa.</p>
        <form onSubmit={handleSubmit}>
          <label>Nama</label>
          <input
            value={form.nama}
            onChange={(event) => setForm({ ...form, nama: event.target.value })}
            required
          />

          <label>NIM</label>
          <input
            value={form.nim}
            onChange={(event) => setForm({ ...form, nim: event.target.value })}
            required
          />

          <label>Jurusan</label>
          <input
            value={form.jurusan}
            onChange={(event) =>
              setForm({ ...form, jurusan: event.target.value })
            }
            required
          />

          <div className="actions">
            <button type="submit">Tambah Mahasiswa</button>
            <button
              type="button"
              className="secondary"
              onClick={() => router.push("/")}
            >
              Batal
            </button>
          </div>
        </form>
        {message ? <p>{message}</p> : null}
      </main>
    </AuthGuard>
  );
}
