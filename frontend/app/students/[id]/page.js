"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ nama: "", nim: "", jurusan: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadStudent() {
      const response = await fetch(`${API_URL}/${params.id}`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const student = await response.json();
        setForm({
          nama: student.nama,
          nim: student.nim,
          jurusan: student.jurusan,
        });
      }
      setLoading(false);
    }

    loadStudent();
  }, [params.id, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(`${API_URL}/${params.id}`, {
      method: "PUT",
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
      setMessage(data.message || "Gagal mengubah data");
      return;
    }

    router.push("/");
  }

  if (loading) {
    return (
      <AuthGuard>
        <main>
          <h1>Edit Mahasiswa</h1>
          <p>Memuat data...</p>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main>
        <h1>Edit Mahasiswa</h1>
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
            <button type="submit">Simpan Perubahan</button>
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
