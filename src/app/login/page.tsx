"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/admin/login", {
        email: email.trim(),
        password,
      });

      const { token } = response.data;
      localStorage.setItem("admin_token", token);
      router.push("/admin/home");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.message || "Login failed");
      } else {
        setError("Unable to connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute left-0 top-24 h-px w-full bg-black/10" />
      <div className="pointer-events-none absolute bottom-16 right-0 hidden h-56 w-56 border border-black/10 md:block" />
      <div className="pointer-events-none absolute left-8 top-40 hidden h-24 w-px bg-black/20 md:block" />

      <div className="relative grid min-h-screen place-items-center px-5">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-black bg-black">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight">Admin</h1>
            <p className="mt-2 text-sm font-medium text-zinc-600">
              Enter your credentials to access the admin portal.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="border-2 border-black bg-white shadow-[12px_12px_0_#000]"
          >
            {/* Error banner */}
            {error && (
              <div className="border-b-2 border-red-500 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6 p-8">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-600"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-13 w-full border-2 border-black/20 bg-zinc-50 pl-12 pr-4 text-sm font-medium outline-none transition-colors focus:border-black focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-600"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-13 w-full border-2 border-black/20 bg-zinc-50 pl-12 pr-12 text-sm font-medium outline-none transition-colors focus:border-black focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="h-13 w-full bg-black text-sm font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            <div className="border-t-2 border-black/10 px-8 py-4">
              <p className="text-center text-xs text-zinc-500">
                Authorized admins only.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
