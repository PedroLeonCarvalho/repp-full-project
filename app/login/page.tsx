import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar | REPP",
  description: "Faça login no REPP para gerenciar seu repertório musical.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8">
      <LoginForm />
    </div>
  );
}
