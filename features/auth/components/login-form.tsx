"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "../actions/auth-actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await loginAction({
        email: email.trim(),
        password,
      });

      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl backdrop-blur-xl">
      {/* Brand & Title */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 relative flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-900 shadow-lg shadow-emerald-500/10">
          <Image
            src="/logo.svg"
            alt="REPP Logo"
            width={56}
            height={56}
            className="object-cover h-full w-full"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">
          Entrar no REPP
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Acesse seu acervo de músicas e repertórios
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl bg-red-950/70 border border-red-800 p-3 text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Senha
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-6 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-400">
        Não tem uma conta?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Cadastre-se gratuitamente
        </Link>
      </div>
    </div>
  );
}
