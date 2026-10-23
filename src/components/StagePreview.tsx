import React, { useEffect, useRef, useState, useMemo } from 'react';
import { UIPreviewData, UIItem } from '../types';
import { 
  X, Check, Shield, Zap, Sparkles, Crosshair, Box, Gift, 
  Crown, Smile, Coins, Star, Package, Flame, Heart, 
  Sliders, Moon, Sun, RotateCcw, Copy, Volume2, Eye, EyeOff
} from 'lucide-react';

interface StagePreviewProps {
  previewData: UIPreviewData;
  isLight: boolean;
  onToggleTheme: () => void;
  onToast: (msg: string) => void;
  onUpdateBalance?: (newBalance: number) => void;
}

export const StagePreview: React.FC<StagePreviewProps> = ({
  previewData,
  isLight,
  onToggleTheme,
  onToast,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [manualScalePercent, setManualScalePercent] = useState<number>(100);
  const [showChrome, setShowChrome] = useState<boolean>(true);
  
  // App interactive states
  const [activeTab, setActiveTab] = useState<string>(previewData.activeTab || previewData.tabs[0]?.id || 'armas');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    previewData.items.find(i => i.tab === activeTab)?.id || previewData.items[0]?.id || ''
  );
  const [balance, setBalance] = useState<number>(previewData.balance || 10000);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isClosedInUI, setIsClosedInUI] = useState<boolean>(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [activeToast, setActiveToast] = useState<{ id: number; message: string } | null>(null);

  // Sync state when new deliverable is loaded
  useEffect(() => {
    if (previewData) {
      setActiveTab(previewData.activeTab || previewData.tabs[0]?.id || 'armas');
      setBalance(previewData.balance || 10000);
      setIsClosedInUI(false);
      const firstItem = previewData.items.find(i => i.tab === (previewData.activeTab || previewData.tabs[0]?.id)) || previewData.items[0];
      if (firstItem) setSelectedItemId(firstItem.id);
    }
  }, [previewData]);

  // Selected item
  const selectedItem = useMemo(() => {
    return previewData.items.find(i => i.id === selectedItemId) || previewData.items[0];
  }, [selectedItemId, previewData.items]);

  // Filtered items by tab
  const tabItems = useMemo(() => {
    return previewData.items.filter(i => !i.tab || i.tab === activeTab);
  }, [previewData.items, activeTab]);

  // ResizeObserver to calculate --s for 1280x720 virtual stage
  useEffect(() => {
    const handleResize = () => {
      if (!viewportRef.current) return;
      const { clientWidth, clientHeight } = viewportRef.current;
      // Leave padding of 16px around stage
      const targetWidth = 1280;
      const targetHeight = 720;
      const fitScale = Math.min((clientWidth - 32) / targetWidth, (clientHeight - 32) / targetHeight);
      const computedScale = Math.max(0.2, fitScale * (manualScalePercent / 100));
      setScale(computedScale);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }
    return () => observer.disconnect();
  }, [manualScalePercent]);

  // ESC key to close modal or toggle UI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
        } else {
          setIsClosedInUI(prev => !prev);
        }
      }
      if (e.key.toLowerCase() === 'm' && !isModalOpen) {
        setIsClosedInUI(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Trigger toast that self-destructs in 3 seconds
  const showStageToast = (msg: string) => {
    const id = Date.now();
    setActiveToast({ id, message: msg });
    setTimeout(() => {
      setActiveToast(curr => (curr?.id === id ? null : curr));
    }, 3000);
  };

  // Handle Buy
  const handleConfirmPurchase = () => {
    if (!selectedItem) return;
    if (balance < selectedItem.price) {
      showStageToast(`¡Saldo insuficiente! Necesitas ${selectedItem.price - balance} ${previewData.currencyName} más.`);
      setIsModalOpen(false);
      return;
    }

    setBalance(prev => prev - selectedItem.price);
    setPurchasedIds(prev => new Set(prev).add(selectedItem.id));
    setIsModalOpen(false);
    showStageToast(`¡Compraste "${selectedItem.name}" por ${selectedItem.price.toLocaleString()} ${previewData.currencyName}!`);
  };

  // Reset stage
  const handleReset = () => {
    setBalance(previewData.balance || 10000);
    setPurchasedIds(new Set());
    setIsClosedInUI(false);
    setIsModalOpen(false);
    showStageToast('Estado de simulación reiniciado.');
  };

  // Copy Tokens
  const handleCopyTokens = () => {
    const tokens = {
      palette: {
        bg: isLight ? '#F0F2F7' : '#14161C',
        surface: isLight ? '#FFFFFF' : '#1E2230',
        surface2: isLight ? '#E3E7F0' : '#262B3D',
        stroke: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        accent: isLight ? '#0088CC' : '#00E0FF',
        accent2: isLight ? '#E65C00' : '#FF7A1A',
        ok: isLight ? '#1FA660' : '#35D07F',
        danger: isLight ? '#E03546' : '#FF4D5E',
        gold: isLight ? '#D69700' : '#FFC53D',
        text: isLight ? '#14161C' : '#FFFFFF',
        text2: isLight ? '#5D6778' : '#A7B0C0',
      },
      radii: { lg: '14px', md: '10px', pill: '999px' },
      spacing: [8, 12, 16, 24],
      font: "'Montserrat', system-ui"
    };
    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    onToast('Tokens copiados al portapapeles');
    showStageToast('Tokens JSON copiados al portapapeles');
  };

  // Rarity color helper
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mítico': return 'var(--danger)';
      case 'Legendario': return 'var(--gold)';
      case 'Épico': return '#B347FF';
      case 'Raro': return 'var(--accent)';
      default: return 'var(--text-2)';
    }
  };

  const getItemIcon = (name: string) => {
    switch (name) {
      case 'shield': return <Shield size={18} />;
      case 'zap': return <Zap size={18} />;
      case 'crosshair': return <Crosshair size={18} />;
      case 'package': return <Package size={18} />;
      case 'box': return <Box size={18} />;
      case 'flame': return <Flame size={18} />;
      case 'heart': return <Heart size={18} />;
      case 'crown': return <Crown size={18} />;
      case 'gift': return <Gift size={18} />;
      case 'sparkles': return <Sparkles size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  return (
    <div id="viewport" ref={viewportRef} data-theme={isLight ? 'light' : 'dark'}>
      {/* 1280x720 Virtual Stage Container */}
      <div 
        id="stage"
        style={{
          transform: `scale(${scale})`,
          left: `calc(50% - ${(1280 * scale) / 2}px)`,
          top: `calc(50% - ${(720 * scale) / 2}px)`,
        }}
      >
        {/* Roblox Simulated Top Chrome Bar (36px) */}
        {showChrome && (
          <div id="rbx-chrome">
            <div className="flex items-center gap-3">
              {/* Roblox Classic Square Icon */}
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center transform -rotate-12 shadow-sm">
                <div className="w-2 h-2 bg-black rounded-xs"></div>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>60 FPS</span>
                <span className="text-zinc-500">|</span>
                <span>18ms</span>
              </div>
            </div>

            <div className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
              Roblox Studio Client — <span className="text-[var(--accent)] font-bold">{previewData.title}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded text-xs font-semibold">
                <Coins size={14} className="text-[var(--gold)]" />
                <span className="font-mono text-white">{balance.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-700">
                <div className="w-5 h-5 rounded-full bg-[var(--accent)]/30 border border-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                  P1
                </div>
                <span className="text-xs font-medium">Player1</span>
              </div>
            </div>
          </div>
        )}

        {/* Real Roblox UI Container */}
        <div 
          id="app" 
          style={{ height: showChrome ? 'calc(720px - 36px)' : '720px' }}
        >
          {isClosedInUI ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 bg-[var(--surface)] border border-[var(--stroke)] rounded-[var(--r-lg)] text-center animate-fadeIn">
              <EyeOff size={40} className="text-[var(--text-2)] mb-1" />
              <div className="text-lg font-bold text-[var(--text)]">UI Minimizada</div>
              <div className="text-sm text-[var(--text-2)]">Presiona la tecla <kbd className="px-2 py-0.5 bg-[var(--surface-2)] rounded font-mono text-xs">M</kbd> o el botón inferior para reabrir.</div>
              <button 
                onClick={() => setIsClosedInUI(false)}
                className="mt-2 px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] font-bold rounded-[var(--r-md)] hover:brightness-110 active:scale-95 transition-all text-sm cursor-pointer"
              >
                Abrir UI de Roblox
              </button>
            </div>
          ) : (
            /* Root Centered Roblox Frame */
            <div 
              className="w-[980px] h-[580px] max-w-[94%] bg-[var(--bg)] rounded-[var(--r-lg)] border border-[var(--accent)]/30 shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden relative"
              style={{
                boxShadow: `0 0 30px rgba(0, 224, 255, 0.08), 0 20px 40px rgba(0,0,0,0.8)`
              }}
            >
              {/* Header Bar */}
              <div className="h-14 px-6 bg-[var(--surface)] border-b border-[var(--stroke)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-6 bg-[var(--accent)] rounded-sm"></div>
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-[var(--text)] uppercase leading-tight font-['Montserrat']">
                      {previewData.title}
                    </h2>
                    <p className="text-[11px] text-[var(--text-2)] font-medium">
                      {previewData.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right Header: Balance & Close */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--stroke)] px-3.5 py-1.5 rounded-[var(--r-pill)]">
                    <Coins size={16} className="text-[var(--gold)]" />
                    <span className="text-xs font-bold text-[var(--text-2)]">Saldo:</span>
                    <span className="text-sm font-black font-mono text-[var(--text)]">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[var(--accent)]">
                      {previewData.currencyName}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsClosedInUI(true)}
                    className="w-9 h-9 rounded-[var(--r-pill)] bg-[var(--surface-2)] hover:bg-[var(--danger)] hover:text-white text-[var(--text-2)] border border-[var(--stroke)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    title="Cerrar ventana (Esc o M)"
                    aria-label="Cerrar UI"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="h-12 px-6 bg-[var(--surface)]/70 border-b border-[var(--stroke)] flex items-center gap-2 shrink-0">
                {previewData.tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        const firstInTab = previewData.items.find(i => i.tab === tab.id);
                        if (firstInTab) setSelectedItemId(firstInTab.id);
                      }}
                      className={`h-9 px-4 rounded-[var(--r-md)] flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                        isActive
                          ? 'bg-[var(--accent)] text-[var(--bg)] shadow-[0_0_15px_rgba(0,224,255,0.3)]'
                          : 'bg-transparent text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {getItemIcon(tab.icon)}
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Main Content: Left Grid + Right Detail Panel */}
              <div className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Items Grid (Scrollable) */}
                <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 auto-rows-max">
                  {tabItems.map(item => {
                    const isSelected = selectedItemId === item.id;
                    const isPurchased = purchasedIds.has(item.id);
                    const rarityColor = getRarityColor(item.rarity);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`group relative p-3 rounded-[var(--r-md)] border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-[0_0_20px_rgba(0,224,255,0.2)] scale-[1.01]'
                            : 'bg-[var(--surface)] border-[var(--stroke)] hover:border-[var(--text-2)]/40 hover:scale-[1.02]'
                        }`}
                      >
                        {/* Rarity Tag */}
                        <div className="flex items-center justify-between mb-2">
                          <span 
                            className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-xs"
                            style={{ 
                              color: rarityColor, 
                              backgroundColor: `color-mix(in srgb, ${rarityColor} 15%, transparent)` 
                            }}
                          >
                            {item.rarity}
                          </span>

                          {isPurchased && (
                            <span className="text-[10px] font-bold text-[var(--ok)] bg-[var(--ok)]/15 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check size={10} /> En posesión
                            </span>
                          )}
                        </div>

                        {/* Item Icon & Title */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-[var(--r-md)] bg-[var(--bg)] border border-[var(--stroke)] flex items-center justify-center shrink-0 group-hover:border-[var(--accent)] transition-colors"
                            style={{ color: rarityColor }}
                          >
                            {getItemIcon(item.icon)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[var(--text)] truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--gold)] font-bold mt-0.5">
                              <Coins size={12} />
                              <span>{item.price === 0 ? 'Gratis' : item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Inspect & Action Panel */}
                <div className="w-[320px] bg-[var(--surface)] border border-[var(--stroke)] rounded-[var(--r-md)] p-5 flex flex-col justify-between shrink-0 shadow-lg">
                  {selectedItem ? (
                    <div className="flex flex-col gap-4 overflow-y-auto">
                      <div>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs"
                            style={{
                              color: getRarityColor(selectedItem.rarity),
                              backgroundColor: `color-mix(in srgb, ${getRarityColor(selectedItem.rarity)} 20%, transparent)`
                            }}
                          >
                            {selectedItem.rarity}
                          </span>
                          <span className="text-xs font-mono text-[var(--text-2)]">
                            ID: #{selectedItem.id}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-[var(--text)] mt-1.5 leading-snug">
                          {selectedItem.name}
                        </h3>
                      </div>

                      {/* Item Visual Showcase */}
                      <div className="w-full h-32 rounded-[var(--r-md)] bg-[var(--bg)] border border-[var(--stroke)] flex flex-col items-center justify-center relative overflow-hidden group">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ 
                            color: getRarityColor(selectedItem.rarity),
                            backgroundColor: `color-mix(in srgb, ${getRarityColor(selectedItem.rarity)} 15%, transparent)`
                          }}
                        >
                          {getItemIcon(selectedItem.icon)}
                        </div>
                        <div className="absolute bottom-2 text-[10px] font-mono text-[var(--text-2)]">
                          Modelo 3D Inspección
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-2)] leading-relaxed">
                        {selectedItem.desc}
                      </p>

                      {/* Stat Breakdown */}
                      {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                        <div className="bg-[var(--surface-2)]/60 rounded-[var(--r-md)] p-3 border border-[var(--stroke)] space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-2)] mb-1">
                            Especificaciones
                          </div>
                          {Object.entries(selectedItem.stats).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center text-xs">
                              <span className="text-[var(--text-2)]">{key}</span>
                              <span className="font-mono font-bold text-[var(--accent)]">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[var(--text-2)] text-xs py-10">
                      Selecciona un objeto para ver sus detalles.
                    </div>
                  )}

                  {/* Purchase / Action Button */}
                  <div className="pt-4 border-t border-[var(--stroke)] shrink-0">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      disabled={!selectedItem || purchasedIds.has(selectedItem.id)}
                      className={`w-full h-11 rounded-[var(--r-md)] font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
                        purchasedIds.has(selectedItem?.id || '')
                          ? 'bg-[var(--surface-2)] text-[var(--ok)] border border-[var(--ok)]/40 cursor-default opacity-90'
                          : 'bg-[var(--accent)] text-[var(--bg)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,224,255,0.4)] active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed'
                      }`}
                    >
                      {purchasedIds.has(selectedItem?.id || '') ? (
                        <>
                          <Check size={18} /> Equipado / En Inventario
                        </>
                      ) : (
                        <>
                          <Coins size={16} /> Comprar por {selectedItem?.price.toLocaleString()} {previewData.currencyName}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Purchase Confirmation Modal */}
              {isModalOpen && selectedItem && (
                <div 
                  className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-6 animate-fadeIn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <div 
                    className="w-[420px] bg-[var(--surface)] border border-[var(--accent)]/50 rounded-[var(--r-lg)] p-6 shadow-2xl space-y-4"
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-label="Modal de confirmación"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--stroke)]">
                      <h4 className="text-base font-black text-[var(--text)] uppercase">
                        {previewData.modalTemplate?.title || '¿Confirmar Adquisición?'}
                      </h4>
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="text-[var(--text-2)] hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--bg)] p-3 rounded-[var(--r-md)] border border-[var(--stroke)]">
                      <div 
                        className="w-12 h-12 rounded-[var(--r-md)] flex items-center justify-center shrink-0"
                        style={{ color: getRarityColor(selectedItem.rarity), backgroundColor: 'rgba(255,255,255,0.05)' }}
                      >
                        {getItemIcon(selectedItem.icon)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-[var(--text)]">{selectedItem.name}</div>
                        <div className="text-xs text-[var(--text-2)]">{selectedItem.rarity}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[var(--text-2)] px-1">
                      <span>Costo total:</span>
                      <span className="font-mono font-bold text-sm text-[var(--gold)]">
                        {selectedItem.price.toLocaleString()} {previewData.currencyName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[var(--text-2)] px-1">
                      <span>Saldo restante tras compra:</span>
                      <span className={`font-mono font-bold text-sm ${balance - selectedItem.price < 0 ? 'text-[var(--danger)]' : 'text-[var(--ok)]'}`}>
                        {(balance - selectedItem.price).toLocaleString()} {previewData.currencyName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="h-10 rounded-[var(--r-md)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        {previewData.modalTemplate?.cancelText || 'Cancelar'}
                      </button>
                      <button
                        onClick={handleConfirmPurchase}
                        className="h-10 rounded-[var(--r-md)] bg-[var(--accent)] text-[var(--bg)] font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all"
                      >
                        {previewData.modalTemplate?.confirmText || 'Confirmar Compra'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Stage Toast Notification */}
              {activeToast && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[var(--surface-2)] border border-[var(--accent)] text-[var(--text)] px-4 py-2 rounded-[var(--r-pill)] text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce z-50">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>{activeToast.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating DEVBAR (Bottom Right as per Section 6) */}
      <div id="devbar">
        {/* Scale Slider */}
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Sliders size={14} className="text-[var(--accent)]" />
          <span className="font-mono text-[11px] w-9">{manualScalePercent}%</span>
          <input
            type="range"
            min="60"
            max="130"
            value={manualScalePercent}
            onChange={e => setManualScalePercent(Number(e.target.value))}
            className="w-20 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            title="Escala de vista (60% - 130%)"
          />
        </div>

        <div className="w-px h-4 bg-zinc-700"></div>

        {/* Dark / Light Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Chrome Toggle */}
        <button
          onClick={() => setShowChrome(prev => !prev)}
          className={`p-1.5 rounded transition-colors ${showChrome ? 'bg-zinc-800 text-[var(--accent)]' : 'text-zinc-400 hover:text-white'}`}
          title="Alternar barra superior Roblox Chrome"
        >
          {showChrome ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        {/* Reset State */}
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          title="Reiniciar estado de compra y simulación"
        >
          <RotateCcw size={14} />
        </button>

        <div className="w-px h-4 bg-zinc-700"></div>

        {/* Copy Tokens */}
        <button
          onClick={handleCopyTokens}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--surface-2)] hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-[var(--stroke)] transition-colors"
        >
          <Copy size={12} />
          <span>TOKENS</span>
        </button>
      </div>
    </div>
  );
};
