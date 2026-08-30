"use client";

import { useCallback, useState } from "react";
import type { Concert } from "../types";
import {
  enableConcertShareAction,
  disableConcertShareAction,
} from "../actions/concert-actions";

interface ShareSetlistModalProps {
  concert: Concert;
  onClose: () => void;
  onUpdated?: () => void;
}

export function ShareSetlistModal({
  concert,
  onClose,
  onUpdated,
}: ShareSetlistModalProps) {
  const [isShareEnabled, setIsShareEnabled] = useState(concert.isShareEnabled);
  const [shareToken, setShareToken] = useState(concert.shareToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await enableConcertShareAction(concert.id);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setIsShareEnabled(true);
    setShareToken(res.data.shareToken);
    if (onUpdated) onUpdated();
  }, [concert.id, onUpdated]);

  const handleDisable = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await disableConcertShareAction(concert.id);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setIsShareEnabled(false);
    if (onUpdated) onUpdated();
  }, [concert.id, onUpdated]);

  // Compute shareUrl safely in browser
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${origin}/s/${shareToken}` : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(
      `Fala pessoal! Segue o setlist da apresentação "${concert.title}" com repertório, ordem e letras:\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-lg">
              🔗
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-50">
                Compartilhar Setlist
              </h2>
              <p className="text-xs text-zinc-400 truncate max-w-[260px] sm:max-w-sm">
                {concert.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Privacy & Safety Note */}
        <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span>🛡️</span>
            <span>Acesso Seguro e Somente Leitura</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Quem acessar este link poderá ver a ordem das músicas, tonalidades e abrir o leitor de letras no palco.
            <strong className="text-zinc-200 font-semibold block mt-1">
              Valores de cachê, custos e dados do contratante são 100% confidenciais e jamais são expostos.
            </strong>
          </p>
        </div>

        {/* Main Sharing Actions */}
        {isShareEnabled && shareToken ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Link público do setlist:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 rounded-xl bg-zinc-950 border border-zinc-700/80 px-3.5 py-2.5 text-xs font-mono text-emerald-300 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    copied
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/70"
                  }`}
                >
                  {copied ? "✓ Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* Quick WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-4 py-3 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99] cursor-pointer"
            >
              <span className="text-base">💬</span>
              <span>Enviar no WhatsApp da Banda</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-center space-y-3">
            <p className="text-xs text-zinc-400">
              O link de compartilhamento para esta apresentação está atualmente desativado.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleEnable}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {isLoading ? "Ativando..." : "Ativar Link de Compartilhamento"}
            </button>
          </div>
        )}

        {/* Footer with Revocation / Kill-Switch */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          {isShareEnabled && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleDisable}
              className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              {isLoading ? "Processando..." : "Desativar link de compartilhamento"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
