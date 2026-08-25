"use client";

import { useState } from "react";
import { MusicView } from "@/features/music/components/music-view";
import { ProjectView } from "@/features/project/components/project-view";
import { ContractorView } from "@/features/contractor/components/contractor-view";
import { MusicianView } from "@/features/musician/components/musician-view";

type TabType = "musics" | "projects" | "contractors" | "musicians";

export function MainDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("musics");

  return (
    <div className="flex flex-col">
      {/* Sub-Navigation Tabs Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 sticky top-14 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("musics")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "musics"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <span>🎵</span>
            <span>Músicas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "projects"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <span>📁</span>
            <span>Projetos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contractors")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "contractors"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <span>🏢</span>
            <span>Contratantes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("musicians")}
            className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "musicians"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <span>🎸</span>
            <span>Músicos</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tab Content */}
      <div className="w-full">
        {activeTab === "musics" && <MusicView />}
        {activeTab === "projects" && <ProjectView />}
        {activeTab === "contractors" && <ContractorView />}
        {activeTab === "musicians" && <MusicianView />}
      </div>
    </div>
  );
}

