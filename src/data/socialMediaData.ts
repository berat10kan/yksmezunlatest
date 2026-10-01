import { SocialStory, SocialPost } from '../types/game';
import { ASSET_IMAGES } from './assetImages';

// YouTube Hocaları ve Kütüphane Dostlarının Gerçekçi Fotoğrafları & Avatarları
export const SOCIAL_AVATARS: Record<string, string> = {
  // YouTube Hocaları Görselleri / Logoları
  eyup_b: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  mert_hoca: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  rehber_mat: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  vip_fizik: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  gorukle_kimya: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  dr_biyoloji: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
  rustu_hoca: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  yahya_hoca: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',

  // Kütüphane Dostları
  char_zehra: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  char_arife: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  char_turkan_abla: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
  char_bilge: ASSET_IMAGES.avatarGlassesStudy,
  char_melek: ASSET_IMAGES.avatarCozyGirl,
  char_beytullah: ASSET_IMAGES.avatarMaleGlasses,
  char_kerim: ASSET_IMAGES.avatarMaleNightOwl,
  char_ugur: ASSET_IMAGES.avatarMaleStudent,
  char_tahir: ASSET_IMAGES.avatarMaleCoffee,
  char_elif: ASSET_IMAGES.avatarFemaleGlasses,
  char_berat: ASSET_IMAGES.avatarCoffeeMaster,
};

// Gerçekçi YouTube Video & Post Kapak Görselleri
export const SOCIAL_POST_IMAGES = {
  eyupTurevSoru: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80', // Geometri & Formül
  mertHocaKamp: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80', // Çalışma masası & Kamp
  rehberMatSazan: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', // Kitaplar & Notlar
  vipFizikManyetizma: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80', // Fizik & Laboratuvar
  beratBademAi: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80', // Kod & Badem & Laptop
  kutuphaneMasasi: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', // Kütüphane Kitaplıkları
  geceKahvesi: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80', // Kahve & Notlar
  biyolojiNotlari: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80', // Biyoloji & Mikroskop
  kokorecZiyafet: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80', // Sokak Lezzeti & Çorba
};

// Başlangıç Hikayeleri (Instagram / YKSGram Stories)
export const INITIAL_STORIES: SocialStory[] = [
  {
    id: 'story_eyup_b',
    authorId: 'eyup_b',
    authorName: 'Eyüp B.',
    authorHandle: '@eyup_b_mat',
    authorBadge: 'HOCA',
    avatarIcon: 'GraduationCap',
    avatarBg: 'bg-emerald-600',
    avatarImage: SOCIAL_AVATARS.eyup_b,
    imageUrl: SOCIAL_POST_IMAGES.eyupTurevSoru,
    textOverlay: '🔴 Canlı Yayın: 2024 AYT Çıkmış Türev Tuzağı Analizi Başladı! Kağıt kalemi hazırla.',
    storyTag: '🎯 Soru Analizi',
    timeAgo: '15 dk önce',
    likesCount: 1420,
    userLiked: false,
  },
  {
    id: 'story_mert_hoca',
    authorId: 'mert_hoca',
    authorName: 'Mert Hoca',
    authorHandle: '@merthoca_mat',
    authorBadge: 'HOCA',
    avatarIcon: 'Flame',
    avatarBg: 'bg-amber-600',
    avatarImage: SOCIAL_AVATARS.mert_hoca,
    imageUrl: SOCIAL_POST_IMAGES.mertHocaKamp,
    textOverlay: 'Gözler tahtada mı gençler? 70 günde kampın en kritik ödevi yüklendi!',
    storyTag: '🔥 70 Gün Kamp',
    timeAgo: '45 dk önce',
    likesCount: 2310,
    userLiked: false,
  },
  {
    id: 'story_berat',
    authorId: 'char_berat',
    authorName: 'Berat',
    authorHandle: '@berat_05x_donanim',
    authorBadge: 'DERECE',
    avatarIcon: 'Cpu',
    avatarBg: 'bg-cyan-600',
    avatarImage: SOCIAL_AVATARS.char_berat,
    imageUrl: SOCIAL_POST_IMAGES.beratBademAi,
    textOverlay: 'Badem... stoğu... tazelendi... Yapay zekâya... integral... promptu... yazıyoruz...',
    storyTag: '🤖 0.5x & Badem',
    timeAgo: '1 saat önce',
    likesCount: 890,
    userLiked: false,
  },
  {
    id: 'story_zehra',
    authorId: 'char_zehra',
    authorName: 'Zehra Abla',
    authorHandle: '@zehra_abla_favori',
    authorBadge: 'HOCA',
    avatarIcon: 'Crown',
    avatarBg: 'bg-emerald-600',
    avatarImage: SOCIAL_AVATARS.char_zehra,
    imageUrl: SOCIAL_POST_IMAGES.geceKahvesi,
    textOverlay: 'Personel çay ocağında taze nane limon kaynattım evlatlarım, üşüten masama gelsin 🌸☕',
    storyTag: '⭐ Şefkat & Çay',
    timeAgo: '2 saat önce',
    likesCount: 3120,
    userLiked: false,
  },
  {
    id: 'story_melek',
    authorId: 'char_melek',
    authorName: 'Melek',
    authorHandle: '@melek_tercih_gurusu',
    authorBadge: 'DERECE',
    avatarIcon: 'Compass',
    avatarBg: 'bg-rose-500',
    avatarImage: SOCIAL_AVATARS.char_melek,
    imageUrl: SOCIAL_POST_IMAGES.kokorecZiyafet,
    textOverlay: 'Kütüphanede Yahya Hocanın peltek sesine dayanamayıp kokoreçe kaçtım kimler geliyor? 😂🌯',
    storyTag: '🥖 Gece Kokoreç',
    timeAgo: '3 saat önce',
    likesCount: 1640,
    userLiked: false,
  },
  {
    id: 'story_beytullah',
    authorId: 'char_beytullah',
    authorName: 'Beytullah',
    authorHandle: '@beytullah_plan_biyo',
    authorBadge: 'DERECE',
    avatarIcon: 'ClipboardList',
    avatarBg: 'bg-indigo-600',
    avatarImage: SOCIAL_AVATARS.char_beytullah,
    imageUrl: SOCIAL_POST_IMAGES.biyolojiNotlari,
    textOverlay: 'Fotosentez Calvin Döngüsü tek sayfada! 2. salon arka masada fotokopisi hazır 🧬',
    storyTag: '📋 Not Paylaşımı',
    timeAgo: '4 saat önce',
    likesCount: 1980,
    userLiked: false,
  },
];
