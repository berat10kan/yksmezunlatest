import React, { useState } from 'react';
import {
  Award,
  Zap,
  TrendingUp,
  History,
  FileCheck,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ExamRecord, GameSaveState } from '../../types/game';
import { sounds } from '../../utils/audio';
import { ASSET_IMAGES } from '../../data/initialData';

interface ExamsViewProps {
  state: GameSaveState;
  onTakeExam: (examType: 'BRANS_TURKCE' | 'BRANS_MAT' | 'TYT_FULL' | 'AYT_FULL', tactic: 'TURLAMA' | 'HIZLI' | 'DENGELI') => void;
  onOpenMockSimulation?: () => void;
  isTakingExam: boolean;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  state,
  onTakeExam,
  onOpenMockSimulation,
  isTakingExam,
}) => {
  const [selectedTactic, setSelectedTactic] = useState<'TURLAMA' | 'HIZLI' | 'DENGELI'>('TURLAMA');
  const [examTab, setExamTab] = useState<'EXAMS' | 'HISTORY'>('EXAMS');
  const [chartScope, setChartScope] = useState<'TYT' | 'AYT'>('TYT');

  const handleStartExam = (type: 'BRANS_TURKCE' | 'BRANS_MAT' | 'TYT_FULL' | 'AYT_FULL', energyCost: number, bpCost: number) => {
    if (state.energy < energyCost) {
      sounds.playStressAlert();
      return;
    }
    if (state.bp < bpCost) {
      sounds.playStressAlert();
      return;
    }
    sounds.playExamBell();
    onTakeExam(type, selectedTactic);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 1000) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    if (rank <= 10000) return 'text-purple-400 bg-purple-500/15 border-purple-500/30';
    if (rank <= 50000) return 'text-sky-400 bg-sky-500/15 border-sky-500/30';
    return 'text-slate-400 bg-slate-500/15 border-slate-500/30';
  };

  // TYT & AYT Sınavlarını Ayrı Ayrı Filtreleme
  const tytExams = state.examHistory.filter(
    r => r.tytScore !== undefined || r.type === 'KURUMSAL_TYT' || (r.type === 'BRANS' && !r.aytScore)
  );
  const aytExams = state.examHistory.filter(
    r => r.aytScore !== undefined || r.type === 'KURUMSAL_AYT'
  );

  // Aktif seçilen grafiğe göre son 5 deneme (kronolojik: eski -> yeni)
  const activeExamList = chartScope === 'TYT' ? tytExams : aytExams;
  const last5Chronological = [...activeExamList].slice(0, 5).reverse();

  const chartData = last5Chronological.map((rec, index) => {
    const isTyt = chartScope === 'TYT';
    const net = isTyt
      ? (rec.tytScore ? rec.tytScore.total : 0)
      : (rec.aytScore ? rec.aytScore.total : 0);

    const shortName = rec.type === 'KURUMSAL_TYT' ? 'TYT' :
                      rec.type === 'KURUMSAL_AYT' ? 'AYT' :
                      rec.type === 'MOCK_SIMULATION' ? 'Simülasyon' : 'Branş';

    return {
      index: index + 1,
      name: `${shortName} (G${rec.day})`,
      fullName: rec.name,
      net: Number(net.toFixed(1)),
      rank: rec.estimatedRank,
      type: rec.type,
      turkce: rec.tytScore?.turkce,
      matematik: rec.tytScore?.matematik,
      fen: rec.tytScore?.fen,
      sosyal: rec.tytScore?.sosyal,
      ders1: rec.aytScore?.ders1,
      ders2: rec.aytScore?.ders2,
    };
  });

  // Net Trend Analizi
  const firstNet = chartData.length > 0 ? chartData[0].net : 0;
  const lastNet = chartData.length > 0 ? chartData[chartData.length - 1].net : 0;
  const netDiff = Number((lastNet - firstNet).toFixed(1));

  // Minimum ve maksimum net değerleri (Y Ekseni için pay bırakma)
  const defaultMax = chartScope === 'TYT' ? 120 : 80;
  const minNet = chartData.length > 0 ? Math.max(0, Math.floor(Math.min(...chartData.map(d => d.net)) - 5)) : 0;
  const maxNet = chartData.length > 0 ? Math.min(defaultMax, Math.ceil(Math.max(...chartData.map(d => d.net)) + 5)) : defaultMax;

  // Çizgi ve renk teması (TYT = Gök Mavisi, AYT = Parlak Gül/Mor)
  const strokeColor = chartScope === 'TYT' ? '#38bdf8' : '#fb7185';
  const dotFillColor = chartScope === 'TYT' ? '#0284c7' : '#e11d48';

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Exam Banner Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
        <img
          src={ASSET_IMAGES.examHall}
          alt="Sınav Salonu"
          referrerPolicy="no-referrer"
          className="w-full h-36 object-cover object-center brightness-90 filter"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <Award className="w-4 h-4 text-amber-400" />
              <span>ÖSYM & Kurumsal Deneme Merkezi</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Netlerini artır, Türkiye sıralamanı zirveye taşı.
            </p>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[9px] text-slate-400 block">TYT Neti</span>
              <span className="text-xs font-bold font-mono text-sky-400">
                {state.currentTytEstimate.toFixed(1)} / 120
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block">AYT Neti</span>
              <span className="text-xs font-bold font-mono text-rose-400">
                {state.currentAytEstimate.toFixed(1)} / 80
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* AYRI TYT & AYT NET DEĞİŞİM GRAFİKLERİ (RECHARTS) */}
      {/* ======================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-lg">
        {/* Header & TYT / AYT Selector */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                chartScope === 'TYT'
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-400'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Son 5 {chartScope} Net Gelişimi</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {chartScope === 'TYT' ? '120 Soru Üzerinden TYT İvmesi' : '80 Soru Üzerinden AYT İvmesi'}
              </p>
            </div>
          </div>

          {/* TYT vs AYT Switcher Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                sounds.playTap();
                setChartScope('TYT');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                chartScope === 'TYT'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TYT ({tytExams.length})
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setChartScope('AYT');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                chartScope === 'AYT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AYT ({aytExams.length})
            </button>
          </div>
        </div>

        {/* Net Trend Badge */}
        {chartData.length > 0 && (
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] text-slate-400">
              Son {chartData.length} {chartScope} sınavındaki net değişimi:
            </span>
            <div className="font-mono text-xs font-bold">
              {netDiff > 0 ? (
                <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{netDiff} Net
                </span>
              ) : netDiff < 0 ? (
                <span className="flex items-center gap-0.5 text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30 text-[11px]">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {netDiff} Net
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 text-[11px]">
                  <Minus className="w-3 h-3" />
                  0 Net
                </span>
              )}
            </div>
          </div>
        )}

        {/* Recharts LineChart */}
        {chartData.length > 0 ? (
          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 12, left: -22, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  domain={[minNet, maxNet]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={val => `${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-md">
                          <p className="font-bold text-white mb-1">{data.fullName}</p>
                          <div className="flex items-center justify-between gap-3 text-slate-300 text-[11px]">
                            <span>Toplam Net:</span>
                            <span className={`font-mono font-bold text-sm ${chartScope === 'TYT' ? 'text-sky-400' : 'text-rose-400'}`}>
                              {data.net} Net
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] mt-0.5">
                            <span>Tahmini Sıralama:</span>
                            <span className="font-mono text-amber-300">#{data.rank?.toLocaleString('tr-TR')}</span>
                          </div>
                          {chartScope === 'TYT' && data.turkce !== undefined && (
                            <div className="mt-1 pt-1 border-t border-slate-800 text-[9px] text-slate-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                              <span>Türkçe: <strong className="text-slate-200">{data.turkce}</strong></span>
                              <span>Matematik: <strong className="text-slate-200">{data.matematik}</strong></span>
                              <span>Fen: <strong className="text-slate-200">{data.fen}</strong></span>
                              <span>Sosyal: <strong className="text-slate-200">{data.sosyal}</strong></span>
                            </div>
                          )}
                          {chartScope === 'AYT' && (data.ders1 !== undefined || data.ders2 !== undefined) && (
                            <div className="mt-1 pt-1 border-t border-slate-800 text-[9px] text-slate-400 grid grid-cols-2 gap-x-2 gap-y-0.5">
                              <span>Mat / Alan 1: <strong className="text-slate-200">{data.ders1 || 0}</strong></span>
                              <span>Fen / Alan 2: <strong className="text-slate-200">{data.ders2 || 0}</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Referans Ortalama Çizgisi */}
                {chartData.length >= 2 && (
                  <ReferenceLine
                    y={Number((chartData.reduce((acc, curr) => acc + curr.net, 0) / chartData.length).toFixed(1))}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke={strokeColor}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: dotFillColor,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: strokeColor,
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/80 my-2">
            Henüz girilmiş bir {chartScope} denemesi bulunmuyor. Aşağıdan {chartScope} sınavını başlat!
          </div>
        )}

        {chartData.length > 0 && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: strokeColor }}
              />
              {chartScope} Sınav Neti
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed" />
              Ortalama:{' '}
              <strong className="text-amber-300 font-mono">
                {(chartData.reduce((acc, curr) => acc + curr.net, 0) / chartData.length).toFixed(1)}
              </strong>
            </span>
            <span className="text-slate-500">
              {chartScope === 'TYT' ? '120 Soru' : '80 Soru'}
            </span>
          </div>
        )}
      </div>

      {/* Segmented Switcher (Denemeler & Net Geçmişi) */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            sounds.playTap();
            setExamTab('EXAMS');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            examTab === 'EXAMS' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Deneme Sınavları</span>
        </button>
        <button
          onClick={() => {
            sounds.playTap();
            setExamTab('HISTORY');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            examTab === 'HISTORY' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Net Geçmişi ({state.examHistory.length})</span>
        </button>
      </div>

      {examTab === 'EXAMS' ? (
        <>
          {/* Tactic Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">Sınav Taktik Seçimi</span>
              <span className="text-[10px] text-slate-400">Sonuca doğrudan etki eder</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  sounds.playTap();
                  setSelectedTactic('TURLAMA');
                }}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTactic === 'TURLAMA'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-xs'
                    : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">Turlama Taktiği</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Düşük risk, hatasız net</div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setSelectedTactic('HIZLI');
                }}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTactic === 'HIZLI'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-xs'
                    : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">Hızlı Çözüm</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Yüksek net, stres riski</div>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setSelectedTactic('DENGELI');
                }}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedTactic === 'DENGELI'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-xs'
                    : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="text-[11px] font-bold">Dengeli / Standart</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Ortalama hız ve net</div>
              </button>
            </div>
          </div>

          {/* Exam Options List */}
          <div className="space-y-2.5">
            {/* 1. TYT Türkiye Geneli (3D / Özdebir / Bilgi Sarmal) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Özdebir Türkiye Geneli TYT</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      120 Soru
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Türkçe (40), Matematik (40), Fen (20), Sosyal (20) alanlarında seviye belirler.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> -25 En
                  </span>
                  <span className="text-purple-400 flex items-center gap-0.5">
                    <Layers className="w-3 h-3" /> -40 BP
                  </span>
                </div>

                <button
                  onClick={() => handleStartExam('TYT_FULL', 25, 40)}
                  disabled={isTakingExam || state.energy < 25 || state.bp < 40}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isTakingExam ? 'Sınavdasın...' : 'TYT Başlat'}
                </button>
              </div>
            </div>

            {/* 2. AYT Alan Provası */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">3D Yayınları Türkiye Geneli AYT</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      80 Soru
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sayısal (Mat-Fen) veya Eşit Ağırlık (Mat-Ed Sos) sınavı. Sıralamayı en sert belirleyen sınav.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> -30 En
                  </span>
                  <span className="text-purple-400 flex items-center gap-0.5">
                    <Layers className="w-3 h-3" /> -50 BP
                  </span>
                </div>

                <button
                  onClick={() => handleStartExam('AYT_FULL', 30, 50)}
                  disabled={isTakingExam || state.energy < 30 || state.bp < 50}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isTakingExam ? 'Sınavdasın...' : 'AYT Başlat'}
                </button>
              </div>
            </div>

            {/* 3. Branş Denemeleri (Mini Hız Pratiği) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <div className="text-[10px] font-bold text-amber-400">BRANŞ HIZ DENEMESİ</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">TYT Paragraf & Türkçe</div>
                <div className="text-[10px] text-slate-400 mt-1">40 Soru · Paragraf hızı kazandırır</div>
                <button
                  onClick={() => handleStartExam('BRANS_TURKCE', 12, 15)}
                  disabled={isTakingExam || state.energy < 12 || state.bp < 15}
                  className="w-full mt-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Türkçe Çöz (-12 En)
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <div className="text-[10px] font-bold text-indigo-400">BRANŞ HIZ DENEMESİ</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">TYT Problem & Mat</div>
                <div className="text-[10px] text-slate-400 mt-1">40 Soru · Geometri ve mantık</div>
                <button
                  onClick={() => handleStartExam('BRANS_MAT', 12, 15)}
                  disabled={isTakingExam || state.energy < 12 || state.bp < 15}
                  className="w-full mt-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  Matematik Çöz (-12 En)
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* History Tab */
        <div className="space-y-2">
          {state.examHistory.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
              Henüz girilen deneme yok. İlk denemene girip netlerini kaydet!
            </div>
          ) : (
            state.examHistory.map((rec: ExamRecord) => (
              <div
                key={rec.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{rec.name}</span>
                    {rec.isRecordScore && (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1 rounded flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        REKOR
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Gün {rec.day}</span>
                    <span>·</span>
                    <span>{rec.dateStr}</span>
                    <span>·</span>
                    <span className="text-sky-300 font-mono font-medium">
                      {rec.tytScore ? `TYT: ${rec.tytScore.total.toFixed(1)} Net` : `AYT: ${rec.aytScore?.total.toFixed(1)} Net`}
                    </span>
                  </div>
                </div>

                <div className={`px-2 py-1 rounded border text-right font-mono text-xs font-bold ${getRankBadgeColor(rec.estimatedRank)}`}>
                  #{rec.estimatedRank.toLocaleString('tr-TR')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
