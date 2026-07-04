"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Pendaftaran gagal");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      router.replace("/");
    } catch (error) {
      setError(
        "Tidak dapat terhubung ke server. Pastikan backend berjalan di port 3000.",
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Daftar Akun</h1>
          <p className="info">Buat akun untuk mengelola data mahasiswa.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          <div className="actions auth-actions">
            <button type="submit">Daftar</button>
            <Link className="btn-link secondary" href="/login">
              Sudah punya akun?
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
