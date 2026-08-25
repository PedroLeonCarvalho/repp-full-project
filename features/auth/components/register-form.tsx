"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "../actions/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [stageName, setStageName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await registerAction({
        fullName: fullName.trim(),
        stageName: stageName.trim(),
        email: email.trim(),
        password,
        cpf: cpf.trim() || null,
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
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
    <div className="w-full max-w-md rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-2xl backdrop-blur-xl my-6">
      {/* Brand & Title */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950 font-black text-xl tracking-tighter shadow-lg shadow-emerald-500/20">
          R
        </div>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">
          Criar Conta no REPP
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Organize seu repertório profissional e apresentações
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl bg-red-950/70 border border-red-800 p-3 text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Nome Completo <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex: Pedro Henrique Silva"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Stage Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Nome Artístico <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            required
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            placeholder="Ex: Pedro Carvalho"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            E-mail <span className="text-emerald-400">*</span>
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
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Senha (mínimo 6 caracteres) <span className="text-emerald-400">*</span>
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Optional Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              CPF (opcional)
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Instagram
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@seu.perfil"
            className="w-full rounded-xl bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/60 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-3 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Criando Conta..." : "Criar Minha Conta"}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-5 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-400">
        Já possui cadastro?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Fazer Login
        </Link>
      </div>
    </div>
  );
}
