import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Cadastre-se | REPP",
  description: "Crie sua conta no REPP e organize seu repertório musical.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8">
      <RegisterForm />
    </div>
  );
}
