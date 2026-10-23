import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatMessage, DeliverableData, ProjectState 
} from '../types';
import { 
  Send, Sparkles, Terminal, Copy, Check, Eye, Image as ImageIcon, 
  HelpCircle, RefreshCw, Layers, ShieldCheck, ChevronRight
} from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeProject: ProjectState;
  onSendMessage: (text: string) => void;
  onSelectDeliverableView: (tab: 'preview' | 'code' | 'mockup') => void;
  onToast: (msg: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  activeProject,
  onSendMessage,
  onSelectDeliverableView,
  onToast,
}) => {
  const [input, setInput] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    onSendMessage(msg);
  };

  const handleCopyLuau = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    onToast('¡Código Luau copiado para Roblox Studio!');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    'Tienda de armas con skins y monedas',
    'Inventario RPG con ranuras y filtros',
    'Pase de batalla con recompensas',
    'HUD de combate con barras de vida',
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--surface)] border-r border-[var(--stroke)]">
      {/* Hytterx Header */}
      <div className="h-14 px-4 bg-[var(--surface-2)]/50 border-b border-[var(--stroke)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(0,224,255,0.4)]">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider text-white">HYTTERX IA</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-[var(--accent)]/20 text-[var(--accent)] rounded font-bold">
                Roblox UI
              </span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-2)]">
              PROYECTO: {activeProject.slug} | {activeProject.version}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSendMessage('/ayuda')}
          className="text-xs font-mono text-[var(--text-2)] hover:text-white px-2 py-1 rounded bg-[var(--surface)] border border-[var(--stroke)] flex items-center gap-1 transition-colors"
          title="Ver comandos de Hytterx"
        >
          <HelpCircle size={13} />
          <span>/ayuda</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map(msg => (
          <div key={msg.id} className="space-y-3">
            {msg.role === 'user' ? (
              /* User Bubble */
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[var(--surface-2)] border border-[var(--stroke)] text-white px-4 py-2.5 rounded-[var(--r-lg)] text-xs font-medium leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              /* Hytterx Assistant Turn */
              <div className="space-y-3">
                {/* Intro Line (Maximum 2 lines as specified in Voice rules) */}
                {msg.deliverable?.intro && (
                  <div className="text-xs text-[var(--text)] font-semibold leading-relaxed border-l-2 border-[var(--accent)] pl-2.5 py-0.5">
                    {msg.deliverable.intro}
                  </div>
                )}

                {/* If it was a slash command response */}
                {msg.deliverable?.isCommand && msg.deliverable.table && (
                  <div className="bg-[var(--bg)] border border-[var(--stroke)] rounded-[var(--r-md)] p-3 text-xs space-y-2">
                    <div className="font-bold text-[var(--accent)] font-mono">Tabla de Comandos:</div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {msg.deliverable.table.map((row, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-[var(--gold)] font-bold">{row.cmd}</span>
                          <span className="text-[var(--text-2)]">— {row.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* The 3 Deliverables (A. IMAGEN, B. PREVIEW, C. CÓDIGO) */}
                {msg.deliverable?.luauCode && (
                  <div className="bg-[var(--bg)] border border-[var(--stroke)] rounded-[var(--r-lg)] overflow-hidden shadow-lg space-y-3 p-3">
                    {/* Deliverable Action Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* A. Imagen Button */}
                      <button
                        onClick={() => onSelectDeliverableView('mockup')}
                        className="p-2 rounded-[var(--r-md)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--stroke)] hover:border-[var(--accent)] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
                          <ImageIcon size={14} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white">
                          A. Imagen
                        </span>
                      </button>

                      {/* B. Preview Button */}
                      <button
                        onClick={() => onSelectDeliverableView('preview')}
                        className="p-2 rounded-[var(--r-md)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--stroke)] hover:border-[var(--accent)] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded bg-[var(--ok)]/15 text-[var(--ok)] flex items-center justify-center">
                          <Eye size={14} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white">
                          B. Preview
                        </span>
                      </button>

                      {/* C. Código Button */}
                      <button
                        onClick={() => onSelectDeliverableView('code')}
                        className="p-2 rounded-[var(--r-md)] bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--stroke)] hover:border-[var(--accent)] flex flex-col items-center gap-1 transition-all text-center cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center">
                          <Terminal size={14} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 group-hover:text-white">
                          C. Código
                        </span>
                      </button>
                    </div>

                    {/* Quick Luau Snippet with Copy for Roblox Studio Command Bar */}
                    <div className="bg-[#0c0d12] rounded-[var(--r-md)] p-3 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[var(--accent)] font-bold">
                          [CÓDIGO LUAU LISTO]
                        </span>
                        <button
                          onClick={() => handleCopyLuau(msg.deliverable!.luauCode, msg.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            copiedCodeId === msg.id
                              ? 'bg-[var(--ok)] text-black'
                              : 'bg-[var(--accent)] text-black hover:brightness-110'
                          }`}
                        >
                          {copiedCodeId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedCodeId === msg.id ? 'Copiado' : 'Copiar Luau'}</span>
                        </button>
                      </div>

                      <div className="font-mono text-[10px] text-zinc-400 line-clamp-3 select-all">
                        {msg.deliverable.luauCode.slice(0, 220)}...
                      </div>
                    </div>

                    {/* 3 Numbered Installation Steps (Required by Section 2) */}
                    {msg.deliverable.installSteps && (
                      <div className="bg-[var(--surface-2)]/40 p-3 rounded-[var(--r-md)] text-[11px] text-zinc-300 font-mono space-y-1">
                        {msg.deliverable.installSteps.map((step, sIdx) => (
                          <div key={sIdx} className="leading-tight">
                            {step}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optional Suggestion Line (Section 2) */}
                    {msg.deliverable.suggestion && (
                      <div className="text-[11px] text-[var(--text-2)] italic pl-1 border-t border-[var(--stroke)] pt-2">
                        {msg.deliverable.suggestion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-2)] py-2">
            <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
            <span className="font-mono">Hytterx generando Imagen, Preview y Luau...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-[var(--surface-2)]/30 border-t border-[var(--stroke)] flex gap-2 overflow-x-auto text-[11px]">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p)}
            className="shrink-0 px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text-2)] hover:text-white border border-[var(--stroke)] transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-[var(--surface)] border-t border-[var(--stroke)] flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe la UI que quieres o usa un comando (/ayuda)..."
          rows={2}
          className="flex-1 bg-[var(--bg)] border border-[var(--stroke)] focus:border-[var(--accent)] rounded-[var(--r-md)] p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none font-['Montserrat']"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-12 rounded-[var(--r-md)] bg-[var(--accent)] text-[var(--bg)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(0,224,255,0.25)]"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
