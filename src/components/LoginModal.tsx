import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      onClose();
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-lg p-8 min-w-[320px]">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6">You need to be logged in to perform this action.</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="mt-2"
          >
            Sign In
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Not registered?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline"
            onClick={onClose}
          >
            Click here to register
          </Link>
        </div>
      </div>
    </div>
  );
}