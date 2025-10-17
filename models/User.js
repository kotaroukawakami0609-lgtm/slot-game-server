const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },           // 全期間収支
  period: { type: Number, default: 0 },          // 期間別収支（リセット可能）
  periodStartDate: { type: Date, default: Date.now } // 期間開始日時
});

const gameHistorySchema = new mongoose.Schema({
  game: { type: Number, required: true },        // ゲーム番号
  result: { type: String, required: true },      // 抽選結果
  payout: { type: Number, required: true },      // 払い出し枚数
  bet: { type: Number, default: 3 },             // ベット枚数
  balance: { type: Number, required: true },     // このゲームの収支 (payout - bet)
  isWin: { type: Boolean, required: true },      // 当たりフラグ
  isBonus: { type: Boolean, default: false },    // ボーナスフラグ
  timestamp: { type: Date, default: Date.now }   // タイムスタンプ
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },    // ユーザーID
  userName: { type: String, required: true },               // ユーザー名
  email: { type: String, required: true, unique: true },    // メールアドレス
  password: { type: String, required: true },               // パスワード（ハッシュ化済み）
  totalGames: { type: Number, default: 0 },                 // 総ゲーム数
  bigCount: { type: Number, default: 0 },                   // BIG回数
  regCount: { type: Number, default: 0 },                   // REG回数
  setting: { type: Number, default: 1, min: 1, max: 6 },    // 設定値
  balance: balanceSchema,                                    // 収支データ
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // 所属チームID
  history: [gameHistorySchema],                              // ゲーム履歴（最新100件）
  isOnline: { type: Boolean, default: false },              // オンライン状態
  lastLogin: { type: Date, default: Date.now },             // 最終ログイン日時
  createdAt: { type: Date, default: Date.now },             // 作成日時
  updatedAt: { type: Date, default: Date.now }              // 更新日時
});

// 履歴を最新100件に制限
userSchema.pre('save', function(next) {
  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
  this.updatedAt = Date.now();
  next();
});

// インデックス設定
userSchema.index({ userId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ teamId: 1 });

module.exports = mongoose.model('User', userSchema);