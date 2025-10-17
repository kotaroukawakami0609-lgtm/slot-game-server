# マルチプレイヤースロットゲーム - 完全仕様書

## 📋 プロジェクト概要

### 基本情報
- **プロジェクト名**: Balance-Focused Multiplayer Slot Game
- **バージョン**: 1.0.0
- **開発完了日**: 2025年10月18日
- **対応プレイヤー数**: 最大15人同時接続（推奨5-10人）
- **ゲームタイプ**: リアルタイムマルチプレイヤー収支管理型スロットゲーム

### 🎯 プロジェクト目標
- バランス重視のスロットゲーム体験
- リアルタイム収支同期システム
- チーム対戦機能
- 永続的な統計データ管理
- 友達との気軽なオンライン対戦

## 🏗️ システム構成

### バックエンド技術スタック
```
Node.js v22.20.0
├── Express.js (Webサーバーフレームワーク)
├── Socket.IO (リアルタイム通信)
├── MongoDB Atlas (クラウドデータベース)
├── JWT (認証システム)
├── bcrypt (パスワード暗号化)
├── Express Rate Limiter (API制限)
└── CORS (クロスオリジン対応)
```

### フロントエンド技術スタック
```
HTML5/CSS3/JavaScript ES6+
├── Socket.IO Client (リアルタイム通信)
├── Fetch API (REST通信)
├── LocalStorage (ローカルデータ保存)
└── Responsive Design (レスポンシブ対応)
```

### インフラ構成
```
開発環境:
├── Windows PowerShell
├── Docker Desktop + WSL2
├── Git v2.51.0.2
└── MongoDB Atlas (ap-northeast-1)

デプロイメント:
├── ローカルサーバー (localhost:3000)
├── ngrok v3.30.0 (外部トンネリング)
└── GitHub Repository (コードバックアップ)
```

## 📁 プロジェクト構造

```
c:\discordbot/
├── server/                     # バックエンドサーバー
│   ├── app.js                 # メインサーバーファイル
│   ├── package.json           # 依存関係管理
│   ├── package-lock.json      # ロックファイル
│   ├── .env                   # 環境変数設定
│   └── node_modules/          # 依存パッケージ (416個)
├── web_version/               # フロントエンドクライアント
│   ├── index.html            # メインHTMLページ
│   ├── slot-game.js          # ゲームロジック
│   ├── styles.css            # スタイルシート
│   └── manifest.json         # PWA設定
├── README.md                 # プロジェクト仕様書
└── .git/                     # Gitリポジトリ
```

## 🎮 ゲーム仕様

### 基本ゲーム機能
1. **スロットマシン**
   - 3リール × 3行のスロットマシン
   - バランス調整済み配当システム
   - アニメーション付きリール回転

2. **収支管理システム**
   - 個人収支追跡
   - 期間別収支統計
   - リアルタイム収支同期

3. **チーム機能**
   - チーム作成・参加
   - チーム収支合計
   - チーム対戦モード

### マルチプレイヤー機能
1. **リアルタイム同期**
   - WebSocket通信によるリアルタイム更新
   - 全プレイヤー収支の即座な反映
   - チーム統計の自動更新

2. **ユーザー管理**
   - ユーザー登録・ログイン
   - JWT認証システム
   - セッション管理

3. **統計機能**
   - グローバル統計表示
   - 個人統計詳細
   - チーム別ランキング

## 🔧 API仕様

### REST API エンドポイント (17個)

#### 認証系API
```
POST /api/auth/register       # ユーザー登録
POST /api/auth/login          # ユーザーログイン
GET  /api/auth/me             # ユーザー情報取得
```

#### ユーザー管理API
```
GET    /api/users             # 全ユーザー一覧
GET    /api/users/:id         # 特定ユーザー情報
PUT    /api/users/:id         # ユーザー情報更新
DELETE /api/users/:id         # ユーザー削除
```

#### ゲーム機能API
```
POST /api/slot/spin           # スロット回転
GET  /api/slot/balance/:id    # 収支取得
POST /api/slot/balance/:id    # 収支更新
```

#### 統計API
```
GET /api/stats/global         # グローバル統計
GET /api/stats/user/:id       # ユーザー統計
GET /api/stats/period/:id     # 期間統計
```

#### チーム管理API
```
POST /api/team/create         # チーム作成
POST /api/team/join           # チーム参加
GET  /api/team/:id            # チーム情報取得
DELETE /api/team/leave/:id    # チーム退出
```

### WebSocket イベント
```
接続系:
- connection          # ユーザー接続
- disconnect          # ユーザー切断
- joinRoom            # ルーム参加

ゲーム系:
- spinResult          # スロット結果
- updateBalance       # 収支更新
- updateTeamStats     # チーム統計更新
- updateGlobalStats   # グローバル統計更新
```

## 🗄️ データベース設計

### MongoDB Atlas 構成
- **リージョン**: Asia Pacific (Tokyo) - ap-northeast-1  
- **プラン**: Free Tier (512MB)
- **接続**: クラウド接続文字列使用

### コレクション設計

#### users コレクション
```javascript
{
  _id: ObjectId,
  username: String,      // ユーザー名 (ユニーク)
  email: String,         // メールアドレス (ユニーク)  
  password: String,      // ハッシュ化パスワード
  createdAt: Date,       // 作成日時
  updatedAt: Date        // 更新日時
}
```

#### balances コレクション  
```javascript
{
  _id: ObjectId,
  userId: ObjectId,      // ユーザーID (参照)
  total: Number,         // 総収支
  period: Number,        // 期間収支
  lastUpdated: Date      // 最終更新日時
}
```

#### teams コレクション
```javascript
{
  _id: ObjectId,
  name: String,          // チーム名
  members: [ObjectId],   // メンバーIDリスト
  balance: Number,       // チーム総収支
  createdAt: Date        // 作成日時
}
```

#### statistics コレクション
```javascript
{
  _id: ObjectId,
  userId: ObjectId,      // ユーザーID (参照)
  totalSpins: Number,    // 総回転数
  totalWins: Number,     // 総勝利数
  winRate: Number,       // 勝率
  biggestWin: Number,    // 最大勝利金額
  date: Date             // 統計日時
}
```

## 🚀 デプロイメント構成

### 現在の運用環境

#### ローカルサーバー
```
URL: http://localhost:3000
環境: development
ホスト: 0.0.0.0 (全IPからアクセス可能)
```

#### 外部アクセス (ngrok)
```
URL: https://elli-abrogable-zetta.ngrok-free.dev
プロトコル: HTTPS
トンネリング: ngrok v3.30.0
```

#### データベース
```
MongoDB Atlas: クラウド接続
リージョン: ap-northeast-1 (Tokyo)
接続文字列: 環境変数で管理
```

### セキュリティ設定
```javascript
// CORS設定
origin: ['http://localhost:3000', 'https://*.ngrok-free.dev']

// レート制限  
windowMs: 15 * 60 * 1000  // 15分
max: 100                   // 100リクエスト/15分

// プロキシ信頼設定
trustProxy: true          // ngrok対応

// JWT設定
expiresIn: '1h'          // 1時間有効
```

## 📊 パフォーマンス仕様

### 処理性能
- **同時接続**: 最大15ユーザー (推奨5-10ユーザー)
- **レスポンス時間**: < 200ms (ローカル)
- **データベース応答**: < 500ms (MongoDB Atlas)
- **WebSocket遅延**: < 100ms

### リソース使用量
- **サーバーメモリ**: ~50MB (Node.js プロセス)
- **データベース**: 512MB制限 (MongoDB Atlas Free)
- **ネットワーク帯域**: ~1MB/分 (10ユーザー時)

## 🔄 運用手順

### サーバー起動手順
```powershell
# 1. ディレクトリ移動
Set-Location c:\discordbot\server

# 2. 環境変数設定 (必要に応じて)
$env:NODE_ENV = "development"

# 3. サーバー起動
node app.js

# 4. ngrokトンネル起動 (別ターミナル)
C:\ngrok\ngrok.exe http 3000
```

### 確認手順
```powershell
# サーバー動作確認
# ブラウザで http://localhost:3000 にアクセス

# 外部アクセス確認  
# ブラウザで ngrok URL にアクセス

# プロセス確認
Get-Process -Name "node"
netstat -an | findstr ":3000"
```

### トラブルシューティング
```powershell
# ポート確認
netstat -ano | Select-String ":3000"

# プロセス終了 (必要時)
taskkill /PID <プロセスID> /F

# ログ確認
# サーバーターミナルでログ出力を確認
```

## 📈 今後の拡張計画

### Phase 2 機能追加候補
- [ ] ユーザーアバター機能
- [ ] チャット機能 
- [ ] 詳細統計グラフ
- [ ] 課金システム
- [ ] モバイルアプリ版

### インフラ改善計画
- [ ] 本格的なクラウドデプロイ (AWS/GCP)
- [ ] Redis キャッシュ導入
- [ ] CDN導入 (画像・静的ファイル)
- [ ] 監視システム導入

## 📞 サポート・連絡先

### リポジトリ情報
- **GitHub**: https://github.com/kotaroukawakami0609-lgtm/slot-game-server.git
- **サイズ**: 8.87MiB (完全コードベース)
- **最終更新**: 2025年10月18日

### 技術サポート
- Node.js v22.20.0 対応
- MongoDB Atlas 接続サポート
- ngrok 外部アクセス対応
- Windows PowerShell 環境

---

## ✅ プロジェクト完了状況

🎊 **100% 完了** 🎊

- ✅ サーバー実装完了
- ✅ クライアント実装完了  
- ✅ データベース構築完了
- ✅ 外部アクセス環境完了
- ✅ マルチプレイヤー機能完了
- ✅ 統計・チーム機能完了

**稼働中URL**: https://elli-abrogable-zetta.ngrok-free.dev

Ready for Production! 🚀