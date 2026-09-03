"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/auth-client";
import Button from "@/components/ui/Button";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const isAdminLogin = role === "admin";

  useEffect(() => {
    if (user) {
      router.push(isAdmin(user.role) ? "/admin" : "/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#1e4080] to-[#0f2744] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[#1e3a5f] font-black">CBT</span>
            </div>
            <span className="text-white font-black text-2xl">
              CBT <span className="text-[#0ea5e9]">PRO</span>
            </span>
          </Link>
          <p className="text-blue-200 mt-2 text-sm">
            {isAdminLogin ? "Administrator Access" : "Student Portal"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-black text-[#1e3a5f] mb-2">
            {isAdminLogin ? "Admin Login" : "Student Login"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {isAdminLogin
              ? "Enter your administrator credentials"
              : "Enter your credentials to access your exams"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isAdminLogin ? "Email Address" : "Email or Username"}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] transition-colors"
                placeholder={isAdminLogin ? "admin@example.com" : "Email or username"}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#1e3a5f] transition-colors"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {!isAdminLogin && (
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-[#1e3a5f] font-semibold hover:underline">
                  Register here
                </Link>
              </p>
            )}
            <p className="text-xs text-gray-400">
              {isAdminLogin ? (
                <Link href="/auth/login" className="hover:text-gray-600">
                  Student Login →
                </Link>
              ) : (
                <Link href="/auth/login?role=admin" className="hover:text-gray-600">
                  Admin Login →
                </Link>
              )}
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-xs font-bold text-[#1e3a5f] mb-2">Demo Credentials:</p>
            {isAdminLogin ? (
              <div className="text-xs text-gray-600 space-y-1">
                <p>Email: <code className="bg-white px-1 rounded">admin@cbtpro.com</code></p>
                <p>Password: <code className="bg-white px-1 rounded">Admin@123</code></p>
              </div>
            ) : (
              <div className="text-xs text-gray-600 space-y-1">
                <p>Email: <code className="bg-white px-1 rounded">student@cbtpro.com</code></p>
                <p>Password: <code className="bg-white px-1 rounded">Student@123</code></p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          CBT PRO — Professional Examination Platform
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
