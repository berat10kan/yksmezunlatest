import React, { useState, useMemo } from 'react';
import {
  User,
  GraduationCap,
  Sparkles,
  Target,
  Flame,
  Award,
  BookOpen,
  Check,
  TrendingUp,
  MapPin,
  Palette,
  Shield,
  Trophy,
  Search,
  PlusCircle,
  Building2,
  SlidersHorizontal,
  X,
  Bot,
  Loader2,
  Wand2,
  Compass,
  Gauge,
  Sliders,
  Feather,
  Scale,
  Zap,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import {
  CharacterCustomization,
  ColorThemeMode,
  ExamField,
  GameDifficulty,
  GameSaveState,
  UniversityGoal,
} from '../../types/game';
import {
  ASSET_IMAGES,
  CHARACTER_TRAITS,
  ACHIEVEMENTS_LIST,
  AVATAR_PRESETS,
  ROOM_THEME_OPTIONS,
  DESK_ACCESSORIES,
  ROOM_LIGHTING_OPTIONS,
  WALL_POSTERS,
  HAIRSTYLE_OPTIONS,
  HAIR_COLORS,
  EYEWEAR_OPTIONS,
  EXPRESSION_OPTIONS,
  CLOTHING_OPTIONS,
  DIFFICULTY_CONFIGS,
} from '../../data/initialData';
import {
  YOK_ATLAS_DATABASE,
  POPULAR_UNIVERSITIES,
  POPULAR_MAJORS_BY_FIELD,
  estimateYokAtlasNets,
} from '../../data/yokAtlasData';
import { estimateGoalIntelligently } from '../../utils/intelligentEstimator';
import { sounds } from '../../utils/audio';
import { getBackendBaseUrl } from '../../utils/backendConfig';
import { AchievementsView } from './AchievementsView';

interface CharacterTargetViewProps {
  state: GameSaveState;
  onUpdateCharacter: (updated: Partial<CharacterCustomization>) => void;
  onSelectGoal: (goal: UniversityGoal) => void;
  onClaimReward: (achievementId: string) => void;
  onToggleIgnoreYahya?: (ignored: boolean) => void;
  onSetDifficulty?: (difficulty: GameDifficulty) => void;
  onSetColorTheme?: (mode: ColorThemeMode) => void;
}

export const CharacterTargetView: React.FC<CharacterTargetViewProps> = ({
  state,
  onUpdateCharacter,
  onSelectGoal,
  onClaimReward,
  onToggleIgnoreYahya,
  onSetDifficulty,
  onSetColorTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'GOAL' | 'CHARACTER' | 'ACHIEVEMENTS' | 'STATS'>('GOAL');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<'ALL' | 'SAY' | 'EA' | 'SOZ' | 'DIL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // Custom University Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customUniName, setCustomUniName] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [customCity, setCustomCity] = useState('İstanbul');
  const [customField, setCustomField] = useState<ExamField>('SAY');
  const [customRank, setCustomRank] = useState<number>(15000);
  const [customTytNet, setCustomTytNet] = useState<number>(95);
  const [customAytNet, setCustomAytNet] = useState<number>(65);
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [aiMotivationTip, setAiMotivationTip] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState(state.character.name);
  const [nicknameInput, setNicknameInput] = useState(state.character.nickname);
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>((state.character.gender as any) || 'all');
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState<CharacterCustomization['avatarStyle']>(state.character.avatarStyle || 'male_hoodie_boy');
  const [selectedAvatarImage, setSelectedAvatarImage] = useState(state.character.avatarImage || ASSET_IMAGES.avatarMaleStudent);
  const [selectedHairstyle, setSelectedHairstyle] = useState(state.character.hairstyle || 'messy');
  const [selectedHairColor, setSelectedHairColor] = useState(state.character.hairColor || '#38220f');
  const [selectedEyewear, setSelectedEyewear] = useState(state.character.eyewear || 'none');
  const [selectedExpression, setSelectedExpression] = useState(state.character.expression || 'focused');
  const [selectedClothing, setSelectedClothing] = useState(state.character.clothingStyle || 'hoodie');
  const [selectedTrait, setSelectedTrait] = useState(state.character.traitId);
  const [selectedHoodieColor, setSelectedHoodieColor] = useState(state.character.hoodieColor || '#3b82f6');
  const [selectedRoomTheme, setSelectedRoomTheme] = useState<NonNullable<CharacterCustomization['roomTheme']>>(state.character.roomTheme || 'warm_wood');
  const [selectedAccessory, setSelectedAccessory] = useState<NonNullable<CharacterCustomization['deskAccessory']>>(state.character.deskAccessory || 'sand_timer');
  const [selectedLighting, setSelectedLighting] = useState<NonNullable<CharacterCustomization['roomLighting']>>(state.character.roomLighting || 'warm_amber');
  const [selectedPoster, setSelectedPoster] = useState<NonNullable<CharacterCustomization['wallPoster']>>(state.character.wallPoster || 'osym_countdown');
  const [mottoInput, setMottoInput] = useState(state.character.mottoText || 'Bu sene o sene!');
  const [customSubTab, setCustomSubTab] = useState<'AVATAR' | 'ROOM_DECOR'>('AVATAR');

  // Cities extracted from database for filter dropdown
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    YOK_ATLAS_DATABASE.forEach(g => cities.add(g.city));
    return Array.from(cities).sort();
  }, []);

  // Filtered Goals based on field, search query, and city
  const filteredGoals = useMemo(() => {
    return YOK_ATLAS_DATABASE.filter(g => {
      const matchesField = selectedFieldFilter === 'ALL' || g.field === selectedFieldFilter;
      const matchesCity = selectedCityFilter === 'ALL' || g.city === selectedCityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        g.name.toLowerCase().includes(q) ||
        g.major.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q) ||
        (g.faculty && g.faculty.toLowerCase().includes(q));
      return matchesField && matchesCity && matchesSearch;
    });
  }, [selectedFieldFilter, selectedCityFilter, searchQuery]);

  // AI Automatic Goal Estimator using Gemini API
  const handleAiAutoEstimate = async () => {
    if (!customUniName.trim() && !customMajor.trim()) {
      setAiError('Lütfen önce bir üniversite veya bölüm adı yazın.');
      return;
    }

    setIsAiEstimating(true);
    setAiError(null);
    sounds.playTap();

    try {
      const baseUrl = getBackendBaseUrl();
      let resData: any = null;

      try {
        const res = await fetch(`${baseUrl}/api/ai/estimate-goal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            university: customUniName.trim(),
            major: customMajor.trim(),
            city: customCity.trim(),
          }),
        });

        if (res.ok) {
          resData = await res.json();
        }
      } catch (networkErr) {
        // network issue or offline, continue to local intelligent fallback
      }

      // If backend returned valid AI estimation, use it!
      if (resData && resData.success && resData.data && resData.data.targetRank) {
        const d = resData.data;
        if (d.university && !customUniName.trim()) setCustomUniName(d.university);
        if (d.major && !customMajor.trim()) setCustomMajor(d.major);
        if (d.city) setCustomCity(d.city);
        if (d.field) setCustomField(d.field);
        if (d.targetRank) setCustomRank(Math.round(Number(d.targetRank)));
        if (d.requiredTytNet) setCustomTytNet(Number(d.requiredTytNet));
        if (d.requiredAytNet) setCustomAytNet(Number(d.requiredAytNet));
        if (d.motivationTip) setAiMotivationTip(d.motivationTip);
        sounds.playSuccess();
      } else {
        // Always seamlessly fallback to client-side intelligent YÖK Atlas estimator!
        const localData = estimateGoalIntelligently(customUniName.trim(), customMajor.trim(), customCity.trim());
        if (localData.university && !customUniName.trim()) setCustomUniName(localData.university);
        if (localData.major && !customMajor.trim()) setCustomMajor(localData.major);
        if (localData.city) setCustomCity(localData.city);
        if (localData.field) setCustomField(localData.field);
        setCustomRank(localData.targetRank);
        setCustomTytNet(localData.requiredTytNet);
        setCustomAytNet(localData.requiredAytNet);
        setAiMotivationTip(localData.motivationTip);
        sounds.playSuccess();
      }
    } catch (err: any) {
      // Guaranteed fallback
      const localData = estimateGoalIntelligently(customUniName.trim(), customMajor.trim(), customCity.trim());
      setCustomField(localData.field);
      setCustomRank(localData.targetRank);
      setCustomTytNet(localData.requiredTytNet);
      setCustomAytNet(localData.requiredAytNet);
      setAiMotivationTip(localData.motivationTip);
      sounds.playSuccess();
    } finally {
      setIsAiEstimating(false);
    }
  };

  const handleCreateCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUniName.trim() || !customMajor.trim()) return;

    const rank = Number(customRank) || 15000;
    const estimated = estimateYokAtlasNets(customField, rank);
    const finalTyt = customTytNet || estimated.tyt;
    const finalAyt = customAytNet || estimated.ayt;

    const newGoal: UniversityGoal = {
      id: `custom_${Date.now()}`,
      name: customUniName.trim(),
      city: customCity.trim() || 'Türkiye',
      major: customMajor.trim(),
      field: customField,
      targetRank: rank,
      requiredTytNet: finalTyt,
      requiredAytNet: finalAyt,
      logoColor: customField === 'SAY' ? '#0284c7' : customField === 'EA' ? '#dc2626' : customField === 'SOZ' ? '#d97706' : '#7c3aed',
      description: aiMotivationTip
        ? `🤖 Yapay Zeka Koçluğu: ${aiMotivationTip}`
        : `YÖK Atlas Net Tahmini: Taban sıralaması #${rank.toLocaleString('tr-TR')} baz alınarak hesaplandı.`,
      isCustom: true,
    };

    sounds.playSuccess();
    onSelectGoal(newGoal);
    setIsCustomModalOpen(false);
    setCustomUniName('');
    setCustomMajor('');
    setAiMotivationTip(null);
    setAiError(null);
  };

  const pendingRewardsCount = ACHIEVEMENTS_LIST.filter(a => {
    const s = state.achievements?.[a.id];
    return s?.unlocked && !s?.claimed;
  }).length;

  const hoodieColors = [
    { name: 'Okyanus Mavisi', val: '#3b82f6' },
    { name: 'Zümrüt Yeşili', val: '#10b981' },
    { name: 'Gece Moru', val: '#8b5cf6' },
    { name: 'Alev Kırmızısı', val: '#ef4444' },
    { name: 'Amber Sarısı', val: '#f59e0b' },
    { name: 'Kömür Grisi', val: '#475569' },
  ];

  const handleSaveCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    onUpdateCharacter({
      name: nameInput.trim() || 'Mezun Öğrenci',
      nickname: nicknameInput.trim() || 'Derece Avcısı',
      gender: selectedGender === 'female' ? 'female' : 'male',
      avatarStyle: selectedAvatarStyle as any,
      avatarImage: selectedAvatarImage,
      hairstyle: selectedHairstyle as any,
      hairColor: selectedHairColor,
      eyewear: selectedEyewear as any,
      expression: selectedExpression as any,
      clothingStyle: selectedClothing as any,
      traitId: selectedTrait,
      hoodieColor: selectedHoodieColor,
      roomTheme: selectedRoomTheme as any,
      deskAccessory: selectedAccessory as any,
      roomLighting: selectedLighting as any,
      wallPoster: selectedPoster as any,
      mottoText: mottoInput.trim() || 'Bu sene o sene!',
    });
  };

  const getRankDelta = () => {
    const diff = state.currentRankEstimate - state.targetGoal.targetRank;
    if (diff <= 0) return 'Hedef Sıralama İçindesin! 🎯';
    return `Hedefe Kalan: +${diff.toLocaleString('tr-TR')} Sıralama`;
  };

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Switcher Header */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('GOAL');
          }}
          className={`flex-1 min-w-[75px] py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'GOAL' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Hedef</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('CHARACTER');
          }}
          className={`flex-1 min-w-[90px] py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'CHARACTER' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Karakter & Oda</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('ACHIEVEMENTS');
          }}
          className={`flex-1 min-w-[85px] py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 relative ${
            activeTab === 'ACHIEVEMENTS' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Rozetler</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setActiveTab('STATS');
          }}
          className={`flex-1 min-w-[75px] py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'STATS' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>İstatistik</span>
        </button>
      </div>

      {activeTab === 'GOAL' && (
        <div className="space-y-3">
          {/* Current Target Hero Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
            <img
              src={ASSET_IMAGES.universityCampus}
              alt="Kampüs"
              referrerPolicy="no-referrer"
              className="w-full h-36 object-cover object-center brightness-90 filter"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>Şu Anki Hayalin</span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {state.targetGoal.name}
                </h3>
                <p className="text-xs text-sky-300 font-medium">
                  {state.targetGoal.major} ({state.targetGoal.field})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400">Hedef Sıralama</span>
                <div className="text-xs font-bold font-mono text-amber-400">
                  İlk #{state.targetGoal.targetRank.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </div>

          {/* Goal Comparison Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">Gereken vs Mevcut Netler</span>
              <span className="text-[11px] font-mono font-medium text-emerald-400">{getRankDelta()}</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">TYT Net Durumu:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {state.currentTytEstimate.toFixed(1)} / {state.targetGoal.requiredTytNet} Net
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (state.currentTytEstimate / state.targetGoal.requiredTytNet) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">AYT Net Durumu:</span>
                  <span className="font-mono font-bold text-purple-400">
                    {state.currentAytEstimate.toFixed(1)} / {state.targetGoal.requiredAytNet} Net
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (state.currentAytEstimate / state.targetGoal.requiredAytNet) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Game Difficulty & Prep Speed Settings Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  YKS Hazırlık Zorluğu & Hız Dengesi
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {state.difficulty || 'BALANCED'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              Oyun temposunu kendi deneyimine göre ayarla. Soru çözme net artış hızını, masraf katsayılarını ve stres oranlarını anında dengeler.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DIFFICULTY_CONFIGS) as GameDifficulty[]).map(diffKey => {
                const cfg = DIFFICULTY_CONFIGS[diffKey];
                const isSelected = (state.difficulty || 'BALANCED') === diffKey;

                return (
                  <button
                    key={diffKey}
                    type="button"
                    onClick={() => {
                      if (onSetDifficulty) {
                        onSetDifficulty(diffKey);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-slate-850 shadow-md ring-1'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isSelected ? cfg.color : undefined,
                      boxShadow: isSelected ? `0 0 0 1px ${cfg.color}` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {diffKey === 'CASUAL' && <Feather className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {diffKey === 'BALANCED' && <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        {diffKey === 'HARDCORE' && <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        {diffKey === 'SPEEDRUN' && <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        <span className="text-xs font-bold text-white truncate">{cfg.name}</span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                      {cfg.tagline}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60 text-[9px] font-mono">
                      <span className="text-sky-300">
                        Hız: {cfg.studySpeedMultiplier}x
                      </span>
                      <span>·</span>
                      <span className="text-amber-300">
                        Fiyat: {cfg.costMultiplier}x
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected Difficulty Breakdown */}
            {DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'] && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-white">
                    Seçili Mod: {DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'].name}
                  </span>
                  <span
                    className="font-bold px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      backgroundColor: `${DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'].color}20`,
                      color: DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'].color,
                    }}
                  >
                    {DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'].badge}
                  </span>
                </div>
                <p className="text-slate-400">
                  {DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED'].description}
                </p>
              </div>
            )}
          </div>

          {/* University Picker List with Search, Filters and Custom Goal */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  YÖK Atlas Hedef Veritabanı
                </h3>
                <p className="text-[10px] text-slate-400">
                  {filteredGoals.length} üniversite programı listeleniyor
                </p>
              </div>

              {/* Custom Goal Creator Button */}
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsCustomModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 border border-emerald-400/30"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-200" />
                <span>Yapay Zeka ile Hedef Ekle</span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Üniversite, bölüm veya fakülte ara (örn: İTÜ, Hukuk, Tıp)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Field Filters Pill Row & City Filter */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                {(['ALL', 'SAY', 'EA', 'SOZ', 'DIL'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedFieldFilter(f);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                      selectedFieldFilter === f
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f === 'ALL' ? 'Tümü' : f}
                  </button>
                ))}
              </div>

              {/* City selector dropdown */}
              <select
                value={selectedCityFilter}
                onChange={e => setSelectedCityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 outline-hidden cursor-pointer"
              >
                <option value="ALL">Tüm Şehirler ({availableCities.length})</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Program List */}
            <div className="grid grid-cols-1 gap-2 max-h-[460px] overflow-y-auto pr-0.5 no-scrollbar">
              {filteredGoals.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">Aradığın kriterde üniversite programı bulunamadı.</p>
                  <button
                    onClick={() => {
                      setCustomUniName(searchQuery);
                      setIsCustomModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>"{searchQuery}" Olarak Özel Hedef Ekle</span>
                  </button>
                </div>
              ) : (
                filteredGoals.map(goal => {
                  const isSelected = state.targetGoal.id === goal.id ||
                    (state.targetGoal.name === goal.name && state.targetGoal.major === goal.major);

                  return (
                    <div
                      key={goal.id}
                      onClick={() => {
                        sounds.playSuccess();
                        onSelectGoal(goal);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-400 shadow-sm'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            goal.field === 'SAY' ? 'bg-sky-500/20 text-sky-300' :
                            goal.field === 'EA' ? 'bg-amber-500/20 text-amber-300' :
                            goal.field === 'SOZ' ? 'bg-rose-500/20 text-rose-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {goal.field}
                          </span>

                          <h4 className="text-xs font-bold text-white truncate">{goal.name}</h4>

                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0">
                            <MapPin className="w-2.5 h-2.5" /> {goal.city}
                          </span>

                          {goal.scholarship && (
                            <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 px-1 rounded border border-emerald-500/20">
                              {goal.scholarship}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-200 font-medium mt-0.5 flex items-center gap-2">
                          <span className="truncate">{goal.major}</span>
                          {goal.quota && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                              ({goal.quota} Kontenjan)
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Hedef Sıralama: <strong className="text-amber-400 font-mono">#{goal.targetRank.toLocaleString('tr-TR')}</strong></span>
                          <span>·</span>
                          <span>TYT: <strong className="text-sky-300 font-mono">{goal.requiredTytNet} Net</strong></span>
                          <span>·</span>
                          <span>AYT: <strong className="text-purple-300 font-mono">{goal.requiredAytNet} Net</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 pl-1">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 hover:text-slate-200">Seç</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CHARACTER' && (
        <form onSubmit={handleSaveCharacter} className="space-y-3">
          {/* Sub-tab switcher: Karakter vs Çalışma Odası */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setCustomSubTab('AVATAR');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                customSubTab === 'AVATAR'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Karakter & Kıyafet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setCustomSubTab('ROOM_DECOR');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                customSubTab === 'ROOM_DECOR'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Çalışma Odası Dekoru</span>
            </button>
          </div>

          {/* ================= KARAKTER SEKMESİ ================= */}
          {customSubTab === 'AVATAR' && (
            <div className="space-y-3">
              {/* Avatar Live Preview Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-lg shrink-0 relative bg-slate-950"
                  style={{ borderColor: selectedHoodieColor }}
                >
                  <img
                    src={selectedAvatarImage}
                    alt="Karakter Önizleme"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate">{nameInput || 'Mezun'}</h3>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                      {nicknameInput || 'Derece Avcısı'}
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-300 italic mt-0.5 truncate">
                    "{mottoInput || 'Bu sene o sene!'}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Karakterin odanda ve sosyal medyada bu görünümle temsil edilir.
                  </p>
                </div>
              </div>

              {/* Gender Filter Buttons & Archetype Picker */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Karakter Cinsiyeti & Arketip:
                  </label>
                  {/* Male / Female / All Filter */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedGender('all');
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        selectedGender === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tümü ({AVATAR_PRESETS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedGender('male');
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        selectedGender === 'male' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👨 Erkek ({AVATAR_PRESETS.filter(p => p.gender === 'male').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedGender('female');
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        selectedGender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👩 Kız ({AVATAR_PRESETS.filter(p => p.gender === 'female').length})
                    </button>
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5 no-scrollbar">
                  {AVATAR_PRESETS.filter(p => selectedGender === 'all' || p.gender === selectedGender).map(preset => {
                    const isSelected = selectedAvatarStyle === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedAvatarStyle(preset.id as any);
                          setSelectedAvatarImage(preset.image);
                          if (preset.defaultHair) setSelectedHairstyle(preset.defaultHair);
                          if (preset.defaultEyewear) setSelectedEyewear(preset.defaultEyewear);
                          if (preset.defaultClothing) setSelectedClothing(preset.defaultClothing);
                        }}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 shadow-xs ring-1 ring-sky-400/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-700 relative">
                          <img
                            src={preset.image}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-0 right-0 text-[9px] px-1 bg-black/70 rounded-bl text-slate-300 font-bold">
                            {preset.gender === 'male' ? '♂' : '♀'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
                          <div className="text-[9px] text-sky-300 font-medium truncate">{preset.roleTag}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Modular Character Builder Attributes */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dinamik Karakter Özellikleri (Modüler)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Canlı Değişkenler</span>
                </div>

                {/* Hairstyle Selector */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Saç Modeli:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {HAIRSTYLE_OPTIONS.map(hair => (
                      <button
                        key={hair.id}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedHairstyle(hair.id as any);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all border cursor-pointer truncate ${
                          selectedHairstyle === hair.id
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {hair.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color Picker */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Saç Rengi:
                  </label>
                  <div className="flex items-center gap-2">
                    {HAIR_COLORS.map(color => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedHairColor(color.hex);
                        }}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                          selectedHairColor === color.hex ? 'scale-125 ring-2 ring-amber-400 shadow-md' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Eyewear & Glasses */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Gözlük / Aksesuar:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {EYEWEAR_OPTIONS.map(eye => (
                      <button
                        key={eye.id}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedEyewear(eye.id as any);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all border cursor-pointer truncate ${
                          selectedEyewear === eye.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {eye.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expression / Mood */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Yüz İfadesi & Ruh Hali:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {EXPRESSION_OPTIONS.map(exp => (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedExpression(exp.id as any);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all border cursor-pointer truncate ${
                          selectedExpression === exp.id
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{exp.icon}</span>
                        <span className="truncate">{exp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clothing Style */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Kıyafet Tarzı:
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {CLOTHING_OPTIONS.map(cloth => (
                      <button
                        key={cloth.id}
                        type="button"
                        onClick={() => {
                          sounds.playTap();
                          setSelectedClothing(cloth.id as any);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-left transition-all border cursor-pointer ${
                          selectedClothing === cloth.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cloth.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Nickname inputs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Öğrenci Adı:
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={20}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Lakap / Unvan:
                  </label>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={e => setNicknameInput(e.target.value)}
                    maxLength={24}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    YKS Motivasyon Mottosu:
                  </label>
                  <input
                    type="text"
                    value={mottoInput}
                    onChange={e => setMottoInput(e.target.value)}
                    maxLength={40}
                    placeholder="Örn: 0.5 net için uykusuz kaldım!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 placeholder-slate-600 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Hoodie Color Picker */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <label className="text-[11px] font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kapüşonlu & Kıyafet Rengi:</span>
                </label>
                <div className="flex items-center gap-2">
                  {hoodieColors.map(c => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedHoodieColor(c.val);
                      }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        selectedHoodieColor === c.val ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.val }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Trait Selection */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Karakter Özelliği (Perk):</span>
                </label>

                <div className="space-y-1.5">
                  {CHARACTER_TRAITS.map(t => {
                    const isSelected = selectedTrait === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedTrait(t.id);
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{t.name}</span>
                            <span className="text-[9px] text-indigo-300 bg-indigo-500/20 px-1 rounded">
                              {t.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{t.description}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= ÇALIŞMA ODASI DEKORU SEKMESİ ================= */}
          {customSubTab === 'ROOM_DECOR' && (
            <div className="space-y-3">
              {/* Room Themes with Real Artwork Cards */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Oda Atmosferi & Arka Plan Teması:
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {ROOM_THEME_OPTIONS.map(theme => {
                    const isSelected = selectedRoomTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedRoomTheme(theme.id as any);
                        }}
                        className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                            : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="h-24 w-full relative">
                          <img
                            src={theme.image}
                            alt={theme.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
                            <span className="text-xs font-bold text-white drop-shadow-md">{theme.name}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                                Seçildi
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 bg-slate-950 text-[10px] text-slate-400">
                          {theme.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desk Accessories */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Masa Üstü Uğurlu Aksesuarı:
                </label>

                <div className="grid grid-cols-1 gap-1.5">
                  {DESK_ACCESSORIES.map(acc => {
                    const isSelected = selectedAccessory === acc.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedAccessory(acc.id as any);
                        }}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{acc.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{acc.name}</div>
                            <div className="text-[10px] text-amber-300">{acc.perk}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Lighting / Aura */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Oda Işıklandırma Tonu (Aydınlatma):
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {ROOM_LIGHTING_OPTIONS.map(light => {
                    const isSelected = selectedLighting === light.id;
                    return (
                      <div
                        key={light.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedLighting(light.id as any);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-slate-800 shadow-sm'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                        style={{
                          borderColor: isSelected ? light.borderGlow : undefined,
                        }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: light.borderGlow }}
                        />
                        <span className="text-[11px] font-bold text-slate-200 truncate">
                          {light.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wall Poster Selection */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Duvar Posteri & İlham Kaynağı:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {WALL_POSTERS.map(poster => {
                    const isSelected = selectedPoster === poster.id;
                    return (
                      <div
                        key={poster.id}
                        onClick={() => {
                          sounds.playTap();
                          setSelectedPoster(poster.id as any);
                        }}
                        className={`p-2 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-white truncate">{poster.title}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{poster.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Yahya Hoca Olay Tercihi */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📐 Yahya Hoca & Yeliz Olayları</span>
                    {state.disableYahyaEvents && (
                      <span className="text-[9px] text-rose-300 bg-rose-500/20 px-1.5 rounded border border-rose-500/30">Gizlendi</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Yahya Hoca ve Yeliz ile ilgili mizahi olayları ve sürpriz diyalogları tamamen devre dışı bırakır.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    if (onToggleIgnoreYahya) {
                      onToggleIgnoreYahya(!state.disableYahyaEvents);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    state.disableYahyaEvents
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {state.disableYahyaEvents ? 'Görmezden Gel' : 'Aktif'}
                </button>
              </div>

              {/* Game Difficulty Setting in Character & Room Tab */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>Oyun Zorluğu & Hız Katsayısı</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono"
                    style={{
                      backgroundColor: `${DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.color}20`,
                      borderColor: `${DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.color}40`,
                      color: DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.color,
                    }}
                  >
                    {DIFFICULTY_CONFIGS[state.difficulty || 'BALANCED']?.name}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {(['CASUAL', 'BALANCED', 'HARDCORE', 'SPEEDRUN'] as GameDifficulty[]).map(d => {
                    const cfg = DIFFICULTY_CONFIGS[d];
                    const active = (state.difficulty || 'BALANCED') === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (onSetDifficulty) onSetDifficulty(d);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer border ${
                          active
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        style={{
                          borderColor: active ? cfg.color : undefined,
                        }}
                      >
                        <div>{d === 'CASUAL' ? 'Rahat' : d === 'BALANCED' ? 'Dengeli' : d === 'HARDCORE' ? 'Zorlu' : 'Hızlı'}</div>
                        <div className="text-[8px] text-slate-400 font-mono mt-0.5">{cfg.studySpeedMultiplier}x Hız</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tema Modu Seçimi: Karanlık, Aydınlık, Sistem */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    <span>Görünüm Tema Modu</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {(state.colorTheme || 'DARK') === 'DARK'
                      ? '🌙 Karanlık'
                      : (state.colorTheme || 'DARK') === 'LIGHT'
                      ? '☀️ Aydınlık'
                      : '💻 Sistem'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      if (onSetColorTheme) onSetColorTheme('DARK');
                    }}
                    className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      (state.colorTheme || 'DARK') === 'DARK'
                        ? 'bg-slate-800 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-bold">Karanlık Mod</span>
                    <span className="text-[9px] text-slate-400 leading-none">Gece & Oled dostu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      if (onSetColorTheme) onSetColorTheme('LIGHT');
                    }}
                    className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      state.colorTheme === 'LIGHT'
                        ? 'bg-slate-800 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold">Aydınlık Mod</span>
                    <span className="text-[9px] text-slate-400 leading-none">Gündüz & Ferah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      if (onSetColorTheme) onSetColorTheme('SYSTEM');
                    }}
                    className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      state.colorTheme === 'SYSTEM'
                        ? 'bg-slate-800 border-sky-500 text-white shadow-sm ring-1 ring-sky-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] font-bold">Sistem Teması</span>
                    <span className="text-[9px] text-slate-400 leading-none">Cihaza göre oto</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Karakter ve Oda Değişikliklerini Kaydet
          </button>
        </form>
      )}

      {activeTab === 'ACHIEVEMENTS' && (
        <AchievementsView state={state} onClaimReward={onClaimReward} />
      )}

      {activeTab === 'STATS' && (
        <div className="space-y-2.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-3 text-center">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Çözülen Soru</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {state.totalQuestionsSolved.toLocaleString('tr-TR')}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Çalışma Serisi</span>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-500" />
                {state.streakDays} Gün
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Girilen Deneme</span>
              <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
                {state.examHistory.length} Adet
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400">Tahmini Sıralama</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                #{state.currentRankEstimate.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <h4 className="text-xs font-bold text-white mb-2">YKS Tavsiyesi & Rehberlik Notu</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mezuna kaldığında en büyük rakibin konu eksikleri değil, zihnindeki şüphe ve dalgalanan moraldir.
              Günde istikrarlı 200 soru çözmek, haftada bir kurumsal deneme analiz etmek ve stres seviyesini %60'ın altında tutmak
              seni hayal ettiğin <strong>{state.targetGoal.name}</strong> kapısına götürecektir.
            </p>
          </div>
        </div>
      )}

      {/* Custom University Goal Creator Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative flex flex-col gap-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Yapay Zeka Destekli Özel Hedef
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300">
              İstediğin üniversiteyi ve bölümü yaz. <strong>Yapay zeka (AI)</strong> YÖK Atlas taban sıralamasını, puan türünü ve gereken netleri anında otomatik ayarlasın.
            </p>

            <form onSubmit={handleCreateCustomGoal} className="space-y-2.5">
              {/* University Name */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Üniversite Adı:
                </label>
                <input
                  type="text"
                  required
                  list="popular-universities"
                  value={customUniName}
                  onChange={e => setCustomUniName(e.target.value)}
                  placeholder="Örn: Sabancı Üniversitesi, Koç, ODTÜ, Çukurova..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-sky-500"
                />
                <datalist id="popular-universities">
                  {POPULAR_UNIVERSITIES.map(u => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              {/* Major Name */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Bölüm / Program Adı:
                </label>
                <input
                  type="text"
                  required
                  list="popular-majors"
                  value={customMajor}
                  onChange={e => setCustomMajor(e.target.value)}
                  placeholder="Örn: Yazılım Mühendisliği, Hukuk, Tıp, Mimarlık..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-sky-500"
                />
                <datalist id="popular-majors">
                  {POPULAR_MAJORS_BY_FIELD[customField].map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              {/* AI Auto-Estimate Button */}
              <button
                type="button"
                onClick={handleAiAutoEstimate}
                disabled={isAiEstimating}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                {isAiEstimating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Yapay Zeka YÖK Atlas'ı Tarıyor...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Yapay Zeka ile Otomatik Ayarla (Tek Dokunuş)</span>
                  </>
                )}
              </button>

              {/* AI Motivation Tip or Error */}
              {aiMotivationTip && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 text-[10px] text-emerald-200 flex items-start gap-1.5 animate-in fade-in duration-300">
                  <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{aiMotivationTip}</span>
                </div>
              )}

              {aiError && (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 text-[10px] text-amber-200">
                  {aiError}
                </div>
              )}

              {/* City and Field Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Şehir:
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    placeholder="İstanbul, Ankara, İzmir..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Puan Türü:
                  </label>
                  <select
                    value={customField}
                    onChange={e => setCustomField(e.target.value as ExamField)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                  >
                    <option value="SAY">SAY (Sayısal)</option>
                    <option value="EA">EA (Eşit Ağırlık)</option>
                    <option value="SOZ">SÖZ (Sözel)</option>
                    <option value="DIL">DİL (Yabancı Dil)</option>
                  </select>
                </div>
              </div>

              {/* Target Rank Slider / Input */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">Taban Sıralaması:</span>
                  <span className="font-mono font-bold text-amber-400">
                    #{Number(customRank || 0).toLocaleString('tr-TR')}
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="200000"
                  step="250"
                  value={customRank}
                  onChange={e => setCustomRank(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />

                {/* Estimated Nets Preview */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-400">Gereken Hedef Netler:</span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-sky-300">
                      TYT: {customTytNet || estimateYokAtlasNets(customField, customRank).tyt} Net
                    </span>
                    <span>·</span>
                    <span className="text-purple-300">
                      AYT: {customAytNet || estimateYokAtlasNets(customField, customRank).ayt} Net
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Hedefi Uygula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
