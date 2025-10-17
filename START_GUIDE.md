# サーバー起動ガイド

## 1. 依存関係インストール
cd c:\discordbot\server
npm install

## 2. 環境変数設定
# .env.example を .env にコピー
cp .env.example .env

# .env ファイル編集（以下の内容を設定）
PORT=3000
MONGODB_URI=mongodb://localhost:27017/slotgame
JWT_SECRET=your-very-secret-jwt-key-here-change-this-in-production
NODE_ENV=development
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8080

## 3. サーバー起動オプション

### 開発モード（自動再起動）
npm run dev

### 本番モード
npm start

## 4. 起動確認
# ブラウザまたはcurlで確認
curl http://localhost:3000/health

# 正常な場合のレスポンス例
# {"status":"OK","timestamp":"2025-10-18T...","environment":"development"}

## 5. トラブルシューティング

### MongoDB接続エラー
- MongoDB が起動しているか確認
- .env の MONGODB_URI が正しいか確認
- ファイアウォール設定確認

### ポート競合エラー
- ポート3000が使用中でないか確認
- .env の PORT を変更（例: 3001）

### 依存関係エラー
npm install --force
または
rm -rf node_modules package-lock.json
npm install