import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";

type LoginModalProps = {
  onClose: () => void;
};

export default function LoginModal({ onClose }: LoginModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[var(--card)] dark:text-[var(--card-foreground)] rounded-lg shadow-lg max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
          aria-label="Close login modal"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
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