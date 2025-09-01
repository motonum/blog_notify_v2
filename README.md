# blog_notify_v2

ブログの更新を検知し、新しい記事の情報を Discord へ通知する Google Apps Script です。

## 概要

このプロジェクトは、以前作成した[blog_notify](https://github.com/motonum/blog_notify/)の通知先を Discord に変更した後継版です。(LINE Notify のサービスが終了したため)

今回のアップデートにあたり、単に通知先を変更するだけでなく、以下の改善を加えました。

- 通知メッセージに記事の概要（サマリー）を追加
- Git でのバージョン管理を意識した構成
- 環境変数を注入して GAS へのスムーズなデプロイを可能にするビルドスクリプトの作成

## 主な機能

- **Atom フィード監視**: 指定された URL の Atom フィードを定期的にチェックします。
- **Discord への自動通知**: 新しい記事（デフォルトでは過去 24 時間以内）を検知すると、Discord の Webhook URL へ通知を送信します。
- **詳細な通知内容**: 通知メッセージには、記事のタイトル、概要、URL が含まれ、Discord 上での視認性が高められています。
- **秘匿情報の分離**: Webhook URL や認証情報などをコードから分離し、ローカルの環境変数で管理する仕組みを導入しています。

## 動作の仕組み

このシステムは、GAS 上で実行されるメインスクリプトと、ローカルで実行するビルドスクリプトの 2 つで構成されています。

### 1. ビルド（ローカル環境）

開発用の`main.js`には、`{{WEBHOOK_URL}}`のようなプレースホルダーを記述しておきます。  
ローカルで`bin/build.sh [--option]` を実行すると、`.env`ファイルから環境変数を読み込み、これらのプレースホルダーを実際の値（Discord の Webhook URL など）に置換した`gas/main.js`を生成します。

この仕組みにより、Git リポジトリに機密情報を含めることなく、安全にコードを管理できます。

### 2. 実行（Google Apps Script 環境）

1.  ビルドで生成された`gas/main.js`を Google Apps Script プロジェクトに`bin/deploy.sh`にてデプロイ。
2.  GAS の日付ベースのタイマーによるトリガーの機能を使い、`refreshTrigger()`を実行することで GAS の**時間主導型トリガー**が毎日定刻に`main`関数を実行するよう設定。
3.  `UrlFetchApp`サービスを使い、対象ブログの Atom フィードを取得。
4.  `XmlService`でフィードをパースし、最新記事の投稿日時を確認。
5.  投稿日時が 24 時間以内であれば、記事情報を整形し、Discord の Webhook URL へ POST リクエストを送信して通知を実行。

## 使用技術

- Google Apps Script
- JavaScript (ES2015+)
- Node.js （ビルド用）
- Discord Webhooks
