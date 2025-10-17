const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },           // 全期間収支
  period: { type: Number, default: 0 },          // 期間別収支（リセット可能）
  periodStartDate: { type: Date, default: Date.now } // 期間開始日時
});

const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },    // チームID
  teamName: { type: String, required: true },               // チーム名
  description: { type: String, default: '' },               // チーム説明
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // メンバーリスト
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // オーナーID
  balance: balanceSchema,                                    // チーム収支
  maxMembers: { type: Number, default: 10 },                // 最大メンバー数
  isPublic: { type: Boolean, default: true },               // 公開チームフラグ
  createdAt: { type: Date, default: Date.now },             // 作成日時
  updatedAt: { type: Date, default: Date.now }              // 更新日時
});

// 更新日時を自動設定
teamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// インデックス設定
teamSchema.index({ teamId: 1 });
teamSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Team', teamSchema);