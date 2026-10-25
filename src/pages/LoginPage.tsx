import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { login } from "@/services/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(20,184,166,0.18),transparent_45%),radial-gradient(ellipse_at_90%_85%,rgba(59,130,246,0.18),transparent_45%)]"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-size-[48px_48px]"
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-teal-400 text-slate-950">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">KS</p>
              <p className="text-xs text-slate-400">Crowd Management System</p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-teal-300">
              <span className="size-2 rounded-full bg-teal-400" />
              Crowd intelligence platform
            </div>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Understand your
              <span className="block text-teal-300">space in real time.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              A unified view of occupancy, visitor movement, and crowd patterns
              to help teams make informed operational decisions.
            </p>

            <div className="mt-12 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <Users className="mb-4 text-teal-300" size={22} />
                <p className="font-medium text-white">Crowd visibility</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">
                  Understand visitor activity across your venue.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <ShieldCheck className="mb-4 text-teal-300" size={22} />
                <p className="font-medium text-white">Secure access</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">
                  Sign in to access your operational workspace.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500">
            Crowd Management System · Secure workspace
          </p>
        </section>

        {/* Login panel */}
        <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:min-h-0 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-teal-300">
                <Activity size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">KS</p>
                <p className="text-xs text-slate-500">
                  Crowd Management System
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Welcome to the Crowd Management System
              </h2>

              <div className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <ShieldCheck
                  aria-hidden="true"
                  size={19}
                  className="mt-0.5 shrink-0 text-teal-700"
                />
                <p className="text-xs leading-5 text-slate-500">
                  Sign in with test account credentials.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="you@company.com"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Crowd Management System. All rights
              reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
