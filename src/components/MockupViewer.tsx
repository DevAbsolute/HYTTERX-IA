import React, { useState } from 'react';
import { UIMockup, UIPreviewData } from '../types';
import { Copy, Check, Download, Image as ImageIcon, Sparkles, Coins, Eye } from 'lucide-react';

interface MockupViewerProps {
  mockup: UIMockup;
  previewData: UIPreviewData;
  imagePrompt: string;
  isLight: boolean;
  onToast: (msg: string) => void;
  onViewStage: () => void;
}

export const MockupViewer: React.FC<MockupViewerProps> = ({
  mockup,
  previewData,
  imagePrompt,
  isLight,
  onToast,
  onViewStage
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(imagePrompt);
    setCopiedPrompt(true);
    onToast('IMAGE PROMPT copiado');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] overflow-y-auto p-6 space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--stroke)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
              {mockup.category || 'Mockup 16:9'}
            </span>
            <span className="text-xs text-[var(--text-2)] font-mono">1920 × 1080 (16:9 AAA)</span>
          </div>
          <h2 className="text-xl font-black text-[var(--text)] mt-1">{mockup.title}</h2>
          <p className="text-xs text-[var(--text-2)] max-w-2xl mt-0.5">{mockup.description}</p>
        </div>

        <button
          onClick={onViewStage}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--accent)] font-bold rounded-[var(--r-md)] border border-[var(--accent)]/40 text-xs transition-all cursor-pointer"
        >
          <Eye size={15} />
          <span>Ver Preview en Vivo</span>
        </button>
      </div>

      {/* 16:9 High-Fidelity Flat Vector Canvas Mockup */}
      <div className="w-full flex justify-center">
        <div 
          className="w-full max-w-4xl aspect-video rounded-[var(--r-lg)] border border-[var(--stroke)] bg-[#0d0e12] overflow-hidden shadow-2xl relative flex flex-col"
          style={{
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 224, 255, 0.05)`
          }}
        >
          {/* Mockup Top Roblox Chrome */}
          <div className="h-9 px-4 bg-[#12141a] border-b border-white/10 flex items-center justify-between text-xs text-zinc-400 select-none">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white rounded-xs transform -rotate-12 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black"></div>
              </div>
              <span className="font-semibold text-zinc-300 text-[11px]">Roblox Studio Client</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1 text-[var(--gold)] font-mono">
                <Coins size={12} />
                <span>{previewData.balance?.toLocaleString() || 14200}</span>
              </div>
              <span className="text-zinc-500">|</span>
              <span className="text-emerald-400 font-mono">60 FPS</span>
            </div>
          </div>

          {/* Mockup Centered UI Box */}
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {/* Subtle background game scene simulated grid */}
            <div className="absolute inset-0 bg-radial from-transparent via-[#08090d]/80 to-[#08090d] pointer-events-none"></div>

            {/* UI Window */}
            <div className="w-[88%] h-[85%] bg-[var(--surface)] border border-[var(--accent)]/50 rounded-[var(--r-lg)] shadow-2xl flex flex-col overflow-hidden relative z-10">
              {/* Header */}
              <div className="h-12 px-5 bg-[var(--surface-2)]/80 border-b border-[var(--stroke)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-4 bg-[var(--accent)] rounded-xs"></div>
                  <span className="font-black text-sm text-white uppercase tracking-wider">{previewData.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[var(--gold)] font-bold">
                    {previewData.balance?.toLocaleString()} {previewData.currencyName}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">✕</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="h-9 px-4 bg-[var(--surface)] border-b border-[var(--stroke)] flex items-center gap-2">
                {previewData.tabs?.slice(0, 4).map((tab, idx) => (
                  <div
                    key={tab.id}
                    className={`h-7 px-3 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      idx === 0 
                        ? 'bg-[var(--accent)] text-black' 
                        : 'text-[var(--text-2)] bg-[var(--surface-2)]/50'
                    }`}
                  >
                    <span>{tab.name}</span>
                  </div>
                ))}
              </div>

              {/* Body: Grid + Sidebar */}
              <div className="flex-1 p-3 flex gap-3 overflow-hidden">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {previewData.items?.slice(0, 4).map((item, idx) => (
                    <div 
                      key={item.id}
                      className={`p-2.5 rounded-[var(--r-md)] border flex flex-col justify-between ${
                        idx === 0
                          ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-[0_0_15px_rgba(0,224,255,0.2)]'
                          : 'bg-[var(--bg)] border-[var(--stroke)]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-[var(--accent)]">{item.rarity}</span>
                        <span className="text-[10px] font-mono font-bold text-[var(--gold)]">{item.price} G</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-1">{item.name}</div>
                      <div className="text-[9px] text-[var(--text-2)] line-clamp-1">{item.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Sidebar details */}
                <div className="w-44 bg-[var(--bg)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase text-[var(--accent)]">Inspección</div>
                    <div className="text-xs font-bold text-white mt-0.5">{previewData.items?.[0]?.name}</div>
                    <div className="w-full h-14 bg-[var(--surface)] rounded my-2 flex items-center justify-center text-xs text-[var(--accent)]">
                      ◆ 3D VIEW
                    </div>
                  </div>
                  <div className="w-full h-7 bg-[var(--accent)] rounded font-black text-[10px] uppercase text-black flex items-center justify-center">
                    Comprar Ahora
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Palette Swatches */}
      <div className="bg-[var(--surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
          Paleta de Color AAA (Tokens de Diseño)
        </div>
        <div className="flex flex-wrap gap-3">
          {mockup.palette.map((hex, i) => (
            <div key={i} className="flex items-center gap-2 bg-[var(--surface-2)] px-3 py-1.5 rounded-[var(--r-md)] border border-[var(--stroke)]">
              <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: hex }}></div>
              <span className="text-xs font-mono font-bold text-white">{hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE PROMPT Block (Required by Section 5) */}
      <div className="bg-[var(--surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--accent)] font-mono">
            <Sparkles size={14} />
            <span>IMAGE PROMPT</span>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--text-2)] hover:text-white transition-colors cursor-pointer"
          >
            {copiedPrompt ? <Check size={14} className="text-[var(--ok)]" /> : <Copy size={14} />}
            <span>{copiedPrompt ? 'Copiado' : 'Copiar prompt'}</span>
          </button>
        </div>

        <div className="bg-[#0e1015] p-3 rounded border border-white/5 font-mono text-xs text-zinc-300 leading-relaxed select-text">
          {imagePrompt}
        </div>
      </div>
    </div>
  );
};
