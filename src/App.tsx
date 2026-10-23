import React, { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { StagePreview } from './components/StagePreview';
import { CodeViewer } from './components/CodeViewer';
import { MockupViewer } from './components/MockupViewer';
import { ChatMessage, DeliverableData, ProjectState } from './types';
import { 
  Eye, Terminal, Image as ImageIcon, History, 
  Sun, Moon, Copy, Check, Download, Layers, Shield
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'mockup'>('preview');
  const [isLight, setIsLight] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Project State
  const [projectState, setProjectState] = useState<ProjectState>({
    slug: 'TiendaArmas',
    version: 'v1.0',
    tokens: 'preset/oscuro',
    history: []
  });

  // Current active deliverable
  const [currentDeliverable, setCurrentDeliverable] = useState<DeliverableData | null>(null);

  // Messages array
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 2800);
  };

  // Initial Load: Create initial TiendaArmas deliverable so user has instant live UI
  useEffect(() => {
    const initDefault = async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'tienda de armas con skins y monedas',
            isLight: false
          })
        });
        if (res.ok) {
          const data: DeliverableData = await res.json();
          setCurrentDeliverable(data);
          setProjectState({
            slug: data.projectSlug || 'TiendaArmas',
            version: data.version || 'v1.0',
            tokens: 'preset/oscuro',
            history: [data]
          });
          setMessages([
            {
              id: 'init-msg-1',
              role: 'user',
              text: 'hola, quiero una tienda de armas con skins y monedas',
              timestamp: new Date().toLocaleTimeString()
            },
            {
              id: 'init-msg-2',
              role: 'assistant',
              deliverable: data,
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to init default deliverable:', err);
      }
    };

    initDefault();
  }, []);

  // Handle user sending chat message
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentProject: {
            slug: projectState.slug,
            version: projectState.version,
          },
          history: messages.slice(-4).map(m => ({ role: m.role, text: m.text || m.deliverable?.intro })),
          isLight
        })
      });

      if (!res.ok) {
        throw new Error('Error al conectar con Hytterx IA');
      }

      const deliverable: DeliverableData = await res.json();

      // If it's a new UI or update
      if (deliverable.previewData) {
        setCurrentDeliverable(deliverable);
        setProjectState(prev => ({
          slug: deliverable.projectSlug || prev.slug,
          version: deliverable.version || prev.version,
          tokens: isLight ? 'claro' : 'preset/oscuro',
          history: [...prev.history, deliverable].slice(-5) // remember last 5 versions
        }));
      }

      const botMsg: ChatMessage = {
        id: `hytterx-${Date.now()}`,
        role: 'assistant',
        deliverable,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Error en la generación. Pásame el detalle y lo reemito corregido.',
        isError: true,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle theme
  const handleToggleTheme = () => {
    const nextLight = !isLight;
    setIsLight(nextLight);
    document.documentElement.setAttribute('data-theme', nextLight ? 'light' : 'dark');
    showToast(`Tema cambiado a ${nextLight ? 'claro' : 'oscuro'}`);
  };

  // Restore version from history
  const handleSelectVersion = (versionStr: string) => {
    const found = projectState.history.find(h => h.version === versionStr);
    if (found) {
      setCurrentDeliverable(found);
      setProjectState(prev => ({
        ...prev,
        slug: found.projectSlug,
        version: found.version
      }));
      showToast(`Restaurada versión ${found.version}`);
    }
  };

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] font-['Montserrat'] ${isLight ? 'light' : 'dark'}`}>
      {/* Top Main Navigation Bar */}
      <header className="h-12 px-4 bg-[var(--surface)] border-b border-[var(--stroke)] flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--accent)] text-[var(--bg)] font-black flex items-center justify-center text-xs shadow-[0_0_10px_rgba(0,224,255,0.4)]">
              H
            </div>
            <span className="font-black text-sm tracking-widest uppercase">Hytterx IA</span>
          </div>

          <div className="h-4 w-px bg-[var(--stroke)]"></div>

          {/* Project State Indicator (Section 8 of prompt) */}
          <div className="flex items-center gap-2 bg-[var(--surface-2)]/60 px-2.5 py-1 rounded-[var(--r-md)] border border-[var(--stroke)] text-[11px] font-mono">
            <span className="text-[var(--text-2)]">PROYECTO:</span>
            <span className="text-[var(--accent)] font-bold">{projectState.slug}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-[var(--gold)] font-bold">{projectState.version}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">tokens: {isLight ? 'claro' : 'preset/oscuro'}</span>
          </div>

          {/* Version History Selector */}
          {projectState.history.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <History size={14} className="text-[var(--text-2)]" />
              <select
                value={projectState.version}
                onChange={e => handleSelectVersion(e.target.value)}
                className="bg-[var(--surface-2)] border border-[var(--stroke)] rounded text-[11px] font-mono px-2 py-0.5 text-zinc-300 focus:outline-none cursor-pointer"
              >
                {projectState.history.map((h, i) => (
                  <option key={i} value={h.version}>
                    {h.version} ({h.projectSlug})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Switcher Tabs (Preview, Código, Mockup) */}
        <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-[var(--r-md)] border border-[var(--stroke)]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--text-2)] hover:text-white'
            }`}
          >
            <Eye size={13} />
            <span>Preview Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--text-2)] hover:text-white'
            }`}
          >
            <Terminal size={13} />
            <span>Código Luau</span>
          </button>

          <button
            onClick={() => setActiveTab('mockup')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mockup'
                ? 'bg-[var(--accent)] text-[var(--bg)] shadow-sm'
                : 'text-[var(--text-2)] hover:text-white'
            }`}
          >
            <ImageIcon size={13} />
            <span>Mockup 16:9</span>
          </button>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2">
          {currentDeliverable?.luauCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentDeliverable.luauCode);
                showToast('Código Luau copiado para Roblox Studio');
              }}
              className="flex items-center gap-1 px-3 py-1 rounded bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--ok)] border border-[var(--ok)]/30 text-xs font-bold transition-colors cursor-pointer"
              title="Copiar código Luau directo"
            >
              <Copy size={13} />
              <span>Copiar Luau</span>
            </button>
          )}

          <button
            onClick={handleToggleTheme}
            className="p-1.5 rounded bg-[var(--surface-2)] text-[var(--text-2)] hover:text-white border border-[var(--stroke)] transition-colors cursor-pointer"
            title={isLight ? 'Modo Oscuro' : 'Modo Claro'}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Chat + Right Stage/Studio */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat with Hytterx IA */}
        <div className="w-[420px] max-w-[42%] min-w-[340px] h-full shrink-0">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            activeProject={projectState}
            onSendMessage={handleSendMessage}
            onSelectDeliverableView={tab => setActiveTab(tab)}
            onToast={showToast}
          />
        </div>

        {/* Right Column: Dynamic Workspace Display */}
        <main className="flex-1 h-full overflow-hidden relative">
          {currentDeliverable ? (
            activeTab === 'preview' ? (
              <StagePreview
                previewData={currentDeliverable.previewData}
                isLight={isLight}
                onToggleTheme={handleToggleTheme}
                onToast={showToast}
              />
            ) : activeTab === 'code' ? (
              <CodeViewer
                code={currentDeliverable.luauCode}
                projectSlug={currentDeliverable.projectSlug}
                version={currentDeliverable.version}
                onToast={showToast}
              />
            ) : (
              <MockupViewer
                mockup={currentDeliverable.mockup}
                previewData={currentDeliverable.previewData}
                imagePrompt={currentDeliverable.imagePrompt}
                isLight={isLight}
                onToast={showToast}
                onViewStage={() => setActiveTab('preview')}
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-2)] space-y-3">
              <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-xs">Cargando motor Hytterx...</p>
            </div>
          )}
        </main>
      </div>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface)] text-white border border-[var(--accent)] px-5 py-2.5 rounded-[var(--r-pill)] text-xs font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-2 z-50 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
