export interface UIItem {
  id: string;
  name: string;
  tab: string;
  rarity: 'Común' | 'Raro' | 'Épico' | 'Legendario' | 'Mítico';
  price: number;
  desc: string;
  icon: string;
  stats?: Record<string, string>;
}

export interface UITab {
  id: string;
  name: string;
  icon: string;
}

export interface UIModalTemplate {
  title: string;
  confirmText: string;
  cancelText: string;
}

export interface UIPreviewData {
  title: string;
  subtitle: string;
  balance: number;
  currencyName: string;
  tabs: UITab[];
  activeTab: string;
  items: UIItem[];
  modalTemplate?: UIModalTemplate;
}

export interface UIMockup {
  title: string;
  category: string;
  palette: string[];
  description: string;
}

export interface DeliverableData {
  projectSlug: string;
  version: string;
  theme: 'dark' | 'light';
  intro: string;
  imagePrompt: string;
  mockup: UIMockup;
  previewData: UIPreviewData;
  luauCode: string;
  installSteps: string[];
  suggestion?: string;
  isCommand?: boolean;
  command?: string;
  table?: Array<{ cmd: string; desc: string }>;
  tokens?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  timestamp: string;
  deliverable?: DeliverableData;
  isError?: boolean;
}

export interface ProjectState {
  slug: string;
  version: string;
  tokens: string;
  history: DeliverableData[];
}
