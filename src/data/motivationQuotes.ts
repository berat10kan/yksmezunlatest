export interface MotivationQuote {
  id: string;
  quote: string;
  author: string;
  category: 'FOCUS' | 'RESILIENCE' | 'DISCIPLINE' | 'CAMPUS_DREAM' | 'YKS_WISDOM';
  moraleBonus: number;
}

export const MOTIVATION_QUOTES: MotivationQuote[] = [
  {
    id: 'q1',
    quote: 'Bugün çözdüğün her paragraf ve geometri sorusu, sınav günü seni sıralamada 500 kişinin önüne geçirecek. Masadan kalkma!',
    author: 'Mezun Bilgesi',
    category: 'FOCUS',
    moraleBonus: 6,
  },
  {
    id: 'q2',
    quote: 'Mezuna kalmak pes etmek değil, hedefe daha keskin bir nişan almaktır. O amfinin kapısından başın dik gireceksin!',
    author: 'Derece Yapan Mezun',
    category: 'RESILIENCE',
    moraleBonus: 8,
  },
  {
    id: 'q3',
    quote: 'Gözündeki uykuyu sil! ODTÜ Devrim Stadyumu\'nda veya Boğaziçi Güney Kampüs\'te çimlere uzanıp mezuniyet kutladığın anı hayal et.',
    author: 'Kampüs Hayali',
    category: 'CAMPUS_DREAM',
    moraleBonus: 7,
  },
  {
    id: 'q4',
    quote: 'Türev ve integral gözünü korkutmasın; onlar sadece fonksiyonun eğimi, sen ise bu başarı hikayesinin zirvesisin.',
    author: 'Yahya Hoca',
    category: 'YKS_WISDOM',
    moraleBonus: 8,
  },
  {
    id: 'q5',
    quote: 'Bugün hissettiğin sırt ağrısı ve yorgunluk geçici; hayalindeki tıp/mühendislik/hukuk fakültesine kaydolduğun gün hissedeceğin gurur ömürlük.',
    author: 'Geleceğin Doktoru',
    category: 'CAMPUS_DREAM',
    moraleBonus: 6,
  },
  {
    id: 'q6',
    quote: 'Sene başında \'seneye görüşürüz\' diyenlerin şüphelerine en güzel cevabı, ÖSYM Sonuç Belgesi\'ndeki 5 haneli derece verecek.',
    author: 'Mezun İnadı',
    category: 'RESILIENCE',
    moraleBonus: 8,
  },
  {
    id: 'q7',
    quote: 'Masanın üzerindeki kahve lekeleri ve fosforlu kalem izleri senin zafer sembollerin. Her deneme seni kusursuzlaştırıyor.',
    author: 'Gece Çalışanı',
    category: 'DISCIPLINE',
    moraleBonus: 6,
  },
  {
    id: 'q8',
    quote: 'Denemede 5 net düşüş yaşadın diye karaları bağlama. Ok geriye çekilmeden ileri fırlatılamaz!',
    author: 'Psikolojik Danışman',
    category: 'RESILIENCE',
    moraleBonus: 7,
  },
  {
    id: 'q9',
    quote: 'Disiplin, canın ders çalışmak istemediğinde bile masaya oturup o testi bitirebilme sanatıdır. Devam et!',
    author: 'Kütüphane Emektarı',
    category: 'DISCIPLINE',
    moraleBonus: 6,
  },
  {
    id: 'q10',
    quote: 'Şu an tüm Türkiye uyurken veya sosyal medyada vakit öldürürken senin masa başında soru çözmen boşuna değil.',
    author: 'YKS Maratoncusu',
    category: 'FOCUS',
    moraleBonus: 7,
  },
  {
    id: 'q11',
    quote: 'Bir soru bankası daha bittiğinde, hedefine giden yoldan dev bir taş daha kalkmış demektir. Kalemi bırakma!',
    author: 'Masa Başı Tavsiyesi',
    category: 'YKS_WISDOM',
    moraleBonus: 6,
  },
  {
    id: 'q12',
    quote: 'Başarı tesadüf değildir; uykusuz sabahların, deneme analizlerinin ve vazgeçmeyen bir mezun yüreğinin eseridir.',
    author: 'Yahya Hoca Notları',
    category: 'RESILIENCE',
    moraleBonus: 9,
  },
];
