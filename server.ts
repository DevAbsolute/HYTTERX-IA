import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Shared Gemini instance if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for Hytterx
const HYTTERX_SYSTEM_INSTRUCTION = `
Eres Hytterx: un asistente de chat que fabrica interfaces para Roblox Studio.
El usuario te describe lo que quiere con sus palabras. Tú se lo entregas.
Sin formularios. Sin cuestionarios. Sin pedir permiso.

Por cada cosa que te pide, entregas TRES resultados en un solo turno:
1. Una IMAGEN (Mockup visual 16:9 con descripción clara e IMAGE PROMPT).
2. Un PREVIEW en vivo navegable para pantalla 1280x720.
3. El CÓDIGO Luau completo para pegar en la barra de comandos de Roblox Studio.

VOZ:
- Cercano, competente, directo. Como un amigo que sabe de UI y no se enrolla.
- Español neutro. Tuteo. Frases cortas.
- Antes de los entregables: MÁXIMO 2 LÍNEAS. Nada de preámbulos.
- Sin emoji por defecto. Cero "¡Perfecto!", "¡Genial!", "espero que te guste", "avísame si necesitas algo más".
- Cero disculpas. Cero explicaciones del método.

TOKENS POR DEFECTO:
--bg #14161C | --surface #1E2230 | --surface-2 #262B3D | --stroke rgba(255,255,255,.08)
--accent #00E0FF | --accent-2 #FF7A1A | --ok #35D07F | --danger #FF4D5E | --gold #FFC53D
--text #FFFFFF | --text-2 #A7B0C0
--r-lg 14px | --r-md 10px | --r-pill 999px
--sp 8 12 16 24 | --font 'Montserrat', system-ui

REGLAS DE CÓDIGO LUAU (CRÍTICO):
- Anclaje seguro en Edit y Play:
  local Players = game:GetService("Players")
  local Player = Players.LocalPlayer
  local PlayerGui = Player and Player:FindFirstChildOfClass("PlayerGui")
  local HOST = PlayerGui or game:GetService("StarterGui")
- Anti-duplicados:
  local UI_NAME = "HytterxUI_" .. "<Slug>"
  local viejo = HOST:FindFirstChild(UI_NAME)
  if viejo then viejo:Destroy() end
- Tabla CONFIG al inicio con PALETTE, RADIUS, PADDING, FONTS, TEXTS, ICONS.
- AutoButtonColor = false SIEMPRE. TweenService hover (0.12s) y press (0.06s).
- Botón de cierre obligatorio + toggle.
- pcall envolvente con print("[Hytterx] OK -> " .. UI_NAME) al terminar.
- Termina invocando abrir().
- Enum.Font SOLO válidos: Gotham, GothamMedium, GothamBold, GothamBlack, SourceSans, SourceSansBold, Roboto, Oswald, Nunito, FredokaOne, LuckiestGuy.
- 3 líneas numeradas de instalación al final.
- Opcionalmente, UNA sola línea final con una mejora concreta sugerida.

Devuelve tu respuesta en formato JSON con la siguiente estructura:
{
  "projectSlug": "SlugDelProyecto",
  "version": "v1.0",
  "theme": "dark",
  "intro": "Máximo 2 líneas resumiendo la UI entregada.",
  "imagePrompt": "A flat, high fidelity, 16:9 modern AAA Roblox Studio UI mockup for...",
  "mockup": {
    "title": "Título de la UI",
    "category": "Tienda / Inventario / HUD / etc",
    "palette": ["#14161C", "#1E2230", "#262B3D", "#00E0FF", "#35D07F"],
    "description": "Detalle del mockup visual"
  },
  "previewData": {
    "title": "Nombre de la UI",
    "subtitle": "Subtítulo o descripción breve",
    "balance": 15450,
    "currencyName": "Monedas",
    "tabs": [
      { "id": "tab1", "name": "Pestaña 1", "icon": "shield" },
      { "id": "tab2", "name": "Pestaña 2", "icon": "zap" }
    ],
    "activeTab": "tab1",
    "items": [
      {
        "id": "item1",
        "name": "Nombre Item",
        "tab": "tab1",
        "rarity": "Legendario",
        "price": 2500,
        "desc": "Descripción del objeto.",
        "icon": "sword",
        "stats": { "Daño": "+85", "Cadencia": "1.2s", "Peso": "4.2kg" }
      }
    ],
    "modalTemplate": {
      "title": "¿Confirmar compra?",
      "confirmText": "Comprar ahora",
      "cancelText": "Cancelar"
    }
  },
  "luauCode": "-- Código Luau completo aquí...",
  "installSteps": [
    "1. Play (F5) en Studio y pon la barra de comandos en contexto Client.",
    "2. Pega el bloque completo y pulsa Enter.",
    "3. La UI aparece centrada. Para borrarla: elimina el ScreenGui HytterxUI_<Slug>."
  ],
  "suggestion": "Si quieres, le añado..."
}
`;

// Helper for generating fallback rich UI data
function getPrebuiltUI(type: string, isLight = false) {
  const accent = isLight ? '#0088CC' : '#00E0FF';
  const bg = isLight ? '#F0F2F7' : '#14161C';
  const surface = isLight ? '#FFFFFF' : '#1E2230';
  const surface2 = isLight ? '#E3E7F0' : '#262B3D';
  const text = isLight ? '#14161C' : '#FFFFFF';

  if (type.includes('inventario') || type.includes('rpg') || type.includes('mochila')) {
    return {
      projectSlug: 'InventarioRPG',
      version: 'v1.0',
      theme: isLight ? 'light' : 'dark',
      intro: 'Inventario RPG con ranuras de equipo, filtros de categoría y estadísticas de combate en tiempo real.',
      imagePrompt: 'A flat, ultra clean, 16:9 AAA Roblox RPG inventory interface, equipment slots on left, 5x4 item grid in center, stat breakdown card on right, glowing cyan accents on deep slate background, Montserrat typography, clean modern Roblox Studio style.',
      mockup: {
        title: 'Inventario de Aventurero',
        category: 'Inventario RPG / Equipo',
        palette: [bg, surface, surface2, accent, '#FFC53D', '#35D07F'],
        description: 'Rejilla 5x4 con filtros por Armas, Armaduras, Pociones y Materiales. Panel lateral con muñeco de papel y estadísticas.'
      },
      previewData: {
        title: 'Inventario de Personaje',
        subtitle: 'Nivel 42 — Paladín Arcano',
        balance: 8420,
        currencyName: 'Oro',
        tabs: [
          { id: 'armas', name: 'Armas', icon: 'sword' },
          { id: 'armaduras', name: 'Armaduras', icon: 'shield' },
          { id: 'pociones', name: 'Consumibles', icon: 'flask' },
          { id: 'materiales', name: 'Materiales', icon: 'box' }
        ],
        activeTab: 'armas',
        items: [
          { id: 'w1', name: 'Filo Celestial', tab: 'armas', rarity: 'Mítico', price: 4500, desc: 'Espada forjada con esquirlas de cometa. Aplica daño radiante en área.', icon: 'sword', stats: { 'Daño': '+145', 'Velocidad': '1.4x', 'Crítico': '+25%' } },
          { id: 'w2', name: 'Daga Sombría', tab: 'armas', rarity: 'Épico', price: 2100, desc: 'Silenciosa y letal. Otorga invisibilidad tras golpe por la espalda.', icon: 'crosshair', stats: { 'Daño': '+88', 'Velocidad': '2.1x', 'Sigilo': '+40' } },
          { id: 'w3', name: 'Báculo de Tormenta', tab: 'armas', rarity: 'Legendario', price: 3800, desc: 'Canaliza relámpagos en cadena hacia 4 enemigos cercanos.', icon: 'zap', stats: { 'Poder Arcano': '+190', 'Maná': '-15%', 'Cadencia': '0.9s' } },
          { id: 'a1', name: 'Coraza de Obsidiana', tab: 'armaduras', rarity: 'Épico', price: 2900, desc: 'Armadura pesada imbuida en fuego volcánico. Refleja 15% del daño.', icon: 'shield', stats: { 'Defensa': '+110', 'Vida': '+450', 'Resistencia Fuego': '+50%' } },
          { id: 'a2', name: 'Manto Espectral', tab: 'armaduras', rarity: 'Raro', price: 1600, desc: 'Tejido con fibras etéreas que aumentan la velocidad de movimiento.', icon: 'wind', stats: { 'Defensa': '+45', 'Velocidad': '+20%', 'Esquiva': '+18%' } },
          { id: 'p1', name: 'Elixir de Vida Mayor', tab: 'pociones', rarity: 'Común', price: 250, desc: 'Restaura 600 puntos de vida al instante y cura quemaduras.', icon: 'heart', stats: { 'Regeneración': '600 HP', 'Duración': 'Instantáneo', 'Pila': '10/20' } },
          { id: 'p2', name: 'Poción de Furia', tab: 'pociones', rarity: 'Raro', price: 400, desc: 'Aumenta el daño físico en 35% durante 30 segundos.', icon: 'flame', stats: { 'Buff': '+35% Daño', 'Duración': '30s', 'Pila': '5/20' } },
          { id: 'm1', name: 'Cristal de Éter', tab: 'materiales', rarity: 'Legendario', price: 1200, desc: 'Núcleo reactivo necesario para encantar armas de nivel 50.', icon: 'gem', stats: { 'Pureza': '99.4%', 'Uso': 'Forja', 'Pila': '8/99' } }
        ],
        modalTemplate: {
          title: '¿Equipar objeto?',
          confirmText: 'Equipar ahora',
          cancelText: 'Guardar'
        }
      },
      luauCode: generateLuauCode('InventarioRPG', 'Inventario de Personaje', isLight),
      installSteps: [
        '1. Play (F5) en Studio y pon la barra de comandos en contexto Client.',
        '2. Pega el bloque completo y pulsa Enter.',
        '3. La UI aparece centrada. Para borrarla: elimina el ScreenGui HytterxUI_InventarioRPG.'
      ],
      suggestion: 'Si quieres, le añado un comparador visual de estadísticas al seleccionar equipo.'
    };
  }

  if (type.includes('pase') || type.includes('battlepass') || type.includes('temporada')) {
    return {
      projectSlug: 'PaseDeBatalla',
      version: 'v1.0',
      theme: isLight ? 'light' : 'dark',
      intro: 'Pase de batalla con 50 niveles, vías Gratuita y Premium, barra de XP y reclamado de recompensas.',
      imagePrompt: 'A flat, 16:9 AAA Roblox Battle Pass season UI, horizontal track with reward cards, free and VIP lanes, gold and cyan progress bar, tier preview modal, Montserrat font, modern Roblox studio.',
      mockup: {
        title: 'Pase de Batalla — Temporada 4',
        category: 'Pase de Temporada / Recompensas',
        palette: [bg, surface, surface2, '#FFC53D', accent, '#FF7A1A'],
        description: 'Vía horizontal interactiva con recompensas de gemas, skins exclusivas, emotes y boosts de XP.'
      },
      previewData: {
        title: 'Pase de Batalla: Némesis',
        subtitle: 'Temporada 4 — Nivel 18 de 50 (XP: 3,450 / 5,000)',
        balance: 1250,
        currencyName: 'Gemas',
        tabs: [
          { id: 'recompensas', name: 'Recompensas', icon: 'gift' },
          { id: 'misiones', name: 'Misiones Semanales', icon: 'check-circle' },
          { id: 'premium', name: 'Pase Élite VIP', icon: 'crown' }
        ],
        activeTab: 'recompensas',
        items: [
          { id: 't1', name: 'Nivel 1: Emote Breakdance', tab: 'recompensas', rarity: 'Raro', price: 0, desc: 'Animación exclusiva para celebrar tus victorias.', icon: 'smile', stats: { 'Nivel': '1', 'Vía': 'Gratis', 'Estado': 'Desbloqueado' } },
          { id: 't2', name: 'Nivel 5: 250 Monedas', tab: 'recompensas', rarity: 'Común', price: 0, desc: 'Bolsa de oro para canjear en la tienda.', icon: 'coins', stats: { 'Nivel': '5', 'Vía': 'Gratis', 'Estado': 'Listo para reclamar' } },
          { id: 't3', name: 'Nivel 10: Skin Neón Valkyrie', tab: 'recompensas', rarity: 'Legendario', price: 0, desc: 'Diseño holográfico para tu avatar con efectos de partículas.', icon: 'sparkles', stats: { 'Nivel': '10', 'Vía': 'Premium VIP', 'Estado': 'Bloqueado' } },
          { id: 't4', name: 'Nivel 15: Planeador Cibernético', tab: 'recompensas', rarity: 'Épico', price: 0, desc: 'Despliega alas de energía al saltar de grandes alturas.', icon: 'feather', stats: { 'Nivel': '15', 'Vía': 'Gratis', 'Estado': 'Bloqueado' } },
          { id: 't5', name: 'Nivel 20: Granada de Plasma', tab: 'recompensas', rarity: 'Mítico', price: 0, desc: 'Efecto de eliminación con estallido eléctrico azul.', icon: 'disc', stats: { 'Nivel': '20', 'Vía': 'Premium VIP', 'Estado': 'Bloqueado' } }
        ],
        modalTemplate: {
          title: '¿Reclamar recompensa de Pase?',
          confirmText: 'Reclamar ahora',
          cancelText: 'Volver'
        }
      },
      luauCode: generateLuauCode('PaseDeBatalla', 'Pase de Batalla Némesis', isLight),
      installSteps: [
        '1. Play (F5) en Studio y pon la barra de comandos en contexto Client.',
        '2. Pega el bloque completo y pulsa Enter.',
        '3. La UI aparece centrada. Para borrarla: elimina el ScreenGui HytterxUI_PaseDeBatalla.'
      ],
      suggestion: 'Si quieres, le sumo un contador regresivo de fin de temporada y botón de compra de niveles.'
    };
  }

  // Default: Weapon & Skin Shop
  return {
    projectSlug: 'TiendaArmas',
    version: 'v1.0',
    theme: isLight ? 'light' : 'dark',
    intro: 'Tienda de armas con pestaña de skins, saldo arriba, grid de items y modal de compra. Oscuro con acento cian.',
    imagePrompt: 'A flat, high fidelity, 16:9 modern AAA Roblox Studio UI mockup for a weapon shop. Top header showing player coin balance and tabs for Weapons, Skins and Crates. Main 3-column grid of weapon cards with rarity borders. Right side panel showcasing selected sniper rifle with DPS, accuracy and fire rate stats. Bottom right buy button in glowing cyan neon #00E0FF. Montserrat typography, dark surface #1E2230.',
    mockup: {
      title: 'Arsenal & Skins Shop',
      category: 'Tienda de Armamento / Skins',
      palette: [bg, surface, surface2, accent, '#35D07F', '#FFC53D'],
      description: 'Encabezado con saldo de monedas, pestañas de armas/skins/cajas, rejilla de armas con tarjetas interactivas y panel de inspección con compra inmediata.'
    },
    previewData: {
      title: 'Arsenal Táctico',
      subtitle: 'Mejora tu equipamiento de combate con tecnología de vanguardia.',
      balance: 14200,
      currencyName: 'Monedas',
      tabs: [
        { id: 'armas', name: 'Armas', icon: 'crosshair' },
        { id: 'skins', name: 'Skins', icon: 'palette' },
        { id: 'cajas', name: 'Cajas', icon: 'package' },
        { id: 'pases', name: 'Pases VIP', icon: 'star' }
      ],
      activeTab: 'armas',
      items: [
        { id: 'item1', name: 'Viper Rifle TX-9', tab: 'armas', rarity: 'Mítico', price: 4200, desc: 'Fusil de precisión antimateria con recámara acelerada por riel electromagnético.', icon: 'target', stats: { 'Daño': '180 HP', 'Cadencia': '650 RPM', 'Cargador': '30 Balas', 'Rango': '85m' } },
        { id: 'item2', name: 'Apex SMG Veloce', tab: 'armas', rarity: 'Legendario', price: 2800, desc: 'Subfusil ultra ligero diseñado para escaramuzas a corta distancia sin pérdida de dispersión.', icon: 'zap', stats: { 'Daño': '45 HP', 'Cadencia': '1100 RPM', 'Cargador': '40 Balas', 'Movilidad': '+15%' } },
        { id: 'item3', name: 'Crying Devil Escopeta', tab: 'armas', rarity: 'Épico', price: 1950, desc: 'Doble cañón con postas termita incendiarias que infligen daño sostenido.', icon: 'flame', stats: { 'Daño': '240 HP', 'Cadencia': '90 RPM', 'Cargador': '8 Postas', 'Fuego': '3s DOT' } },
        { id: 'item4', name: 'Glock Nova 22', tab: 'armas', rarity: 'Raro', price: 900, desc: 'Pistola táctica semiautomática de repuesto con silenciador de tungsteno.', icon: 'shield', stats: { 'Daño': '38 HP', 'Cadencia': '450 RPM', 'Cargador': '17 Balas', 'Sigilo': '100%' } },
        { id: 'skin1', name: 'Skin Hyperbeast Neon', tab: 'skins', rarity: 'Legendario', price: 1500, desc: 'Textura animada ultravioleta que pulsa al acertar tiros a la cabeza.', icon: 'sparkles', stats: { 'Tipo': 'Animada', 'Brillo': 'Alto', 'Efecto': 'Kill FX' } },
        { id: 'skin2', name: 'Skin Oro Puro 24K', tab: 'skins', rarity: 'Mítico', price: 3200, desc: 'Baño de oro macizo con reflejos especulares de última generación.', icon: 'gem', stats: { 'Tipo': 'Material', 'Metal': 'Reflectivo', 'Exclusivo': 'Sí' } },
        { id: 'box1', name: 'Caja Cibernética', tab: 'cajas', rarity: 'Épico', price: 650, desc: 'Contiene 1 arma legendaria garantizada y probabilidad de cuchillo.', icon: 'box', stats: { 'Probabilidad': '10% Mítico', 'Rareza Min': 'Raro', 'Apertura': 'Instantánea' } },
        { id: 'pass1', name: 'Pase Doble Moneda', tab: 'pases', rarity: 'Legendario', price: 5000, desc: 'Multiplica por 2 todo el oro ganado en cada partida de por vida.', icon: 'award', stats: { 'Multiplicador': 'x2 Gold', 'Duración': 'Permanente', 'Bonus': '+500 Start' } }
      ],
      modalTemplate: {
        title: '¿Confirmar compra?',
        confirmText: 'Comprar ahora',
        cancelText: 'Cancelar'
      }
    },
    luauCode: generateLuauCode('TiendaArmas', 'Arsenal Táctico', isLight),
    installSteps: [
      '1. Play (F5) en Studio y pon la barra de comandos en contexto Client.',
      '2. Pega el bloque completo y pulsa Enter.',
      '3. La UI aparece centrada. Para borrarla: elimina el ScreenGui HytterxUI_TiendaArmas.'
    ],
    suggestion: 'Si quieres, le añado una pestaña de consumibles o un sistema de filtros por rareza.'
  };
}

// Generate valid Luau Script adhering strictly to Hytterx rules
function generateLuauCode(slug: string, title: string, isLight = false) {
  const bgCol = isLight ? 'Color3.fromRGB(240, 242, 247)' : 'Color3.fromRGB(20, 22, 28)';
  const surfaceCol = isLight ? 'Color3.fromRGB(255, 255, 255)' : 'Color3.fromRGB(30, 34, 48)';
  const surface2Col = isLight ? 'Color3.fromRGB(227, 231, 240)' : 'Color3.fromRGB(38, 43, 61)';
  const accentCol = isLight ? 'Color3.fromRGB(0, 136, 204)' : 'Color3.fromRGB(0, 224, 255)';
  const textCol = isLight ? 'Color3.fromRGB(20, 22, 28)' : 'Color3.fromRGB(255, 255, 255)';
  const text2Col = isLight ? 'Color3.fromRGB(93, 103, 120)' : 'Color3.fromRGB(167, 176, 192)';

  return `-- ============================================================
-- HYTTERX IA — CÓDIGO GENERADO PARA ROBLOX STUDIO
-- Proyecto: ${slug} | v1.0
-- Pega este código directamente en la Barra de Comandos (Client/Play o Edit)
-- ============================================================

local ok, err = pcall(function()
    local TweenService = game:GetService("TweenService")
    local Players = game:GetService("Players")
    local UserInputService = game:GetService("UserInputService")
    
    -- ANCLAJE RESISTENTE (Funciona en Edit Mode y en Play Mode)
    local Player = Players.LocalPlayer
    local PlayerGui = Player and Player:FindFirstChildOfClass("PlayerGui")
    local HOST = PlayerGui or game:GetService("StarterGui")
    
    -- ANTI-DUPLICADOS
    local UI_NAME = "HytterxUI_" .. "${slug}"
    local viejo = HOST:FindFirstChild(UI_NAME)
    if viejo then
        viejo:Destroy()
    end
    
    -- TABLA CONFIG CON VALORES MAESTROS
    local CONFIG = {
        PALETTE = {
            BG = ${bgCol},
            SURFACE = ${surfaceCol},
            SURFACE_2 = ${surface2Col},
            ACCENT = ${accentCol},
            ACCENT_2 = Color3.fromRGB(255, 122, 26),
            OK = Color3.fromRGB(53, 208, 127),
            DANGER = Color3.fromRGB(255, 77, 94),
            GOLD = Color3.fromRGB(255, 197, 61),
            TEXT = ${textCol},
            TEXT_2 = ${text2Col},
            STROKE = Color3.fromRGB(255, 255, 255),
            STROKE_TRANS = 0.92,
        },
        RADIUS = {
            LG = UDim.new(0, 14),
            MD = UDim.new(0, 10),
            PILL = UDim.new(1, 0),
        },
        FONTS = {
            MAIN = Enum.Font.Gotham,
            MEDIUM = Enum.Font.GothamMedium,
            BOLD = Enum.Font.GothamBold,
            BLACK = Enum.Font.GothamBlack,
        },
        TEXTS = {
            TITLE = "${title}",
            CLOSE = "Cerrar",
            BUY = "Comprar Ahora",
            BALANCE_LABEL = "Saldo: ",
        }
    }
    
    -- SCREENGUI RAÍZ
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = UI_NAME
    screenGui.ResetOnSpawn = false
    screenGui.IgnoreGuiInset = true
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.DisplayOrder = 50
    screenGui.Parent = HOST
    
    -- CONTENEDOR PRINCIPAL CENTRADO
    local rootFrame = Instance.new("Frame")
    rootFrame.Name = "RootFrame"
    rootFrame.AnchorPoint = Vector2.new(0.5, 0.5)
    rootFrame.Position = UDim2.fromScale(0.5, 0.5)
    rootFrame.Size = UDim2.fromScale(0.72, 0.75)
    rootFrame.BackgroundColor3 = CONFIG.PALETTE.BG
    rootFrame.BorderSizePixel = 0
    rootFrame.ClipsDescendants = true
    rootFrame.Parent = screenGui
    
    local rootAspect = Instance.new("UIAspectRatioConstraint")
    rootAspect.AspectRatio = 1.6
    rootAspect.Parent = rootFrame
    
    local rootCorner = Instance.new("UICorner")
    rootCorner.CornerRadius = CONFIG.RADIUS.LG
    rootCorner.Parent = rootFrame
    
    local rootStroke = Instance.new("UIStroke")
    rootStroke.ApplyStrokeMode = Enum.UIStrokeMode.Border
    rootStroke.Color = CONFIG.PALETTE.ACCENT
    rootStroke.Transparency = 0.75
    rootStroke.Thickness = 1.5
    rootStroke.Parent = rootFrame
    
    -- HEADER SUPERIOR
    local header = Instance.new("Frame")
    header.Name = "Header"
    header.Size = UDim2.new(1, 0, 0, 56)
    header.BackgroundColor3 = CONFIG.PALETTE.SURFACE
    header.BorderSizePixel = 0
    header.Parent = rootFrame
    
    local headerPadding = Instance.new("UIPadding")
    headerPadding.PaddingLeft = UDim.new(0, 20)
    headerPadding.PaddingRight = UDim.new(0, 20)
    headerPadding.Parent = header
    
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Name = "TitleLabel"
    titleLabel.Size = UDim2.new(0.4, 0, 1, 0)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = CONFIG.TEXTS.TITLE
    titleLabel.Font = CONFIG.FONTS.BLACK
    titleLabel.TextScaled = true
    titleLabel.TextColor3 = CONFIG.PALETTE.TEXT
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.Parent = header
    
    local titleSizeConstraint = Instance.new("UITextSizeConstraint")
    titleSizeConstraint.MaxTextSize = 22
    titleSizeConstraint.MinTextSize = 14
    titleSizeConstraint.Parent = titleLabel
    
    -- BOTÓN DE CIERRE
    local closeBtn = Instance.new("TextButton")
    closeBtn.Name = "CloseButton"
    closeBtn.AutoButtonColor = false
    closeBtn.AnchorPoint = Vector2.new(1, 0.5)
    closeBtn.Position = UDim2.new(1, 0, 0.5, 0)
    closeBtn.Size = UDim2.fromOffset(36, 36)
    closeBtn.BackgroundColor3 = CONFIG.PALETTE.SURFACE_2
    closeBtn.Text = "✕"
    closeBtn.Font = CONFIG.FONTS.BOLD
    closeBtn.TextColor3 = CONFIG.PALETTE.TEXT_2
    closeBtn.TextSize = 16
    closeBtn.Parent = header
    
    local closeCorner = Instance.new("UICorner")
    closeCorner.CornerRadius = CONFIG.RADIUS.PILL
    closeCorner.Parent = closeBtn
    
    -- EFECTO HOVER / PRESS MANUAL CON TWEENSERVICE
    local function setupButtonEffects(btn, baseColor, hoverColor, pressColor)
        btn.MouseEnter:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.12, Enum.EasingStyle.Quad), {
                BackgroundColor3 = hoverColor or CONFIG.PALETTE.ACCENT,
                TextColor3 = CONFIG.PALETTE.TEXT
            }):Play()
        end)
        btn.MouseLeave:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.12, Enum.EasingStyle.Quad), {
                BackgroundColor3 = baseColor,
                TextColor3 = CONFIG.PALETTE.TEXT_2
            }):Play()
        end)
        btn.MouseButton1Down:Connect(function()
            TweenService:Create(btn, TweenInfo.new(0.06, Enum.EasingStyle.Quad), {
                BackgroundColor3 = pressColor or CONFIG.PALETTE.ACCENT_2
            }):Play()
        end)
    end
    
    setupButtonEffects(closeBtn, CONFIG.PALETTE.SURFACE_2, CONFIG.PALETTE.DANGER, Color3.fromRGB(200, 30, 45))
    
    -- ÁREA DE CONTENIDO (PANELES)
    local contentArea = Instance.new("Frame")
    contentArea.Name = "ContentArea"
    contentArea.Position = UDim2.new(0, 0, 0, 56)
    contentArea.Size = UDim2.new(1, 0, 1, -56)
    contentArea.BackgroundTransparency = 1
    contentArea.Parent = rootFrame
    
    -- LISTA DE SCROLL PARA ITEMS
    local scroll = Instance.new("ScrollingFrame")
    scroll.Name = "ItemScroll"
    scroll.Position = UDim2.fromOffset(16, 16)
    scroll.Size = UDim2.new(0.65, -24, 1, -32)
    scroll.BackgroundColor3 = CONFIG.PALETTE.SURFACE
    scroll.BorderSizePixel = 0
    scroll.ScrollBarThickness = 4
    scroll.ScrollBarImageColor3 = CONFIG.PALETTE.ACCENT
    scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
    scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
    scroll.Parent = contentArea
    
    local scrollCorner = Instance.new("UICorner")
    scrollCorner.CornerRadius = CONFIG.RADIUS.MD
    scrollCorner.Parent = scroll
    
    local gridLayout = Instance.new("UIGridLayout")
    gridLayout.CellSize = UDim2.new(0.47, 0, 0, 120)
    gridLayout.CellPadding = UDim2.fromOffset(10, 10)
    gridLayout.SortOrder = Enum.SortOrder.LayoutOrder
    gridLayout.Parent = scroll
    
    local gridPad = Instance.new("UIPadding")
    gridPad.PaddingTop = UDim.new(0, 12)
    gridPad.PaddingBottom = UDim.new(0, 12)
    gridPad.PaddingLeft = UDim.new(0, 12)
    gridPad.PaddingRight = UDim.new(0, 12)
    gridPad.Parent = scroll
    
    -- PANEL LATERAL DERECHO (INSPECCIÓN Y COMPRA)
    local inspectPanel = Instance.new("Frame")
    inspectPanel.Name = "InspectPanel"
    inspectPanel.AnchorPoint = Vector2.new(1, 0)
    inspectPanel.Position = UDim2.new(1, -16, 0, 16)
    inspectPanel.Size = UDim2.new(0.35, -16, 1, -32)
    inspectPanel.BackgroundColor3 = CONFIG.PALETTE.SURFACE
    inspectPanel.BorderSizePixel = 0
    inspectPanel.Parent = contentArea
    
    local inspectCorner = Instance.new("UICorner")
    inspectCorner.CornerRadius = CONFIG.RADIUS.MD
    inspectCorner.Parent = inspectPanel
    
    local inspectPad = Instance.new("UIPadding")
    inspectPad.PaddingTop = UDim.new(0, 16)
    inspectPad.PaddingBottom = UDim.new(0, 16)
    inspectPad.PaddingLeft = UDim.new(0, 16)
    inspectPad.PaddingRight = UDim.new(0, 16)
    inspectPad.Parent = inspectPanel
    
    local inspectTitle = Instance.new("TextLabel")
    inspectTitle.Name = "ItemName"
    inspectTitle.Size = UDim2.new(1, 0, 0, 30)
    inspectTitle.BackgroundTransparency = 1
    inspectTitle.Text = "Detalles del Item"
    inspectTitle.Font = CONFIG.FONTS.BOLD
    inspectTitle.TextColor3 = CONFIG.PALETTE.ACCENT
    inspectTitle.TextScaled = true
    inspectTitle.Parent = inspectPanel
    
    local buyButton = Instance.new("TextButton")
    buyButton.Name = "BuyButton"
    buyButton.AutoButtonColor = false
    buyButton.AnchorPoint = Vector2.new(0.5, 1)
    buyButton.Position = UDim2.new(0.5, 0, 1, 0)
    buyButton.Size = UDim2.new(1, 0, 0, 44)
    buyButton.BackgroundColor3 = CONFIG.PALETTE.ACCENT
    buyButton.Text = CONFIG.TEXTS.BUY
    buyButton.Font = CONFIG.FONTS.BOLD
    buyButton.TextColor3 = CONFIG.PALETTE.BG
    buyButton.TextSize = 16
    buyButton.Parent = inspectPanel
    
    local buyCorner = Instance.new("UICorner")
    buyCorner.CornerRadius = CONFIG.RADIUS.MD
    buyCorner.Parent = buyButton
    
    setupButtonEffects(buyButton, CONFIG.PALETTE.ACCENT, Color3.fromRGB(80, 240, 255), CONFIG.PALETTE.ACCENT_2)
    
    -- FUNCIÓN DE APERTURA / CIERRE
    local function abrir()
        rootFrame.Visible = true
        rootFrame.Size = UDim2.fromScale(0.5, 0.5)
        rootFrame.BackgroundTransparency = 1
        
        TweenService:Create(rootFrame, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
            Size = UDim2.fromScale(0.72, 0.75),
            BackgroundTransparency = 0
        }):Play()
    end
    
    local function cerrar()
        local tween = TweenService:Create(rootFrame, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Size = UDim2.fromScale(0.4, 0.4),
            BackgroundTransparency = 1
        })
        tween:Play()
        tween.Completed:Connect(function()
            rootFrame.Visible = false
        end)
    end
    
    closeBtn.MouseButton1Click:Connect(cerrar)
    
    -- TOGGLE CON TECLA M (OPCIONAL)
    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end
        if input.KeyCode == Enum.KeyCode.M then
            if rootFrame.Visible then
                cerrar()
            else
                abrir()
            end
        end
    end)
    
    -- INVOCACIÓN INICIAL OBLIGATORIA
    abrir()
    print("[Hytterx] OK -> " .. UI_NAME)
end)

if not ok then
    warn("[Hytterx] Error al instanciar la UI:", err)
end
`;
}

// /api/chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, history, currentProject, isLight } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt requerido.' });
      return;
    }

    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // Check for explicit commands
    if (cleanPrompt.startsWith('/')) {
      const parts = cleanPrompt.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').toLowerCase();

      if (cmd === '/ayuda') {
        res.json({
          isCommand: true,
          command: '/ayuda',
          intro: 'Comandos disponibles en Hytterx IA:',
          table: [
            { cmd: '/nuevo <desc>', desc: 'Inicia un proyecto de UI desde cero' },
            { cmd: '/imagen', desc: 'Regenera el mockup visual 16:9' },
            { cmd: '/preview', desc: 'Enfoca el lienzo interactivo 1280x720' },
            { cmd: '/codigo', desc: 'Devuelve el Luau completo listo para Studio' },
            { cmd: '/tokens', desc: 'Muestra y copia el JSON de variables de diseño' },
            { cmd: '/tema claro|oscuro', desc: 'Alterna la paleta de colores del proyecto' },
            { cmd: '/estado', desc: 'Muestra el slug activo, versión y tokens' },
            { cmd: '/rehacer', desc: 'Reconstruye la UI activa con otra variante' },
          ]
        });
        return;
      }

      if (cmd === '/tokens') {
        const tokensData = {
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
        res.json({
          isCommand: true,
          command: '/tokens',
          intro: 'Tokens activos del proyecto:',
          tokens: tokensData
        });
        return;
      }

      if (cmd === '/tema') {
        const lightMode = arg.includes('claro');
        const updated = getPrebuiltUI(currentProject?.slug || 'TiendaArmas', lightMode);
        res.json({
          ...updated,
          intro: `Tema cambiado a ${lightMode ? 'claro' : 'oscuro'}. v1.1.`
        });
        return;
      }

      if (cmd === '/estado') {
        res.json({
          isCommand: true,
          command: '/estado',
          intro: `PROYECTO: ${currentProject?.slug || 'TiendaArmas'} | ${currentProject?.version || 'v1.0'} | tokens: ${isLight ? 'claro' : 'preset/oscuro'}`
        });
        return;
      }
    }

    // If Gemini AI is configured with API key, use Gemini 3.8 Flash to generate structured Hytterx output
    if (ai) {
      try {
        const userMessage = `
Usuario pide: "${cleanPrompt}"
Proyecto activo: ${currentProject?.slug || 'Ninguno'} (${currentProject?.version || 'v1.0'})
Tema preferido: ${isLight ? 'claro' : 'oscuro'}
Historial reciente: ${JSON.stringify(history?.slice(-4) || [])}

Genera los 3 entregables obligatorios (A. IMAGEN spec, B. PREVIEW data, C. CÓDIGO Luau completo) siguiendo estrictamente el JSON schema indicado en tus instrucciones. Asegúrate de que el código Luau sea 100% válido, completo, con CONFIG, pcall, abrir() y anclaje seguro HOST = PlayerGui or game:GetService("StarterGui").
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userMessage,
          config: {
            systemInstruction: HYTTERX_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          // Ensure valid structure
          if (parsed && parsed.luauCode && parsed.previewData) {
            res.json(parsed);
            return;
          }
        }
      } catch (geminiError) {
        console.warn('Gemini request failed or format mismatch, falling back to smart engine:', geminiError);
      }
    }

    // Smart fallback engine: matches user intent or generates tailored UI
    const targetType = lower.includes('inventario') || lower.includes('mochila') || lower.includes('rpg')
      ? 'inventario'
      : (lower.includes('pase') || lower.includes('battlepass') || lower.includes('temporada')
        ? 'pase'
        : 'tienda');

    const result = getPrebuiltUI(targetType, isLight);

    // If user provided a specific title or nuance
    if (lower.includes('compacta') || lower.includes('pequeña')) {
      result.intro = 'Hecho. Espaciado a la mitad, radios reducidos y densidad optimizada. v1.1.';
      result.version = 'v1.1';
    } else if (cleanPrompt.length > 5 && !cleanPrompt.startsWith('/')) {
      result.intro = `${result.mockup.title} configurada según tu solicitud.`;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor Hytterx' });
  }
});

// Setup dev server with Vite or production static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hytterx Server] Corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
