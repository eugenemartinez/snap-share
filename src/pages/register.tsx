import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import ErrorMessage from "@/components/ErrorMessage";
import Button from "@/components/Button";

export default function Register() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false); // <-- Add loading state

  // Don't render anything until session is loaded
  if (status === "loading") return null;
  if (status === "authenticated") {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username must be 3-20 characters, letters, numbers, or underscores");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true); // <-- Start loading
    // API call
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    setLoading(false); // <-- End loading
    if (res.ok) {
      setToast({ message: "Registration successful! Redirecting to login...", type: "success" });
      setTimeout(() => router.push("/login"), 1500);
    } else {
      const data = await res.json();
      setToast({ message: data.message || "Registration failed", type: "error" });
    }
  }

  return (
    <>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[85vh] flex items-center justify-center mx-4 sm:mx-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-8 bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg flex flex-col gap-5"
        >
          <h2 className="text-3xl font-bold mb-2 text-center">Create Account</h2>
          <ErrorMessage message={error} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <Button
            type="submit"
            loading={loading}
            success={!!toast && toast.type === "success"}
            successMessage="Signed up successfully!"
            fullWidth
          >
            Sign Up
          </Button>
        </form>
      </div>
    </>
  );
}