/**
 * All user-facing copy, centralized. Turkish, 2nd person singular, short and friendly
 * (max ~6 words per label), exclamation-light, always pairable with an icon/emoji.
 * Code stays in English; only these values are shown to the child.
 */
export const strings = {
  common: {
    loading: 'Yükleniyor…',
    retry: 'Tekrar dene',
    errorTitle: 'Bir şeyler ters gitti',
  },
  home: {
    greeting: 'Merhaba! Hadi öğrenelim 🚀',
    title: 'Dersler',
    emptyTitle: 'Henüz ders yok',
    offlineBanner: 'İnternet yok — kayıtlı dersler açık 📚',
    offlineNoCache: 'İnternete bağlanınca dersler gelecek',
    lessonTitle: (n: number, author: string) => `Ders ${n}: ${author}`,
  },
  exercise: {
    startQuiz: 'Alıştırmaya Geç',
    videoError: 'Video açılmadı, sorun değil!',
    videoErrorHint: 'Alıştırmaya geçebilirsin 👇',
    watchFirst: 'Önce videoyu izle 🎬',
    question: (n: number, total: number) => `Soru ${n}/${total}`,
    correct: 'Harika! 🎉',
    wrong: 'Olsun, devam! 💪',
    timeUp: 'Süre doldu ⏰',
    exitTitle: 'Çıkmak istiyor musun?',
    exitBody: 'İlerlemen kaybolur.',
    exitConfirm: 'Çık',
    exitCancel: 'Kal',
  },
  result: {
    passTitle: 'Bravo! 🎉',
    perfectTitle: 'Müthiş! Hepsi doğru 🌟',
    failTitle: 'Az kaldı! Bir daha deneyelim 💪',
    score: (correct: number, total: number) => `${correct}/${total} doğru`,
    retryLesson: 'Tekrar Dene',
    goHome: 'Ana Sayfa',
  },
  a11y: {
    mascot: 'Sevimli tilki maskot',
    mascotSays: (text: string) => `Tilki diyor ki: ${text}`,
  },
} as const;
