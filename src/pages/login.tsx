import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import Button from "@/components/Button";
import Head from "next/head";

export default function Login() {
  const { status } = useSession();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false); // <-- Add loading state
  const router = useRouter();

  useEffect(() => {
    if (router.query.toast) {
      setToast({ message: String(router.query.toast), type: "success" });
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router.query.toast, router]);

  // Don't render anything until session is loaded
  if (status === "loading") return null;
  if (status === "authenticated") {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) {
      setToast({ message: "Please enter your email/username and password.", type: "error" });
      return;
    }
    setLoading(true); // <-- Start loading
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false); // <-- End loading
    if (res?.ok) {
      router.push({
        pathname: "/",
        query: { toast: "Login successful!" }
      });
    } else {
      setToast({ message: "Invalid email/username or password", type: "error" });
    }
  }

  return (
    <>
    <Head>
        <title>Login | SnapShare</title>
    </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[85vh] flex items-center justify-center mx-4 sm:mx-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-8 bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg flex flex-col gap-5"
        >
          <h2 className="text-3xl font-bold mb-2 text-center">Login</h2>
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
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
          <Button
            type="submit"
            loading={loading}
            fullWidth
          >
            Sign In
          </Button>
        </form>
      </div>
    </>
  );
}