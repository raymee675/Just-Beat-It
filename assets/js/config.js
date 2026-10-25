// 運用で書き換えるのはこのファイルだけです。文字列は引用符で囲んでください。
// 日本語と英語を両方持つ項目は { ja: "…", en: "…" } の形です。
window.JBI_CONFIG = {
  // 制作の名前（暫定）。
  team: {
    ja: "筑駒縁日 Just Beat It 制作班",
    en: "Tsukukoma Festival Just Beat It Team"
  },

  // メンバー（ハンドル名と担当）。上から順に並びます。空のあいだは「準備中」と出ます。
  // 例: { handle: "raymee", role: { ja: "プログラム・弾幕", en: "Programming, Patterns" } },
  members: [],

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

  // ダウンロード。url が空のあいだはボタンが「準備中」になります。
  // url は GitHub Releases の直リンク（https://github.com/所有者/リポジトリ/releases/download/タグ/ファイル.zip）。
  // size はファイルの大きさ（例 "約 650 MB"）、version は版（例 "1.0.0"）。
  download: {
    windows: {
      url: "",
      size: "",
      version: "",
      os: { ja: "Windows 10 / 11（64 ビット）", en: "Windows 10 / 11 (64-bit)" },
      gpu: { ja: "DirectX 11 対応（GeForce GTX 1050 程度以上）", en: "DirectX 11 capable (GeForce GTX 1050 or better)" },
      storage: { ja: "1 GB 以上の空き", en: "1 GB free space" }
    },
    mac: {
      url: "",
      size: "",
      version: "",
      os: { ja: "準備中", en: "TBA" },
      gpu: { ja: "準備中", en: "TBA" },
      storage: { ja: "準備中", en: "TBA" }
    }
  }
};
