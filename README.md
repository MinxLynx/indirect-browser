# Relay — 間接ウェブブラウザ

公開ウェブページの本文・リンクを取得して表示し、リンク先も同じ画面で読める静的ウェブアプリです。GitHub Pagesで配信でき、iPhoneのSafariで使用できます。

## 使い方

URLを入力して「開く」を押してください。本文のリンクを押すとそのページを取得します。「←」「→」でアプリ内の履歴を移動できます。「↻」で再取得、「中止」で読み込みを止めます。「本文コピー」で本文と出典URLをコピーできます。「元サイト」で元のページを別タブで開けます。

画像は初期状態ではオフです。必要なときに「画像」をオンにしてください。履歴24ページ、取得キャッシュ12ページはタブのメモリ内にのみ保持し、再読み込みで消えます。画像設定も保存しません。Safari本体の戻る操作ではなく、アプリの矢印を使用してください。

## iPhone

公開URLをSafariで開いてください。共有メニューの「ホーム画面に追加」で、ホーム画面からも開けます。インターネット接続が必要です。URLの入力は16pxで、タップ時の自動ズームを避けています。

## Windowsで確認

Node.js 20以降が必要です。`start.bat` をダブルクリックするか、このフォルダーで `npm start` を実行して http://127.0.0.1:4178 を開きます。`npm test` でURL検証・取得レスポンス解析を確認します。依存パッケージのインストールやビルドは不要です。

## GitHub Pages

このフォルダーをリポジトリのルートにしてmainへpushします。GitHubの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定すると、`.github/workflows/pages.yml` がテスト後に `public/` を公開します。無料アカウントでは公開リポジトリを使用してください。

## 取得のしくみと制限

`https://r.jina.ai/` に閲覧先URLを付けて本文を取得し、Markdownをローカル同梱のMarkedで変換、DOMPurifyでサニタイズして表示します。フォーム、埋め込みページ、スクリプトを実行しません。リンクはhttp/httpsの公開ドメインに限定し、相対リンクは取得元URLに対して解決します。取得タイムアウトは60秒です。

入力URLはJina AIへ送信されます。非公開情報を含むURLは入力しないでください。画像オンでは画像配信元にアクセスします。匿名取得サービスにはレート制限があり、ログインページ、アクセス制限、重いページ、JavaScriptへの依存によって取得できない場合があります。元のレイアウトを複製するブラウザやログイン操作の代替ではありません。本文の欠落・変換やキャッシュによる古い情報が含まれることがあります。APIキーは使用していません。

参照: [Jina Reader](https://jina.ai/reader/)、[GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## ファイル

`public/index.html` が画面、`style.css` がデザイン、`app.js` がナビゲーション・取得・表示、`core.js` がURL検証とレスポンス解析です。新機能はこの独立フォルダーに追加できます。

同梱ライブラリ: Marked 18.1.0 (MIT)、DOMPurify 3.4.16 (Apache-2.0 / MPL-2.0)。ライセンスは `public/vendor/` にあります。
