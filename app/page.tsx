import { getAuthenticatedCustomer } from "@/features/auth/services/auth-service";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { MainDashboard } from "@/components/main-dashboard";

export default async function Home() {
  const customer = await getAuthenticatedCustomer();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navigation / Brand */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm tracking-tighter">
              R
            </div>
            <span className="font-extrabold text-base text-zinc-50 tracking-wider">
              REPP
            </span>
          </div>

          <div className="flex items-center gap-3">
            {customer && (
              <span className="text-xs text-zinc-300 font-medium hidden sm:inline">
                Olá, <strong className="text-emerald-400">{customer.stageName}</strong>
              </span>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="pb-16">
        <MainDashboard />
      </main>
    </div>
  );
}
