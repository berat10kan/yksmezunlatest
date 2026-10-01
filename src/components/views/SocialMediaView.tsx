import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Send,
  Flame,
  ShieldAlert,
  GraduationCap,
  Coffee,
  BookMarked,
  Sunrise,
  Smile,
  Zap,
  Award,
  CheckCircle2,
  Bookmark,
  TrendingUp,
  BarChart2,
  Youtube,
  Gift,
  Search,
  Cpu,
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Compass,
  Crown,
  HeartHandshake,
  Headphones,
  Gamepad2,
  Scroll,
  PlusCircle,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { GameSaveState, SocialPost, SocialComment, SocialStory } from '../../types/game';
import { YOUTUBE_TEACHERS, YoutubeTeacherProfile } from '../../data/youtubeTeachersData';
import { COMPANION_CHARACTERS } from '../../data/charactersData';
import { SOCIAL_AVATARS, SOCIAL_POST_IMAGES } from '../../data/socialMediaData';
import { sounds } from '../../utils/audio';

interface SocialMediaViewProps {
  state: GameSaveState;
  onLikePost: (postId: string) => void;
  onAddPost: (content: string, category: 'studygram' | 'meme' | 'advice', imageUrl?: string) => void;
  onAddComment?: (postId: string, text: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onClaimPostReward?: (postId: string) => void;
  onToggleSavePost?: (postId: string) => void;
  onToggleFollow?: (authorId: string, authorName: string) => void;
  onAddStory?: (textOverlay: string, storyTag: string, imageUrl?: string) => void;
  onLikeStory?: (storyId: string) => void;
  onToggleDetox: () => void;
  isDetoxActive: boolean;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  state,
  onLikePost,
  onAddPost,
  onAddComment,
  onVotePoll,
  onClaimPostReward,
  onToggleSavePost,
  onToggleFollow,
  onAddStory,
  onLikeStory,
  onToggleDetox,
  isDetoxActive,
}) => {
  const [postText, setPostText] = useState('');
  const [postCategory, setPostCategory] = useState<'studygram' | 'meme' | 'advice'>('studygram');
  const [selectedPostImage, setSelectedPostImage] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FOLLOWING' | 'TEACHERS' | 'FRIENDS' | 'MEME' | 'POLLS' | 'SAVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<YoutubeTeacherProfile | null>(null);

  // Story Viewer Modal State
  const [activeStoryModal, setActiveStoryModal] = useState<SocialStory | null>(null);
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryTag, setNewStoryTag] = useState('🔥 Hedef');
  const [newStoryImage, setNewStoryImage] = useState(SOCIAL_POST_IMAGES.kutuphaneMasasi);

  // Comment expansion states per post
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const followingList = state.socialFollowing || ['eyup_b', 'mert_hoca', 'char_zehra', 'char_berat'];
  const followersCount = state.socialFollowersCount || 142;
  const storiesList = state.socialStories && state.socialStories.length > 0 ? state.socialStories : [];

  const isFollowing = (authorId?: string, handle?: string) => {
    if (!authorId && !handle) return false;
    return followingList.includes(authorId || '') || followingList.includes(handle || '');
  };

  const handleFollowClick = (authorId: string, authorName: string) => {
    sounds.playTap();
    if (onToggleFollow) {
      onToggleFollow(authorId, authorName);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;
    sounds.playSuccess();
    onAddPost(postText.trim(), postCategory, selectedPostImage || undefined);
    setPostText('');
    setSelectedPostImage('');
  };

  const handleSendComment = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    sounds.playTap();
    if (onAddComment) {
      onAddComment(postId, text);
    }
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const toggleComments = (postId: string) => {
    sounds.playTap();
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCreateStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim()) return;
    sounds.playSuccess();
    if (onAddStory) {
      onAddStory(newStoryText.trim(), newStoryTag, newStoryImage);
    }
    setNewStoryText('');
    setIsAddStoryModalOpen(false);
  };

  const renderBadge = (badge: SocialPost['authorBadge']) => {
    switch (badge) {
      case 'DERECE':
        return (
          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5 text-amber-400" /> DERECE
          </span>
        );
      case 'MEZUN':
        return (
          <span className="text-[9px] font-bold text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">
            MEZUN
          </span>
        );
      case 'HOCA':
        return (
          <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 shadow-xs">
            <Youtube className="w-2.5 h-2.5 text-red-400" />
            <span>YOUTUBE HOCASI</span>
          </span>
        );
      case 'MIZAH':
        return (
          <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-0.5">
            <Smile className="w-2.5 h-2.5 text-purple-400" /> MİZAH
          </span>
        );
      case 'SEN':
        return (
          <span className="text-[9px] font-bold text-pink-300 bg-pink-500/20 px-1.5 py-0.5 rounded-full border border-pink-500/30">
            SEN
          </span>
        );
    }
  };

  const renderAvatarIcon = (icon: string) => {
    switch (icon) {
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'Award': return <Award className="w-4 h-4 text-rose-400" />;
      case 'Coffee': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'BookMarked': return <BookMarked className="w-4 h-4 text-orange-400" />;
      case 'Sunrise': return <Sunrise className="w-4 h-4 text-rose-400" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'Crown': return <Crown className="w-4 h-4 text-amber-400" />;
      case 'HeartHandshake': return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      case 'Compass': return <Compass className="w-4 h-4 text-rose-400" />;
      case 'Headphones': return <Headphones className="w-4 h-4 text-violet-400" />;
      case 'Gamepad2': return <Gamepad2 className="w-4 h-4 text-blue-400" />;
      case 'Scroll': return <Scroll className="w-4 h-4 text-orange-400" />;
      default: return <Smile className="w-4 h-4 text-sky-400" />;
    }
  };

  const presetPostTemplates = [
    `Hedefim ${state.targetGoal.name} ${state.targetGoal.major}! Bugün TYT ${state.currentTytEstimate.toFixed(1)} nete ulaştım. Bu masa kazanacak! 🚀`,
    'Mezunlukta en önemli şey pes etmemek arkadaşlar, herkes netlerin düşüş dönemini yaşar. Sakin kalın! ☕💪',
    'Eyüp B. ve Mert Hoca kamplarını bitirip gece bir deneme patlattım, kafam pırıl pırıl.',
    'Berat ile çiğ badem atıştırıp yapay zekâya integral sorularını tarattık, resmen aydınlanma yaşadım! 🥜🤖',
  ];

  // Filtering posts
  const filteredPosts = state.socialPosts.filter(post => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.authorName.toLowerCase().includes(q) || post.authorHandle.toLowerCase().includes(q);
      const matchTag = post.tag?.toLowerCase().includes(q);
      if (!matchContent && !matchAuthor && !matchTag) return false;
    }

    if (activeFilter === 'FOLLOWING') {
      return isFollowing(post.authorId, post.authorHandle) || post.authorBadge === 'SEN';
    }
    if (activeFilter === 'TEACHERS') {
      return post.authorBadge === 'HOCA';
    }
    if (activeFilter === 'FRIENDS') {
      return (post.authorId && post.authorId.startsWith('char_')) || post.authorBadge === 'DERECE' || post.authorBadge === 'MEZUN';
    }
    if (activeFilter === 'MEME') {
      return post.postCategory === 'meme' || post.authorBadge === 'MIZAH';
    }
    if (activeFilter === 'POLLS') {
      return !!post.poll;
    }
    if (activeFilter === 'SAVED') {
      return !!post.userSaved;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Header bar & Follower Counter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-pink-400 font-bold">
              <MessageCircle className="w-4 h-4 text-pink-500" />
              <span className="uppercase tracking-wider">YKSGram · Canlı Mezun & Hoca Ağı</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hocaları ve kütüphane dostlarını takip et, storylerini izle ve gönderilerine yanıt ver!
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onToggleDetox();
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isDetoxActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isDetoxActive ? '✓ Detoks Açık' : 'Dijital Detoks'}
          </button>
        </div>

        {/* Profile Social Stats Card */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              <strong className="text-white font-mono">{followersCount}</strong> Takipçi
            </span>
            <span className="text-slate-300">
              <strong className="text-white font-mono">{followingList.length}</strong> Takip Edilen
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-pink-400 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>Kütüphane & YKS Topluluğu</span>
          </div>
        </div>
      </div>

      {/* INSTAGRAM & YKSGRAM STORIES BARI (Hikayeler) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>YKSGram Hikayeleri (Stories)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setIsAddStoryModalOpen(true);
            }}
            className="text-[10px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Hikaye Ekle</span>
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-0.5">
          {/* Kullanıcının Hikaye Ekle Butonu */}
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setIsAddStoryModalOpen(true);
            }}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer focus:outline-none"
          >
            <div className="w-13 h-13 rounded-full border-2 border-dashed border-pink-500/70 p-0.5 flex items-center justify-center group-hover:scale-105 transition-transform bg-slate-950">
              <img
                src={state.character.avatarImage}
                alt={state.character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute bottom-6 right-0 bg-pink-500 text-white rounded-full p-0.5 shadow-sm">
                <PlusCircle className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-pink-300 max-w-[60px] truncate text-center">
              Hikayen
            </span>
          </button>

          {/* Mevcut Karakter & Hoca Hikayeleri */}
          {storiesList.map((story: SocialStory) => {
            const hasViewed = !!story.isViewed;
            const avatarSrc = story.avatarImage || SOCIAL_AVATARS[story.authorId];

            return (
              <button
                key={story.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setActiveStoryModal(story);
                }}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-13 h-13 rounded-full p-0.5 transition-all duration-300 group-hover:scale-105 ${
                    hasViewed
                      ? 'bg-slate-700'
                      : 'bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 shadow-md shadow-pink-950/40 animate-pulse'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-slate-950 border-2 border-slate-950 overflow-hidden flex items-center justify-center">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={story.authorName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full ${story.avatarBg || 'bg-slate-800'} flex items-center justify-center text-white`}>
                        {renderAvatarIcon(story.avatarIcon)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white max-w-[62px] truncate text-center">
                  {story.authorName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* YOUTUBE HOCALARI KANALLAR BARI */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2.5">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube YKS Kanalları</span>
          </span>
          <span className="text-[10px] text-slate-500">Takip & Taktik İçin Dokun</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-0.5">
          {YOUTUBE_TEACHERS.map(teacher => {
            const following = isFollowing(teacher.id, teacher.handle);

            return (
              <div
                key={teacher.id}
                className="flex flex-col items-center gap-1 shrink-0 group relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedTeacherModal(teacher);
                  }}
                  className="w-12 h-12 rounded-full p-0.5 transition-all duration-300 bg-slate-800 hover:ring-2 hover:ring-red-500/60 cursor-pointer overflow-hidden"
                >
                  <img
                    src={SOCIAL_AVATARS[teacher.id] || ''}
                    alt={teacher.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white max-w-[56px] truncate text-center">
                  {teacher.name}
                </span>

                {/* Quick Follow Badge */}
                <button
                  type="button"
                  onClick={() => handleFollowClick(teacher.id, teacher.name)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                    following
                      ? 'bg-slate-800 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                  }`}
                >
                  {following ? 'Takipte' : '+ Takip'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {isDetoxActive && (
        <div className="px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Dijital detoks aktif: Bildirimler kapalı. Odaklanma artar ve stres azalır!</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Hoca adı, arkadaş, konu veya etiket ara..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { id: 'ALL', label: 'Tüm Akış' },
            { id: 'FOLLOWING', label: '👥 Takip Ettiklerim' },
            { id: 'TEACHERS', label: '🎓 YouTube Hocaları' },
            { id: 'FRIENDS', label: '🤝 Kütüphane Dostları' },
            { id: 'POLLS', label: '📊 Anketler' },
            { id: 'MEME', label: '😂 YKS Mizah' },
            { id: 'SAVED', label: '📌 Kaydedilenler' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                sounds.playTap();
                setActiveFilter(f.id as any);
              }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-pink-600/25 border-pink-500/60 text-pink-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post Composer (Fotoğraflı Gönderi Paylaşımı) */}
      {!isDetoxActive && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <form onSubmit={handleCreatePost} className="space-y-2">
            <div className="flex items-center gap-2">
              <img
                src={state.character.avatarImage}
                alt={state.character.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-sky-400 object-cover"
              />
              <span className="text-xs font-semibold text-slate-200">{state.character.name} olarak paylaş:</span>
            </div>

            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="YKS süreci, bugünkü netlerin veya çalışma anın hakkında bir şeyler yaz..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
            />

            {/* Post Photo Attachment Selection */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                <ImageIcon className="w-3 h-3 text-pink-400" />
                <span>Fotoğraf Ekle:</span>
              </span>
              {[
                { label: '📚 Masa', url: SOCIAL_POST_IMAGES.kutuphaneMasasi },
                { label: '☕ Kahve', url: SOCIAL_POST_IMAGES.geceKahvesi },
                { label: '🤖 AI & Badem', url: SOCIAL_POST_IMAGES.beratBademAi },
                { label: '🧬 Biyoloji', url: SOCIAL_POST_IMAGES.biyolojiNotlari },
              ].map(imgOpt => (
                <button
                  key={imgOpt.url}
                  type="button"
                  onClick={() => setSelectedPostImage(selectedPostImage === imgOpt.url ? '' : imgOpt.url)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border shrink-0 transition-colors cursor-pointer ${
                    selectedPostImage === imgOpt.url
                      ? 'bg-pink-500/25 border-pink-500 text-pink-200 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {imgOpt.label}
                </button>
              ))}
            </div>

            {selectedPostImage && (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 max-h-36">
                <img
                  src={selectedPostImage}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPostImage('')}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Quick preset suggestions */}
            <div className="flex flex-wrap gap-1">
              {presetPostTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPostText(template)}
                  className="text-[10px] text-slate-400 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-full text-left transition-colors cursor-pointer"
                >
                  💡 {template.slice(0, 42)}...
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                {(['studygram', 'meme', 'advice'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPostCategory(cat)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      postCategory === cat
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {cat === 'studygram' ? 'Masa Başı' : cat === 'meme' ? 'Mizah' : 'Tavsiye'}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!postText.trim()}
                className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <span>Paylaş</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Social Feed List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-1">
            <p className="text-xs font-semibold">Bu filtrede gösterilecek gönderi bulunamadı.</p>
            <p className="text-[10px] text-slate-500">Başka bir filtre seçebilir veya arama terimini temizleyebilirsin.</p>
          </div>
        ) : (
          filteredPosts.map((post: SocialPost) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const currentCommentInput = commentInputs[post.id] || '';
            const authorImg = post.avatarImage || (post.authorId ? SOCIAL_AVATARS[post.authorId] : undefined);
            const following = isFollowing(post.authorId, post.authorHandle);

            return (
              <div
                key={post.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 hover:border-slate-700/80 transition-all shadow-md"
              >
                {/* Author row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-white shadow-xs">
                      {authorImg ? (
                        <img
                          src={authorImg}
                          alt={post.authorName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${post.avatarBg || 'bg-slate-800'} flex items-center justify-center`}>
                          {renderAvatarIcon(post.avatarIcon)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{post.authorName}</span>
                        {post.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                        )}
                        {renderBadge(post.authorBadge)}
                      </div>
                      <div className="text-[10px] text-slate-400">{post.authorHandle} · {post.timeAgo}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Follow / Unfollow Button */}
                    {post.authorBadge !== 'SEN' && (
                      <button
                        type="button"
                        onClick={() => handleFollowClick(post.authorId || post.authorHandle, post.authorName)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          following
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/40'
                            : 'bg-pink-600/20 border-pink-500/40 text-pink-300 hover:bg-pink-600/30'
                        }`}
                      >
                        {following ? (
                          <>
                            <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Takipte</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-2.5 h-2.5" />
                            <span>Takip Et</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Bookmark Save Button */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        if (onToggleSavePost) onToggleSavePost(post.id);
                      }}
                      title={post.userSaved ? 'Kaydedilenlerden Çıkar' : 'Gönderiyi Kaydet'}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        post.userSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${post.userSaved ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Optional Tag Banner */}
                {post.tag && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full">
                    <span>{post.tag}</span>
                  </div>
                )}

                {/* Post content text */}
                <p className="text-xs text-slate-200 mt-2 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                {/* Post Attached Photo / Visual */}
                {post.imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-56 object-cover"
                    />
                  </div>
                )}

                {/* Interactive Poll Card (if available) */}
                {post.poll && (
                  <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{post.poll.question}</span>
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {post.poll.options.reduce((acc, o) => acc + o.votes, 0).toLocaleString()} Oy
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {post.poll.options.map(opt => {
                        const totalVotes = post.poll!.options.reduce((acc, o) => acc + o.votes, 0);
                        const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        const isVoted = post.poll?.userVotedOptionId === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              sounds.playTap();
                              if (onVotePoll) onVotePoll(post.id, opt.id);
                            }}
                            className={`w-full relative overflow-hidden rounded-lg p-2 text-left text-xs transition-all border cursor-pointer ${
                              isVoted
                                ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                                isVoted ? 'bg-sky-500/30' : 'bg-slate-800/50'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                            <div className="relative flex items-center justify-between z-10 font-medium">
                              <span className="flex items-center gap-1.5">
                                {isVoted && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                                <span>{opt.text}</span>
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">%{percent}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Claimable BP Reward Banner (Teacher Bonus) */}
                {post.bpReward && !post.hasClaimedReward && (
                  <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                      <Gift className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span>Hoca Taktik Bonusu: +{post.bpReward} BP</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playCoin();
                        if (onClaimPostReward) onClaimPostReward(post.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Öğren & BP Al
                    </button>
                  </div>
                )}

                {/* Reaction footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        sounds.playTap();
                        onLikePost(post.id);
                      }}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        post.userLiked ? 'text-pink-400 font-bold' : 'hover:text-pink-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.userLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-sky-400 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments?.length || post.commentsCount} Yorum</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 italic">
                    {post.impactType === 'MORALE_UP' && '🌸 Moral Artırır'}
                    {post.impactType === 'MOTIVATION_SURGE' && '⚡ Motivasyon Sıçraması'}
                    {post.impactType === 'STRESS_UP' && '⚠️ Hafif Stres'}
                  </span>
                </div>

                {/* COMMENTS SECTION */}
                {isCommentsOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment: SocialComment) => {
                          const commentImg = comment.authorAvatar;

                          return (
                            <div key={comment.id} className="p-2 rounded-xl bg-slate-950/70 border border-slate-850 flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                {commentImg ? (
                                  <img src={commentImg} alt={comment.authorName} className="w-full h-full object-cover" />
                                ) : (
                                  <Smile className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                                    {comment.authorName}
                                    {comment.authorBadge === 'HOCA' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                                  </span>
                                  <span className="text-[9px] text-slate-500">{comment.timeAgo}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{comment.content}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-500 italic text-center py-1">Henüz yorum yok. İlk yorumu sen yaz!</p>
                      )}
                    </div>

                    {/* Comment composer */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={currentCommentInput}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendComment(post.id);
                          }
                        }}
                        placeholder="Yorum ekle..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={!currentCommentInput.trim()}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* STORY GÖRÜNTÜLEYİCİ MODALI (Full Story Viewer) */}
      {activeStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative flex flex-col">
            {/* Top Story Progress Bar */}
            <div className="w-full bg-slate-800 h-1">
              <div className="h-full bg-gradient-to-r from-pink-500 to-amber-400 animate-[toastCountdown_12s_linear_forwards]" />
            </div>

            {/* Story Header */}
            <div className="p-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-pink-500">
                  <img
                    src={activeStoryModal.avatarImage || SOCIAL_AVATARS[activeStoryModal.authorId]}
                    alt={activeStoryModal.authorName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{activeStoryModal.authorName}</span>
                    <span className="text-[10px] text-pink-400 font-mono">({activeStoryModal.storyTag})</span>
                  </div>
                  <div className="text-[10px] text-slate-300">{activeStoryModal.authorHandle} · {activeStoryModal.timeAgo}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStoryModal(null)}
                className="text-white hover:text-pink-400 p-1 bg-black/50 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Image & Overlay Content */}
            <div className="relative w-full h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={activeStoryModal.imageUrl || SOCIAL_POST_IMAGES.kutuphaneMasasi}
                alt="Story background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute bottom-4 inset-x-4 space-y-2 z-10">
                <p className="text-sm font-semibold text-white leading-relaxed drop-shadow-md bg-black/60 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                  {activeStoryModal.textOverlay}
                </p>
              </div>
            </div>

            {/* Story Footer Interaction */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  if (onLikeStory) onLikeStory(activeStoryModal.id);
                  setActiveStoryModal(prev => prev ? { ...prev, userLiked: !prev.userLiked, likesCount: (prev.likesCount || 0) + (prev.userLiked ? -1 : 1) } : null);
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  activeStoryModal.userLiked
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${activeStoryModal.userLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                <span>{activeStoryModal.likesCount || 0} Beğeni</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  handleFollowClick(activeStoryModal.authorId, activeStoryModal.authorName);
                }}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-full bg-sky-950/40 border border-sky-500/40 cursor-pointer"
              >
                {isFollowing(activeStoryModal.authorId) ? '✓ Takip Ediliyor' : '+ Takip Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ HİKAYE EKLEME MODALI */}
      {isAddStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-4 shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  YKSGram Hikaye Paylaş
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStorySubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Hikaye Metnin:</label>
                <textarea
                  value={newStoryText}
                  onChange={e => setNewStoryText(e.target.value)}
                  placeholder="Bugünkü çalışma modun, çözdüğün zor soru veya motivasyonun..."
                  rows={3}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Hikaye Etiketi:</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['🔥 Hedef', '☕ Kahve & Mola', '📚 Deneme Sonucu', '⚡ Akış Hali', '🤖 Gece Etüdü'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewStoryTag(t)}
                      className={`text-[10px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                        newStoryTag === t
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Görsel Seç:</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[
                    { label: 'Kütüphane', url: SOCIAL_POST_IMAGES.kutuphaneMasasi },
                    { label: 'Gece Kahvesi', url: SOCIAL_POST_IMAGES.geceKahvesi },
                    { label: 'Yapay Zeka', url: SOCIAL_POST_IMAGES.beratBademAi },
                  ].map(img => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setNewStoryImage(img.url)}
                      className={`rounded-xl overflow-hidden border p-0.5 relative transition-all cursor-pointer ${
                        newStoryImage === img.url
                          ? 'border-pink-500 ring-2 ring-pink-500/50'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-14 object-cover rounded-lg" />
                      <span className="text-[9px] text-white font-bold block text-center mt-0.5">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newStoryText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hikayeyi Canlı Yayınla</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* YOUTUBE HOCASI DETAY MODALI */}
      {selectedTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-4 shadow-2xl relative space-y-3">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 shadow-md">
                  <img
                    src={SOCIAL_AVATARS[selectedTeacherModal.id]}
                    alt={selectedTeacherModal.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-extrabold text-white">{selectedTeacherModal.name}</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                  </div>
                  <p className="text-[10px] text-slate-400">{selectedTeacherModal.channel} · {selectedTeacherModal.subscribers}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeacherModal(null)}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Uzmanlık Alanı:</div>
                <div className="text-emerald-400 font-bold">{selectedTeacherModal.subject}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Meşhur Sloganı / Tavsiyesi:</div>
                <div className="text-slate-200 italic">{selectedTeacherModal.catchphrase}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleFollowClick(selectedTeacherModal.id, selectedTeacherModal.name)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isFollowing(selectedTeacherModal.id, selectedTeacherModal.handle)
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-pink-600 hover:bg-pink-500 border-pink-500 text-white shadow-md'
                }`}
              >
                {isFollowing(selectedTeacherModal.id, selectedTeacherModal.handle) ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Takip Ediliyor</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Hocayı Takip Et</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  setSearchQuery(selectedTeacherModal.name);
                  setActiveFilter('ALL');
                  setSelectedTeacherModal(null);
                }}
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                title="Hocanın Tüm Gönderilerini Listele"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>Gönderiler</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
