// 運用で書き換えるのはこのファイルだけです。文字列は引用符で囲んでください。
// 日本語と英語を両方持つ項目は { ja: "…", en: "…" } の形です。
window.JBI_CONFIG = {
  // 制作の名前（暫定）。
  team: {
    ja: "Just Beat It 制作班",
    en: "Just Beat It Team"
  },

  // メンバー（ハンドル名と担当）。上から順に並びます。空のあいだは「準備中」と出ます。
  // 例: { handle: "raymee", role: { ja: "プログラム・弾幕", en: "Programming, Patterns" } },
  members: [
    { handle: { ja: "まろん", en: "Marron" }, role: { ja: "企画・ディレクション・プログラム・弾幕・背景", en: "Concept, Direction, Programming, Patterns, Backgrounds" } },
    { handle: { ja: "レイミー", en: "Raymee" }, role: { ja: "プログラム・弾幕・キャラクター原案・音楽", en: "Programming, Patterns, Character Concepts, Music" } },
    { handle: "z1024", role: { ja: "弾幕・キャラクター原案・テストプレイ", en: "Patterns, Character Concepts, Playtesting" } },
    { handle: "sosodoneas", role: { ja: "弾幕・キャラクター原案・キャラクターの絵", en: "Patterns, Character Concepts, Character Art" } },
    { handle: "beniguchi", role: { ja: "音楽", en: "Music" } }
  ],

  // PV。youtubeId（例 "dQw4w9WgXcQ"）か mp4（例 "assets/video/pv1.mp4"）のどちらかを入れると差し替わります。
  // 両方空のあいだは、プレイ映像を「PV 準備中」の注記つきで流します。
  pv: {
    youtubeId: "",
    mp4: ""
  },

  // お問い合わせ。formUrl に Google フォームの URL（例 "https://forms.gle/…"）を入れるとボタンが有効になります。
  // 空のあいだはボタンが「準備中」になります。
  contact: {
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfeEURZEyI0D2UZvlAes9fcFfb7OTds7c3bpasJRYUKSAk5DA/viewform"
  },

  // Steam。url にストアページの URL を入れると、サイトの案内先に反映されます。
  steam: {
    url: "https://store.steampowered.com/app/5429530/Just_Beat_It/"
  }
};
