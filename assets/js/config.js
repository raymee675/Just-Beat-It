// 運用時の変更はこのファイルだけで行います。文字列は引用符で囲んでください。
window.JBI_CONFIG = {
  // 全ページの Steam ボタンのリンク先。
  steamUrl: "https://store.steampowered.com/app/5429530/",
  // Google フォームの公開 URL（https://docs.google.com/forms/... または https://forms.gle/...）。空なら準備中。
  contactFormUrl: "",
  freeDownload: {
    // 開始・終了はタイムゾーン付き ISO 8601。開始を含み、終了を含みません。
    // 例: "2026-11-01T00:00:00+09:00"。両日時と URL が揃わない場合は配布なし。
    startsAt: "",
    endsAt: "",
    // GitHub Releases の ZIP 直リンク（https://github.com/所有者/リポジトリ/releases/download/タグ/ファイル.zip）。
    url: "",
    // 配布する版、ZIP の容量表示、ZIP ファイルの SHA-256（64桁の16進数）。
    version: "",
    sizeLabel: "",
    sha256: ""
  }
};
