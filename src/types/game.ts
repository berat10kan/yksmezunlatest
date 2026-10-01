export type TimeOfDay = 'SABAH' | 'ÖĞLE' | 'İKİNDİ' | 'AKŞAM' | 'GECE';

export type ExamField = 'SAY' | 'EA' | 'SOZ' | 'DIL';

export type GameDifficulty = 'CASUAL' | 'BALANCED' | 'HARDCORE' | 'SPEEDRUN';

export interface GameDifficultyConfig {
  id: GameDifficulty;
  name: string;
  badge: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  studySpeedMultiplier: number; // Question mastery & BP multiplier
  costMultiplier: number;       // Shop items & upgrade cost multiplier
  stressMultiplier: number;     // Stress gain rate
  energyCostMultiplier: number; // Energy consumed per question
}

export interface Trait {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge: string;
  effect: {
    studySpeedMultiplier?: number;
    stressGainMultiplier?: number;
    energyRegenMultiplier?: number;
    examBonusNet?: number;
    socialMoraleMultiplier?: number;
  };
}

export interface UniversityGoal {
  id: string;
  name: string;
  city: string;
  major: string;
  field: ExamField;
  targetRank: number;
  requiredTytNet: number;
  requiredAytNet: number;
  logoColor: string;
  description: string;
  faculty?: string;
  scholarship?: string;
  quota?: number;
  isCustom?: boolean;
}

export interface CharacterCustomization {
  name: string;
  nickname: string;
  gender?: 'male' | 'female';
  avatarStyle: string;
  avatarImage: string;
  hoodieColor: string;
  roomTheme: 'minimalist' | 'warm_wood' | 'night_owl' | 'anime_vibes';
  originReason: '0.5_net' | 'gec_uyandim' | 'hedef_buyuttum' | 'sifirdan_basladim';
  traitId: string;
  deskAccessory?: 'lucky_cat' | 'sand_timer' | 'succulent' | 'rubik_cube' | 'steaming_mug';
  roomLighting?: 'warm_amber' | 'cyber_neon' | 'pure_white' | 'dim_candle';
  wallPoster?: 'osym_countdown' | 'einstein_quote' | 'boun_gates' | 'matrix_code';
  mottoText?: string;
  // Dynamic Modular Character Features
  hairstyle?: 'messy' | 'short_fade' | 'undercut' | 'ponytail' | 'curly' | 'bun' | 'straight_long';
  hairColor?: string;
  eyewear?: 'none' | 'glasses_classic' | 'glasses_wire' | 'sunglasses';
  expression?: 'focused' | 'confident' | 'tired' | 'hyped';
  clothingStyle?: 'hoodie' | 'varsity' | 'sweatshirt' | 'cardigan' | 'tracksuit';
  headphoneStyle?: 'none' | 'neck' | 'on_ears';
}

export interface SubjectProgress {
  id: string;
  name: string;
  field: 'TYT' | 'AYT';
  mastery: number; // 0 - 100%
  completedQuestions: number;
  category: 'Matematik' | 'Türkçe' | 'Fen' | 'Sosyal' | 'Edebiyat';
}

export interface UpgradeItem {
  id: string;
  name: string;
  category: 'ROOM' | 'BOOKS' | 'COACHING' | 'WELLNESS';
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  description: string;
  icon: string;
  benefitText: string;
  passiveBpPerSec?: number;
  stressReductionRate?: number;
  energySaverPercent?: number;
  passiveMoneyPerDay?: number;
}

export interface ExamRecord {
  id: string;
  name: string;
  dateStr: string;
  day: number;
  type: 'BRANS' | 'KURUMSAL_TYT' | 'KURUMSAL_AYT' | 'MOCK_SIMULATION';
  tytScore?: {
    turkce: number;
    matematik: number;
    fen: number;
    sosyal: number;
    total: number;
  };
  aytScore?: {
    ders1: number;
    ders2: number;
    total: number;
  };
  estimatedRank: number;
  isRecordScore: boolean;
  simulationDetails?: {
    rounds: {
      roundIndex: number;
      name: string;
      fatigueLevel: number;
      scoreNet: number;
      energySpent: number;
      actionTaken: string;
    }[];
    overallScore: number;
    enduranceBonus: number;
  };
}

export interface SocialComment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorBadge?: 'DERECE' | 'MEZUN' | 'HOCA' | 'SEN';
  authorAvatar?: string;
  authorAvatarBg?: string;
  authorAvatarIcon?: string;
  content: string;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
}

export interface SocialPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface SocialStory {
  id: string;
  authorId: string; // e.g. 'char_zehra', 'char_berat', 'mert_hoca', 'eyup_b', 'user'
  authorName: string;
  authorHandle: string;
  authorBadge: 'DERECE' | 'MEZUN' | 'HOCA' | 'MIZAH' | 'SEN';
  avatarIcon: string;
  avatarBg?: string;
  avatarImage?: string;
  imageUrl?: string;
  textOverlay?: string;
  storyTag: string; // e.g. '🔥 Taktik', '☕ Mola', '🤖 Badem & AI', '⚡ Kamp'
  timeAgo: string;
  isViewed?: boolean;
  likesCount?: number;
  userLiked?: boolean;
}

export interface SocialPost {
  id: string;
  authorId?: string; // id to link with characters or teachers for follow/unfollow
  authorName: string;
  authorHandle: string;
  avatarIcon: string;
  avatarBg?: string;
  avatarImage?: string;
  imageUrl?: string; // High quality visuals for post
  authorBadge: 'DERECE' | 'MEZUN' | 'HOCA' | 'MIZAH' | 'SEN';
  isVerified?: boolean;
  content: string;
  likes: number;
  commentsCount: number;
  userLiked: boolean;
  userSaved?: boolean;
  timeAgo: string;
  impactType: 'MORALE_UP' | 'STRESS_UP' | 'MOTIVATION_SURGE' | 'NEUTRAL';
  stressDelta: number;
  moraleDelta: number;
  postCategory: 'meme' | 'studygram' | 'exam_react' | 'advice';
  tag?: string;
  bpReward?: number;
  hasClaimedReward?: boolean;
  comments?: SocialComment[];
  poll?: {
    question: string;
    options: SocialPollOption[];
    userVotedOptionId?: string;
  };
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  tag: string;
  isYahyaHoca?: boolean;
  characterQuote?: string;
  choices: {
    text: string;
    description: string;
    outcome: {
      energy?: number;
      stress?: number;
      morale?: number;
      money?: number;
      bp?: number;
      mathMasteryBonus?: number;
      aytNetBonus?: number;
      tytNetBonus?: number;
      relationshipGain?: number;
      message: string;
    };
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  badgeName: string;
  description: string;
  icon: string;
  category: 'STUDY' | 'SURVIVAL' | 'EXAM' | 'TYCOON' | 'SPECIAL';
  targetValue: number;
  rewardMoney: number;
  rewardBp: number;
}

export type MusicGenre =
  | 'CLASSICAL' // Mozart Etkisi: Matematik/Geometri kavrama +%40, AYT Net potansiyeli artar
  | 'METAL_ROCK' // Berserk Modu: Soru çözme hızı +%80, 2.5x BP, öfkeyle stres 0 (-%30 Enerji)
  | 'LO_FI' // Stres Kalkanı: Stres artışını %75 engeller, saatlik +5 Moral
  | 'RAP_TRAP' // Sokak Hırsı: BP kazancı +%60, Burnout durumunda bile soru çözebilme
  | 'POP_DANCE' // Flow & Dopamin: Akış Hali eşiğini düşürür, seri soru kombo bonusu
  | 'TURKISH_NOSTALGIA' // Mezun Efkarı: Günlük moral çöküşünü sıfırlar, YKS Gram'da 2.5x Beğeni
  | 'JAZZ_ACOUSTIC' // Kahvehouse: Kahveyle +12 ekstra Enerji, tükenmişliği derhal siler
  | 'PHONK_DRIFT' // Adrenalin & Hız: 2x BP, Pomodoro tamamlama süresi %40 daha hızlı
  | 'ROCK_TRAP' // Geriye dönük uyumluluk takma adı (alias to METAL_ROCK / PHONK)
  | 'POP_ENERGY'; // Geriye dönük uyumluluk takma adı (alias to POP_DANCE)

export interface MusicBuffInfo {
  genre: MusicGenre;
  name: string;
  badge: string;
  icon: string;
  color: string;
  description: string;
  bonusSummary: string;
  sampleTracks: string[];
  theme?: {
    accentColor: string;
    bgGradient: string;
    cardBorder: string;
    glowShadow: string;
    coverPlaceholder: string;
    ambientBgUrl: string;
    tagline: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  artistGenres?: string[];
  albumName?: string;
  albumArt?: string;
  durationMs: number;
  progressMs: number;
  spotifyUrl?: string;
  detectedGenre?: MusicGenre;
}

export interface CharacterInteraction {
  id: string;
  name: string;
  role: string;
  nickname: string;
  category?: 'staff' | 'friend';
  avatarIcon: string;
  avatarBg: string;
  color: string;
  badge: string;
  description: string;
  relationshipLevel: number; // 0 - 100 (Dostluk / Samimiyet derecesi)
  relationshipTitle: string; // 'Tanışıklık' | 'Sırdaş' | 'Kader Ortağı' vb.
  perkSummary: string;
  actions: {
    id: string;
    name: string;
    description: string;
    icon: string;
    energyCost: number;
    moneyCost: number;
    cooldownMinutes?: number;
    outcome: {
      stress?: number;
      morale?: number;
      energy?: number;
      bp?: number;
      money?: number;
      mathBonus?: number;
      turkceBonus?: number;
      fenBonus?: number;
      sosyalBonus?: number;
      relationshipGain: number;
      message: string;
    };
  }[];
}

export type ColorThemeMode = 'DARK' | 'LIGHT' | 'SYSTEM';

export interface GameSaveState {
  version: number;
  day: number;
  daysRemaining: number;
  timeOfDay: TimeOfDay;
  energy: number; // 0 - 100
  stress: number; // 0 - 100
  morale: number; // 0 - 100
  focus: number; // 0 - 100
  money: number; // ₺
  bp: number; // Bilgi Puanı (Tycoon resource)
  totalQuestionsSolved: number;
  streakDays: number;
  coffeeDrunkCount: number;
  breathingCount: number;
  yahyaEncounterCount: number;
  activeMusicGenre?: MusicGenre;
  isBurnout: boolean;
  isFlowState: boolean;
  character: CharacterCustomization;
  targetGoal: UniversityGoal;
  upgrades: Record<string, number>; // id -> level
  subjects: SubjectProgress[];
  examHistory: ExamRecord[];
  socialPosts: SocialPost[];
  achievements: Record<string, { unlocked: boolean; claimed: boolean; unlockedAtDay?: number }>;
  currentTytEstimate: number;
  currentAytEstimate: number;
  currentRankEstimate: number;
  soundEnabled: boolean;
  disableYahyaEvents?: boolean; // Oyuncu Yahya Hoca olaylarını görmezden gelmek isterse
  difficulty?: GameDifficulty; // Oyun zorluk derecesi (CASUAL, BALANCED, HARDCORE, SPEEDRUN)
  characterRelationships?: Record<string, number>; // characterId -> relationshipLevel (0-100)
  colorTheme?: ColorThemeMode; // 'DARK' | 'LIGHT' | 'SYSTEM'
  socialFollowing?: string[]; // authorIds or handles the user follows (e.g. ['eyup_b', 'char_zehra'])
  socialFollowersCount?: number; // how many students follow the player
  socialStories?: SocialStory[]; // stories feed
}
