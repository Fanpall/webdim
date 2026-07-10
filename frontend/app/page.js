"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "./components/AuthGuard";

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

export default function HomePage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadStudents(keyword = "") {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);

    const response = await fetch(
      `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`,
      { headers: { ...authHeaders() } },
    );

    if (response.status === 401) {
      localStorage.removeItem("token");
      return router.push("/login");
    }

    const data = await response.json();
    setStudents(data);
    setLoading(false);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadStudents();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  }

  async function handleDelete(studentId) {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus data mahasiswa ini?",
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(studentId);

    const response = await fetch(`${API_URL}/${studentId}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    if (!response.ok) {
      window.alert("Gagal menghapus mahasiswa");
      setDeletingId(null);
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.filter((student) => student.id !== studentId),
    );
    setDeletingId(null);
  }

  return (
    <AuthGuard>
      <main>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h1>Frontend CRUD Mahasiswa</h1>
            <p>Antarmuka Next.js untuk backend Express CRUD.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="button" className="secondary" onClick={handleLogout}>
              Logout
            </button>
            <Link className="btn-link" href="/students/new">
              Tambah Mahasiswa
            </Link>
          </div>
        </header>

        <div className="card">
          <div className="actions" style={{ justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flex: 1,
                minWidth: "220px",
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, NIM, atau jurusan"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => loadStudents(search)}>
                Cari
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSearch("");
                  loadStudents("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Daftar Mahasiswa</h2>
          {loading ? <p>Memuat data...</p> : null}
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>Jurusan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.nama}</td>
                  <td>{student.nim}</td>
                  <td>{student.jurusan}</td>
                  <td>
                    <div className="actions">
                      <Link
                        className="secondary"
                        href={`/students/${student.id}`}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(student.id)}
                        disabled={deletingId === student.id}
                      >
                        {deletingId === student.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AuthGuard>
  );
}
