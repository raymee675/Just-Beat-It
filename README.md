# Just Beat It 配布サイト

筑駒縁日 Just Beat It 制作班のリズム弾幕アクション「Just Beat It」を配布するための、GitHub Pages 用の静的サイトです。HTML / CSS / JavaScript だけでできていて、ビルドも npm も要りません。

公開 URL: https://raymee675.github.io/Just-Beat-It/

## 決まり

- Steam 版とは完全に切り離す。サイトに Steam 版のこと・リンクは載せない。
- 問い合わせ先は置かない。
- 日本語と英語を切り替えられる。

## 構成

1 ページ（index.html）に、番号付きの区画を上から並べています。

| 番号 | 区画 | id |
| --- | --- | --- |
| 00 | トップ（オープニング・キャッチ・ダウンロード・PV） | top |
| 01 | ゲームについて | about |
| 02 | ステージ（一覧から選ぶと背景・敵・場所の名前が替わる） | stages |
| 03 | 映像（PV 第一弾） | movie |
| 04 | ダウンロード（PC の条件・大きさ・警告が出た時の開き方） | download |
| 05 | 遊び方（キーボード・2 人・コントローラー・ルール） | howto |
| 06 | 制作（制作班とメンバー） | team |
| 07 | クレジット（フォント・素材・OFL の許諾文） | credits |

- `assets/js/config.js` … 運用で書き換える設定（下記）
- `assets/js/opening.js` … トップの演出（弾が拍に合わせて集まり、ロゴが光って出る）
- `assets/js/main.js` … 言語の切り替え・ナビ・ステージ選択・映像・ダウンロード・制作班
- `assets/css/site.css` … 見た目（ゲームの UI と同じ、暗い板と筆の帯）
- `assets/img/enemy/` … ステージの敵の絵（ゲームの `Assets/StageData/*/Visuals` から）
- `manual/`・`support/`・`download/`・`en/` … 前のサイトの URL を新しい区画へ転送するだけのページ
- `404.html`、`.nojekyll`、`robots.txt`

## 日常の設定変更

書き換えるのは **assets/js/config.js だけ**です。

- `team` … 制作の名前（日本語・英語）
- `members` … メンバー。`{ handle: "ハンドル名", role: { ja: "担当", en: "Role" } }` を並べる。空なら「準備中」
- `pv.youtubeId` / `pv.mp4` … PV。どちらかを入れると差し替わる。空のあいだはプレイ映像を「PV 準備中」の注記つきで流す
- `download.windows` / `download.mac` … `url` を入れるとダウンロードボタンが押せるようになる（空なら「準備中」）。`size`（大きさ）、`version`（版）、`os`・`gpu`・`storage`（動く PC の条件）

ゲーム本体は GitHub Releases に置き、`url` には `https://github.com/所有者/リポジトリ/releases/download/タグ/ファイル.zip` の形の直リンクを入れます（1 ファイル 2 GB まで）。

## 見た目の決まり

- 暗い板の上に文字。選んでいる物はマゼンタ（#DD007B）、実行するボタンはシアン（#087F96）、選んでいない物は灰色の筆の帯。押せる物は明るさと大きさ（1.08 倍）で示す
- 文字は Noto Serif JP（Google Fonts）
- 1P は #17B2FF、2P は #3CECA8
- 試作: URL に `?style=new` を付けた時だけ、斜めの帯・網点・注意の縞の見た目（`assets/css/style-new.css`）になる。左下の切り替えで今の見た目と見比べられる
- ステージの色: 地下墓地 #FF2D78 / 浴場地下 #8A4DFF / 大図書館 #7CE03A / 夕焼けの塔 #FFD21E / 採石場 #A7A7D6 / 領主の館 #D63CFF / 市庁舎 #22B8E8 / 城門橋 #FF4A3A / 大聖堂 #2EE6D6 / 船着き場 #3A7BFF

## 言語

文章は `<span lang="ja">…</span><span lang="en">…</span>` のように両方を HTML に書き、選んでいない方を CSS で隠します。画像の説明は `alt` に日本語、`data-alt-en` に英語を書きます。言語は `?lang=ja|en` → 前に選んだ言語（localStorage の `jbi-lang`）→ ブラウザの言語、の順で決まります。

## 動きと保存

- オープニングは「とばす」・Esc・Enter・スクロールで飛ばせます。同じタブで 2 回目からは弾の集まりを省きます（sessionStorage の `jbi-opened`）
- OS の「動きを減らす」設定では、演出なしで最終の画面を出します
- 映像は音なし。画面から外れると止まります
- Cookie・アクセス解析はありません。PV に YouTube を使う場合は、再生ボタンを押した時だけ youtube-nocookie.com を読み込みます

## 文章の根拠

ゲーム本体（`Bullet-Hell` リポジトリの develop ブランチ）を読み取りだけで参照しています。

- ステージの並び・場所の名前・ふりがな: `Assets/Scripts/Stages/StageCatalog.cs`（敵の名前はゲームと同じく出さない）
- 操作: `Assets/Scripts/Managers/InputManager.cs`、人数の切り替え: `Assets/Scripts/Managers/GManager.cs`
- 得点（グレイズ・ダッシュ回避・連打の減点）: `Assets/Scripts/Managers/ScoreRules.cs`
- フォント: `Assets/Fonts/` の各フォントと OFL 文書、素材: `Docs/asset-credits.md`、曲の差し替え（古の街道・王宮探索）はコミット 36c8609f9

## ローカル確認

このフォルダーで `python -m http.server 8000 --bind 127.0.0.1` を実行し、http://127.0.0.1:8000/ を開きます（筆の帯の形は file:// では出ません）。

## 公開

main ブランチの / (root) を GitHub Pages で公開しています。`.nojekyll` は消さないでください。
