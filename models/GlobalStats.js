const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },           // 全期間収支
  period: { type: Number, default: 0 },          // 期間別収支（リセット可能）
  periodStartDate: { type: Date, default: Date.now } // 期間開始日時
});

const globalStatsSchema = new mongoose.Schema({
  totalPlayers: { type: Number, default: 0 },              // 総プレイヤー数
  totalGames: { type: Number, default: 0 },                // 総ゲーム数
  totalBigCount: { type: Number, default: 0 },             // 総BIG回数
  totalRegCount: { type: Number, default: 0 },             // 総REG回数
  globalBalance: balanceSchema,                             // 全体収支
  activeUsers: { type: Number, default: 0 },               // アクティブユーザー数
  lastUpdated: { type: Date, default: Date.now }           // 最終更新日時
});

// 単一ドキュメントのみ許可（グローバル統計は1つだけ）
globalStatsSchema.statics.getInstance = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = new this();
    await stats.save();
  }
  return stats;
};

// 更新日時を自動設定
globalStatsSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('GlobalStats', globalStatsSchema);