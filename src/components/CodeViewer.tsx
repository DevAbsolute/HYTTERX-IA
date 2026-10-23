import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, ShieldCheck, Play, Sparkles } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  projectSlug: string;
  version: string;
  onToast: (msg: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, projectSlug, version, onToast }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onToast('¡Código Luau copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HytterxUI_${projectSlug}_${version}.lua`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast(`Descargado HytterxUI_${projectSlug}_${version}.lua`);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] border-l border-[var(--stroke)] select-text">
      {/* Top Action Bar */}
      <div className="h-14 px-6 bg-[var(--surface)] border-b border-[var(--stroke)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-[var(--accent)]" />
          <div>
            <h3 className="text-sm font-black text-[var(--text)] tracking-wide font-mono">
              HytterxUI_{projectSlug}.lua
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-2)] font-mono">
              <span className="text-[var(--ok)] font-bold">● Luau 100% Válido</span>
              <span>•</span>
              <span>Barra de Comandos (Edit & Play)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-md)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-white border border-[var(--stroke)] text-xs font-semibold transition-all cursor-pointer"
            title="Descargar script .lua"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Descargar .lua</span>
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-[var(--r-md)] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              copied
                ? 'bg-[var(--ok)] text-black'
                : 'bg-[var(--accent)] text-[var(--bg)] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(0,224,255,0.3)]'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Código Luau'}</span>
          </button>
        </div>
      </div>

      {/* Safety & Compliance Badges Banner */}
      <div className="bg-[var(--surface-2)]/50 px-6 py-2.5 border-b border-[var(--stroke)] flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--text-2)]">
        <div className="flex items-center gap-1.5 text-[var(--ok)]">
          <ShieldCheck size={14} />
          <span>Anclaje Resiliente (PlayerGui || StarterGui)</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Sparkles size={14} className="text-[var(--gold)]" />
          <span>Anti-Duplicados: Destruye versiones previas</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Play size={14} className="text-[var(--accent)]" />
          <span>TweenService manual (AutoButtonColor = false)</span>
        </div>
      </div>

      {/* Code Textarea / Container with syntax highlight look */}
      <div className="flex-1 overflow-auto p-4 bg-[#0d0f14] font-mono text-xs leading-relaxed text-zinc-300">
        <pre className="selection:bg-[var(--accent)]/30 selection:text-white">
          <code>{code}</code>
        </pre>
      </div>

      {/* Studio Command Bar Instructions Footer */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--stroke)] flex items-center justify-between text-xs text-[var(--text-2)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--ok)]"></span>
          <span>Listo para pegar en Roblox Studio: <b>Command Bar</b> (F5 Play o Edit).</span>
        </div>
        <span className="font-mono text-[11px]">ScreenGui DisplayOrder: 50 | IgnoreGuiInset = true</span>
      </div>
    </div>
  );
};
