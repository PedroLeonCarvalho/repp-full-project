import { MusicView } from "@/features/music/components/music-view";

export default function Home() {
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
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-400">
              Repertório
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16">
        <MusicView />
      </main>
    </div>
  );
}
