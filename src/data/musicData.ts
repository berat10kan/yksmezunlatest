import { MusicBuffInfo, MusicGenre } from '../types/game';

export const MUSIC_BUFFS: Record<MusicGenre, MusicBuffInfo> = {
  CLASSICAL: {
    genre: 'CLASSICAL',
    name: 'Klasik & Enstrümantal',
    badge: 'Mozart Etkisi',
    icon: 'Sparkles',
    color: 'from-purple-950/60 via-indigo-950/40 to-slate-950 text-purple-300 border-purple-500/40',
    description: 'Polifonik klasik melodiler iki beyin yarım küresini senkronize ederek matematiksel soyut düşünceyi zirveye taşır.',
    bonusSummary: 'TYT & AYT Matematik konu kavrama hızını %40 artırır, Yahya Hoca etkinliklerinde şansı yükseltir.',
    sampleTracks: ['Mozart - Sonata No. 16 in C Major', 'Chopin - Nocturne Op. 9 No. 2', 'Beethoven - Moonlight Sonata'],
    theme: {
      accentColor: '#c084fc',
      bgGradient: 'from-slate-950 via-purple-950/70 to-indigo-950/60',
      cardBorder: 'border-purple-500/50',
      glowShadow: 'shadow-[0_0_35px_rgba(168,85,247,0.25)]',
      coverPlaceholder: 'from-purple-900/60 to-indigo-900/80',
      ambientBgUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80',
      tagline: 'Viyana Senfonisi • Derin Odak & Zarafet',
    },
  },
  METAL_ROCK: {
    genre: 'METAL_ROCK',
    name: 'Heavy Metal & Hard Rock',
    badge: 'Berserk Modu',
    icon: 'Zap',
    color: 'from-rose-950/80 via-red-950/60 to-black text-rose-400 border-rose-600/50',
    description: 'Aşırı distorsiyonlu gitarlar ve çift kros davullar içindeki tüm sınav stresini saf bir soru çözme öfkesine dönüştürür!',
    bonusSummary: 'Soru başına 2.5x Bilgi Puanı (BP) ve %80 hız. Soru çözerken stres artışı sıfırlanır (Enerji tüketimi %30 artar).',
    sampleTracks: ['Metallica - Master of Puppets', 'Slipknot - Duality', 'Pentagram - Bir'],
    theme: {
      accentColor: '#f43f5e',
      bgGradient: 'from-black via-zinc-950 to-red-950/80',
      cardBorder: 'border-rose-600/60',
      glowShadow: 'shadow-[0_0_35px_rgba(225,29,72,0.35)]',
      coverPlaceholder: 'from-red-950 to-zinc-900',
      ambientBgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      tagline: 'Karanlık Sahne • Sınavı Parçalayan Distorsiyon',
    },
  },
  LO_FI: {
    genre: 'LO_FI',
    name: 'Lo-Fi & Chillhop',
    badge: 'Stres Kalkanı',
    icon: 'Headphones',
    color: 'from-teal-950/60 via-emerald-950/40 to-slate-950 text-emerald-300 border-emerald-500/40',
    description: 'Düşük tempolu lo-fi beatleri kalp atışını dengeler, sınav kaygısını nötralize eder ve zihni dinlendirir.',
    bonusSummary: 'Stres birikimini %75 oranında durdurur, her saat başı +5 Moral kazandırır.',
    sampleTracks: ['Lofi Girl - Study Beats', 'ChilledCow - Rainy Night', 'Kudasaibeats - The Girl I Haven\'t Met'],
    theme: {
      accentColor: '#34d399',
      bgGradient: 'from-slate-950 via-teal-950/60 to-emerald-950/50',
      cardBorder: 'border-emerald-500/40',
      glowShadow: 'shadow-[0_0_35px_rgba(16,185,129,0.22)]',
      coverPlaceholder: 'from-emerald-900/50 to-teal-900/60',
      ambientBgUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
      tagline: 'Yağmurlu Pencere • Pastel Huzur & Yumuşak Beatler',
    },
  },
  RAP_TRAP: {
    genre: 'RAP_TRAP',
    name: 'Türkçe Rap, Trap & Drill',
    badge: 'Sokak Hırsı',
    icon: 'Flame',
    color: 'from-amber-950/70 via-orange-950/50 to-black text-amber-300 border-amber-500/40',
    description: 'Ağır basslar, kafiye ve sokak hırsı: "Bu sınavı kazanmak zorundayım" motivasyonunu iliklerine kadar hissettirir.',
    bonusSummary: 'Soru başına +%60 Bilgi Puanı (BP). Tükenmişlik (Burnout) durumunda bile soru çözme cezası kalkar!',
    sampleTracks: ['Ezhel - Geceler', 'Sagopa Kajmer - Galiba', 'Motive - 10MG'],
    theme: {
      accentColor: '#f59e0b',
      bgGradient: 'from-black via-zinc-950 to-amber-950/70',
      cardBorder: 'border-amber-500/50',
      glowShadow: 'shadow-[0_0_35px_rgba(245,158,11,0.28)]',
      coverPlaceholder: 'from-amber-950 to-orange-950',
      ambientBgUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      tagline: 'Gece Lambaları • 808 Baslar & Sokak Motivasyonu',
    },
  },
  POP_DANCE: {
    genre: 'POP_DANCE',
    name: 'Enerjik Pop & Dans',
    badge: 'Yüksek Dopamin',
    icon: 'Sparkles',
    color: 'from-cyan-950/70 via-blue-950/50 to-slate-950 text-cyan-300 border-cyan-400/40',
    description: 'Yüksek ritim ve akılda kalıcı melodiler beynine dopamin pompalar, çalışma masasını dans pistine çevirir.',
    bonusSummary: 'Akış Hali (Flow State) eşiğini düşürür. Arka arkaya hızlı soru çözümlerinde kombo seri bonusu verir.',
    sampleTracks: ['Dua Lipa - Levitating', 'The Weeknd - Blinding Lights', 'Tarkan - Kuzu Kuzu'],
    theme: {
      accentColor: '#22d3ee',
      bgGradient: 'from-slate-950 via-cyan-950/60 to-blue-950/60',
      cardBorder: 'border-cyan-400/50',
      glowShadow: 'shadow-[0_0_35px_rgba(34,211,238,0.25)]',
      coverPlaceholder: 'from-cyan-900/60 to-blue-900/70',
      ambientBgUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      tagline: 'Neon Işıklar • Akış Hali & Sonsuz Dopamin',
    },
  },
  TURKISH_NOSTALGIA: {
    genre: 'TURKISH_NOSTALGIA',
    name: 'Türkçe 90lar & Anadolu Rock',
    badge: 'Mezun Efkarı',
    icon: 'Heart',
    color: 'from-yellow-950/60 via-amber-950/40 to-stone-950 text-amber-200 border-amber-600/40',
    description: 'Barış Manço, Erkin Koray, Duman ve 90\'lar popu ile mezun yalnızlığına asil bir nostalji havası katarsın.',
    bonusSummary: 'Zaman ilerlerken moral çöküşünü tamamen durdurur. YKS Gram paylaşımlarında 2.5x beğeni ve ekstra moral.',
    sampleTracks: ['Barış Manço - Dönence', 'Duman - Haberin Yok Ölüyorum', 'Sezen Aksu - Gülümse'],
    theme: {
      accentColor: '#fbbf24',
      bgGradient: 'from-stone-950 via-amber-950/60 to-yellow-950/40',
      cardBorder: 'border-amber-600/50',
      glowShadow: 'shadow-[0_0_35px_rgba(251,191,36,0.22)]',
      coverPlaceholder: 'from-amber-900/60 to-stone-900',
      ambientBgUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
      tagline: 'Eski Plaklar • Sıcak Kaset Nostaljisi & Çay Efkarı',
    },
  },
  JAZZ_ACOUSTIC: {
    genre: 'JAZZ_ACOUSTIC',
    name: 'Kahvehouse Jazz & Akustik',
    badge: 'Kafein Sinerjisi',
    icon: 'Coffee',
    color: 'from-stone-950 via-amber-950/30 to-yellow-950/40 text-amber-200 border-yellow-700/40',
    description: 'Sıcak akustik tınılar ve caz akorları kahvenin uyarıcı etkisiyle birleşerek yorgunluğu buharlaştırır.',
    bonusSummary: 'Kahve içildiğinde +12 ekstra Enerji verir (+24 Enerji), tükenmişlik (burnout) hissini hemen siler.',
    sampleTracks: ['Bill Evans - Peace Piece', 'Norah Jones - Don\'t Know Why', 'Miles Davis - So What'],
    theme: {
      accentColor: '#fde047',
      bgGradient: 'from-neutral-950 via-stone-900 to-amber-950/60',
      cardBorder: 'border-yellow-600/40',
      glowShadow: 'shadow-[0_0_35px_rgba(234,179,8,0.2)]',
      coverPlaceholder: 'from-yellow-950/70 to-stone-900',
      ambientBgUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      tagline: 'Caz Kafe • Taze Filtre Kahve Kokusu & Sıcak Teller',
    },
  },
  PHONK_DRIFT: {
    genre: 'PHONK_DRIFT',
    name: 'Phonk & Bass Boosted',
    badge: '2x Adrenalin',
    icon: 'Zap',
    color: 'from-purple-950/80 via-violet-950/60 to-black text-violet-300 border-violet-500/50',
    description: 'Distorsiyonlu 808 basları ve cowbell ritimleri soru çözme reflekslerini refleks hızına çıkarır.',
    bonusSummary: 'Soru başına 2x BP kazandırır ve Pomodoro seanslarının dolma süresini %40 hızlandırır.',
    sampleTracks: ['Kordhell - Murder In My Mind', 'DVRST - Close Eyes', 'Hensonn - Sahara'],
    theme: {
      accentColor: '#a855f7',
      bgGradient: 'from-black via-zinc-950 to-violet-950/80',
      cardBorder: 'border-violet-500/60',
      glowShadow: 'shadow-[0_0_35px_rgba(168,85,247,0.35)]',
      coverPlaceholder: 'from-violet-950 to-purple-950',
      ambientBgUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
      tagline: 'Gece Otoyolu • Distorsiyon Cowbell & Saf Adrenalin',
    },
  },
  // Backward compatibility aliases
  ROCK_TRAP: {
    genre: 'METAL_ROCK',
    name: 'Heavy Metal & Hard Rock',
    badge: 'Berserk Modu',
    icon: 'Zap',
    color: 'from-rose-950/80 via-red-950/60 to-black text-rose-400 border-rose-600/50',
    description: 'Aşırı distorsiyonlu gitarlar ve çift kros davullar içindeki tüm sınav stresini saf bir soru çözme öfkesine dönüştürür!',
    bonusSummary: 'Soru başına 2.5x Bilgi Puanı (BP) ve %80 hız. Soru çözerken stres artışı sıfırlanır (Enerji tüketimi %30 artar).',
    sampleTracks: ['Metallica - Master of Puppets', 'Slipknot - Duality', 'Pentagram - Bir'],
    theme: {
      accentColor: '#f43f5e',
      bgGradient: 'from-black via-zinc-950 to-red-950/80',
      cardBorder: 'border-rose-600/60',
      glowShadow: 'shadow-[0_0_35px_rgba(225,29,72,0.35)]',
      coverPlaceholder: 'from-red-950 to-zinc-900',
      ambientBgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      tagline: 'Karanlık Sahne • Sınavı Parçalayan Distorsiyon',
    },
  },
  POP_ENERGY: {
    genre: 'POP_DANCE',
    name: 'Enerjik Pop & Dans',
    badge: 'Yüksek Dopamin',
    icon: 'Sparkles',
    color: 'from-cyan-950/70 via-blue-950/50 to-slate-950 text-cyan-300 border-cyan-400/40',
    description: 'Yüksek ritim ve akılda kalıcı melodiler beynine dopamin pompalar, çalışma masasını dans pistine çevirir.',
    bonusSummary: 'Akış Hali (Flow State) eşiğini düşürür. Arka arkaya hızlı soru çözümlerinde kombo seri bonusu verir.',
    sampleTracks: ['Dua Lipa - Levitating', 'The Weeknd - Blinding Lights', 'Tarkan - Kuzu Kuzu'],
    theme: {
      accentColor: '#22d3ee',
      bgGradient: 'from-slate-950 via-cyan-950/60 to-blue-950/60',
      cardBorder: 'border-cyan-400/50',
      glowShadow: 'shadow-[0_0_35px_rgba(34,211,238,0.25)]',
      coverPlaceholder: 'from-cyan-900/60 to-blue-900/70',
      ambientBgUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      tagline: 'Neon Işıklar • Akış Hali & Sonsuz Dopamin',
    },
  },
};

/**
 * High-accuracy multi-tier genre detector using Spotify Artist Genres + Track/Artist text analysis.
 */
export function detectGenreFromTrack(
  trackName: string,
  artistName: string,
  albumName: string = '',
  artistGenres: string[] = []
): MusicGenre {
  const genresText = (artistGenres || []).join(' ').toLowerCase();
  const rawText = `${trackName} ${artistName} ${albumName} ${genresText}`.toLowerCase();

  // Tier 1: Spotify Artist Genres checks (Most precise)
  if (genresText.length > 0) {
    // Metal & Hard Rock
    if (
      genresText.includes('metal') ||
      genresText.includes('deathcore') ||
      genresText.includes('metalcore') ||
      genresText.includes('hard rock') ||
      genresText.includes('thrash') ||
      genresText.includes('grunge') ||
      genresText.includes('punk')
    ) {
      return 'METAL_ROCK';
    }

    // Classical & Instrumental
    if (
      genresText.includes('classical') ||
      genresText.includes('baroque') ||
      genresText.includes('orchestra') ||
      genresText.includes('soundtrack') ||
      genresText.includes('score') ||
      genresText.includes('romantic era') ||
      genresText.includes('early music') ||
      genresText.includes('chamber music')
    ) {
      return 'CLASSICAL';
    }

    // Phonk & Drift
    if (genresText.includes('phonk') || genresText.includes('drift')) {
      return 'PHONK_DRIFT';
    }

    // Rap & Hip-Hop & Drill & Trap
    if (
      genresText.includes('rap') ||
      genresText.includes('hip hop') ||
      genresText.includes('drill') ||
      genresText.includes('trap') ||
      genresText.includes('boom bap')
    ) {
      return 'RAP_TRAP';
    }

    // Turkish 90s & Anadolu Rock
    if (
      genresText.includes('anadolu rock') ||
      genresText.includes('turkish rock') ||
      genresText.includes('arabesk') ||
      genresText.includes('turkish folk') ||
      genresText.includes('turkish modern jazz')
    ) {
      return 'TURKISH_NOSTALGIA';
    }

    // Jazz & Acoustic
    if (
      genresText.includes('jazz') ||
      genresText.includes('blues') ||
      genresText.includes('acoustic') ||
      genresText.includes('folk') ||
      genresText.includes('bossa nova') ||
      genresText.includes('coffee')
    ) {
      return 'JAZZ_ACOUSTIC';
    }

    // Lo-Fi & Chill
    if (
      genresText.includes('lo-fi') ||
      genresText.includes('lofi') ||
      genresText.includes('chillhop') ||
      genresText.includes('ambient') ||
      genresText.includes('downtempo')
    ) {
      return 'LO_FI';
    }

    // Pop & Dance
    if (
      genresText.includes('pop') ||
      genresText.includes('dance') ||
      genresText.includes('edm') ||
      genresText.includes('house') ||
      genresText.includes('electro')
    ) {
      return 'POP_DANCE';
    }
  }

  // Tier 2: Specific Artist & Track keyword heuristics

  // 1. Phonk & Bass Boosted
  if (
    rawText.includes('phonk') ||
    rawText.includes('kordhell') ||
    rawText.includes('dvrst') ||
    rawText.includes('hensonn') ||
    rawText.includes('interworld') ||
    rawText.includes('playaphonk') ||
    rawText.includes('bass boosted') ||
    rawText.includes('hardstyle') ||
    rawText.includes('drift')
  ) {
    return 'PHONK_DRIFT';
  }

  // 2. Heavy Metal & Hard Rock
  if (
    rawText.includes('metal') ||
    rawText.includes('metallica') ||
    rawText.includes('slipknot') ||
    rawText.includes('iron maiden') ||
    rawText.includes('rammstein') ||
    rawText.includes('linkin park') ||
    rawText.includes('system of a down') ||
    rawText.includes('soad') ||
    rawText.includes('megadeth') ||
    rawText.includes('avenged sevenfold') ||
    rawText.includes('judas priest') ||
    rawText.includes('gojira') ||
    rawText.includes('ac/dc') ||
    rawText.includes('acdc') ||
    rawText.includes('guns n roses') ||
    rawText.includes('pentagram') ||
    rawText.includes('hayko cepkin') ||
    rawText.includes('kurban') ||
    rawText.includes('black sabbath') ||
    rawText.includes('motorhead') ||
    rawText.includes('pantera')
  ) {
    return 'METAL_ROCK';
  }

  // 3. Classical & Instrumental
  if (
    rawText.includes('mozart') ||
    rawText.includes('chopin') ||
    rawText.includes('beethoven') ||
    rawText.includes('bach') ||
    rawText.includes('vivaldi') ||
    rawText.includes('debussy') ||
    rawText.includes('tchaikovsky') ||
    rawText.includes('rachmaninoff') ||
    rawText.includes('ludovico') ||
    rawText.includes('einaudi') ||
    rawText.includes('hans zimmer') ||
    rawText.includes('max richter') ||
    rawText.includes('fazıl say') ||
    rawText.includes('sonata') ||
    rawText.includes('nocturne') ||
    rawText.includes('symphony') ||
    rawText.includes('concerto') ||
    rawText.includes('prelude') ||
    rawText.includes('piano solo') ||
    rawText.includes('klasik') ||
    rawText.includes('classical')
  ) {
    return 'CLASSICAL';
  }

  // 4. Turkish Rap & Trap & Drill
  if (
    rawText.includes('ezhel') ||
    rawText.includes('sagopa') ||
    rawText.includes('ceza') ||
    rawText.includes('motive') ||
    rawText.includes('şehinşah') ||
    rawText.includes('sehinşah') ||
    rawText.includes('şanışer') ||
    rawText.includes('saniser') ||
    rawText.includes('no.1') ||
    rawText.includes('uzi') ||
    rawText.includes('blok3') ||
    rawText.includes('cakal') ||
    rawText.includes('rekkitz') ||
    rawText.includes('defkhan') ||
    rawText.includes('hidra') ||
    rawText.includes('eminem') ||
    rawText.includes('travis scott') ||
    rawText.includes('kendrick lamar') ||
    rawText.includes('drake') ||
    rawText.includes('tupac') ||
    rawText.includes('drill') ||
    rawText.includes('hip hop') ||
    rawText.includes('rap')
  ) {
    return 'RAP_TRAP';
  }

  // 5. Turkish 90s & Anadolu Rock
  if (
    rawText.includes('barış manço') ||
    rawText.includes('baris manco') ||
    rawText.includes('cem karaca') ||
    rawText.includes('erkin koray') ||
    rawText.includes('sezen aksu') ||
    rawText.includes('duman') ||
    rawText.includes('mor ve ötesi') ||
    rawText.includes('teoman') ||
    rawText.includes('levent yüksel') ||
    rawText.includes('sebnem ferah') ||
    rawText.includes('şebnem ferah') ||
    rawText.includes('manga') ||
    rawText.includes('zeki müren') ||
    rawText.includes('müslüm gürses') ||
    rawText.includes('muslum gurses') ||
    rawText.includes('ahmet kaya') ||
    rawText.includes('anadolu rock') ||
    rawText.includes('90lar') ||
    rawText.includes('nostalji')
  ) {
    return 'TURKISH_NOSTALGIA';
  }

  // 6. Jazz & Acoustic
  if (
    rawText.includes('jazz') ||
    rawText.includes('acoustic') ||
    rawText.includes('akustik') ||
    rawText.includes('bill evans') ||
    rawText.includes('miles davis') ||
    rawText.includes('coltrane') ||
    rawText.includes('norah jones') ||
    rawText.includes('bülent ortaçgil') ||
    rawText.includes('fikret kızılok') ||
    rawText.includes('yeni türkü') ||
    rawText.includes('coffee') ||
    rawText.includes('unplugged')
  ) {
    return 'JAZZ_ACOUSTIC';
  }

  // 7. Pop & Dance
  if (
    rawText.includes('dua lipa') ||
    rawText.includes('weeknd') ||
    rawText.includes('taylor swift') ||
    rawText.includes('tarkan') ||
    rawText.includes('simge') ||
    rawText.includes('edis') ||
    rawText.includes('mabel matiz') ||
    rawText.includes('gülşen') ||
    rawText.includes('katy perry') ||
    rawText.includes('bruno mars') ||
    rawText.includes('ed sheeran') ||
    rawText.includes('billie eilish') ||
    rawText.includes('pop') ||
    rawText.includes('dance') ||
    rawText.includes('disco') ||
    rawText.includes('remix')
  ) {
    return 'POP_DANCE';
  }

  // Default fallback to LO_FI study beats
  return 'LO_FI';
}
