# Just Beat It 公式サイト

Ark Art Games の一人用弾幕アクション「Just Beat It」（Steam App ID 5429530）の GitHub Pages 用静的サイトです。HTML / CSS / JavaScript のみ。ビルド・npm・外部 JS ライブラリは不要です。

公開予定 URL: https://raymee675.github.io/Just-Beat-It/

## 構成

| 内容 | 日本語 | English |
| --- | --- | --- |
| ゲーム紹介 | index.html | en/index.html |
| マニュアル | manual/index.html | en/manual/index.html |
| FAQ・問い合わせ | support/index.html | en/support/index.html |
| 期間限定無料配布 | download/index.html | en/download/index.html |

ほかに404.html、.nojekyll、robots.txt。内部リンク・CSS・JS・画像は相対パス、canonical / OGP は公開予定 URL を使用しています。

## 公開

main ブランチの / (root) を GitHub Pages で公開しています。main に push すると数分で反映されます。

.nojekyll を削除しないでください。公開先を変更する場合は HTML の canonical / OGP も更新が必要です。

## 日常の設定変更

運用で編集する設定は **assets/js/config.js のみ**です。変更後はブラウザーの再読み込みで確認してください。

- steamUrl: Steam ボタンの URL。JavaScript 無効時は HTML の App ID 5429530 へのリンクが残ります。
- contactFormUrl: Google フォームの公開 URL。https://docs.google.com/forms/... または https://forms.gle/... 。空では「準備中」で無効です。フォーム側の質問・情報の扱いがサポートページの案内と一致するよう設定してください。
- freeDownload.startsAt / endsAt: タイムゾーン付き ISO 8601（例 2026-11-01T00:00:00+09:00）。開始を含み、終了を含みません。
- freeDownload.url: GitHub Releases の ZIP 直リンク。https://github.com/owner/repo/releases/download/tag/JustBeatIt.zip の形です。
- version / sizeLabel / sha256: 版、ZIP サイズ、ZIP の SHA-256（64桁）。実ファイルと照合してください。空の場合は「未記載／未掲載」と表示します。

SHA-256 は PowerShell の Get-FileHash -Algorithm SHA256 "ZIPのパス" で取得できます。
配布を止めるには startsAt、endsAt、url を空に戻します。最終納品時は全項目を空にしています。

## 配布状態

| 状態 | 条件 | 表示 |
| --- | --- | --- |
| なし | 日時か URL が空・不正、終了≦開始 | 配布のナビ・告知を非表示。配布ページに現在配布なし＋Steam |
| 予告 | 現在＜開始 | トップと配布ページに開始日時。ダウンロード不可 |
| 配布中 | 開始≦現在＜終了 | 全ページのナビ・フッターに配布リンク、トップに告知と残り時間。配布ページに ZIP・版・サイズ・ハッシュ・導入手順 |
| 終了 | 終了≦現在 | 配布リンク・告知を非表示。配布ページに終了＋Steam |

日時は日英とも JST (UTC+09:00)。1秒ごとに残り時間と状態を更新し、OS の時計を使用します。これはリンクの表示制御であり GitHub Releases のアクセス制限ではありません。配布自体を期間で止める場合、終了時に運用者が Release の ZIP も公開停止してください。

## ローカル確認

このフォルダーで python -m http.server 8000 --bind 127.0.0.1 を実行し、http://127.0.0.1:8000/ を開きます。停止は Ctrl+C。正常な Python 3 が必要です。

検証では config.js に開始 2026-11-01T00:00:00+09:00、終了 2026-11-08T00:00:00+09:00、仮 ZIP URL を設定し、次を開きます。実ダウンロードは不要です。

- 予告: download/?now=2026-10-31T12%3A00%3A00%2B09%3A00
- 配布中: download/?now=2026-11-03T12%3A00%3A00%2B09%3A00
- 終了: download/?now=2026-11-08T00%3A00%3A00%2B09%3A00
- なし: 設定を空へ戻して確認

?now= はタイムゾーン付き ISO 日時のみ有効。+ は %2B にしてください。不正値は実時刻へ戻ります。ページを開いた後は指定時刻から経過時間が進みます。確認後は必ず config と URL を元に戻してください。

## 外部通信とアクセシビリティ

独自 Cookie・アクセス解析はありません。演出のオン／オフのみ localStorage（jbi-motion）、オープニングの表示済み状態のみ sessionStorage（jbi-opening）に保存します。保存できない場合も閲覧できます。見出しは Google Fonts の外部 CSS を使用し、取得できない場合は端末の明朝体へフォールバックします。Steam ウィジェットは表示ボタンを押した時だけ iframe を読み込みます（loading=lazy）。Steam / Google フォームのリンク先には各サービスの情報の扱いが適用されます。

JavaScript 無効時も本文・Steam・日英ナビ・スクリーンショットの元画像リンクは使えます。無料配布情報には JavaScript が必要です。ライトボックスは Esc／閉じるボタン／背景で閉じ、元のリンクにフォーカスを戻します。「動きを減らす」設定では装飾を停止します。

## 文章の根拠と更新

Bullet-Hell リポジトリは読み取りのみ。紹介は Docs/steam-store-copy.md、マニュアルは Assets/Scripts/Steam/ 内の SteamText.cs、SteamLocalizedText.cs、SteamSettingsOverlay.cs、SteamAudioSettings.cs、SteamVisualSettings.cs と Assets/Scripts/Managers/ScoreRules.cs、PlayerController.cs を参照。ステージ名は SteamStageTranslations.cs、10ステージ×3難易度は Builds/Steam/steam-build-manifest.txt に基づきます。

最新の PlayerController.cs に合わせ、前のダッシュ移動終了から0.40秒未満の連続ダッシュには無敵が付かない点を明記しています。評価の表示項目は SteamText.cs に基づきます。ランクの算定閾値は指定された出典にないため掲載していません。

環境は Docs/steam-store-assets/5429530/minimum-gpu-saved-2026-10-19.json、ready/confirmed-settings.json、Docs/steam-store-entry-checklist.md を参照。指定の 5429530/confirmed-settings.json は見つかりませんでした。CPU・RAM・容量・特定 Windows バージョン・推奨環境・性能保証は未確定のため掲載していません。GPU は保存されたストア項目であり、今回実機性能を測定したものではありません。

配布 ZIP、フォーム URL、版、容量、ハッシュ、期間は運用者の入力待ちです。配布版と Steam 版の仕様差、再配布条件、終了後の利用条件は資料にないため断定していません。ゲーム仕様を変更した場合は日英両方の HTML を更新してください。

404 は深い URL からも相対参照を解決できるよう、JavaScript で相対 base を補正します。JavaScript 無効時の深い404 URL では画像・内部リンクの解決に制限がありますが、絶対 URL の Steam リンクと注記は残ります。

## サイトの演出

実プレイ映像をヒーローに表示し、物語の引用と「部屋 → 地図 → 古都」の映像を並べています。引用は `Docs/steam-store-assets/5429530/ready/copy/about_japanese.bbcode.txt` と `about_english.bbcode.txt` の原文です。

`fx-core.js` が演出設定・入場・ナビ・スクロール、`fx-canvas.js` がロゴのベクター→ドット変化・Steam 装飾・質感、`fx-ui.js` が画像ビューア・ステージ選択、`media.js` が映像と FAQ の開閉を担当します。外部 JS やビルドは不要です。

ヘッダーとフッターの「演出 オン／オフ」で切り替えます。OS の reduced-motion が優先され、自動送り・ワイプ・明滅も停止します。映像はすべて無音です。reduced-motion・演出オフ・通信の saveData では映像を読み込まずポスターを表示します。ヒーローは幅 1280px 以上または DPR 1 超で 1080p、それ以外で 720p を選択します。一時停止／再生ボタンはキーボードでも使えます。物語の映像は近づいたときだけ読み込み、画面外・非表示タブでは全映像を一時停止します。

画像はメイン表示を押すと拡大し、左右キー・前後ボタン・Esc が使えます。ステージ選択は上下、難易度は左右、難易度ボタンは Tab でも移動できます。サポートの FAQ はキーボードで開閉でき、演出オフ・reduced-motion では即時に切り替わります。
