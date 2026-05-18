import {
  AppTheme,
  BroadcastNotification,
  Card,
  Coupon,
  CustomThemeConfig,
  Folder,
  InspirationalSlide,
  MediaItem,
  Module,
  PromoBanner,
  SentenceTopic,
  Story,
  SupportTicket,
  ThemeSchedule,
} from '../../types';

export interface AdminDashboardProps {
  onExit: () => void;
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;
  stories: Story[];
  setStories: (stories: Story[]) => void;
  cards: Card[];
  setCards: (cards: Card[]) => void;
  curriculum?: Module[];
  setCurriculum?: (curriculum: Module[]) => void;
  t: any;
  selectedTheme: AppTheme;
  setSelectedTheme: (theme: AppTheme) => void;
  themeSchedules: ThemeSchedule[];
  setThemeSchedules: (schedules: ThemeSchedule[]) => void;
  customThemeConfig: CustomThemeConfig;
  setCustomThemeConfig: (config: CustomThemeConfig) => void;
  coupons: Coupon[];
  setCoupons: (coupons: Coupon[]) => void;
  banners: PromoBanner[];
  setBanners: (banners: PromoBanner[]) => void;
  broadcasts: BroadcastNotification[];
  setBroadcasts: (broadcasts: BroadcastNotification[]) => void;
  tickets: SupportTicket[];
  setTickets: (tickets: SupportTicket[]) => void;
  mediaItems: MediaItem[];
  setMediaItems: (items: MediaItem[]) => void;
  sentenceTopics: SentenceTopic[];
  setSentenceTopics: (topics: SentenceTopic[]) => void;
  inspirationalSlides: InspirationalSlide[];
  setInspirationalSlides: (slides: InspirationalSlide[]) => void;
  refreshFoldersFromApi: () => Promise<void>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  learningLang: 'en' | 'de';
  langAvailability: any;
  setLangAvailability: (val: any) => void;
}
