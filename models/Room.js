const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },    // ルームID
  roomName: { type: String, required: true },               // ルーム名
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 参加ユーザー
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // オーナーID
  state: { 
    type: String, 
    enum: ['waiting', 'playing', 'finished'], 
    default: 'waiting' 
  },                                                         // ルーム状態
  maxPlayers: { type: Number, default: 10 },                // 最大参加者数
  isPublic: { type: Boolean, default: true },               // 公開ルームフラグ
  gameLog: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,                                          // アクション内容
    result: String,                                          // 結果
    timestamp: { type: Date, default: Date.now }
  }],                                                        // 進行ログ
  createdAt: { type: Date, default: Date.now },             // 作成日時
  updatedAt: { type: Date, default: Date.now }              // 更新日時
});

// 更新日時を自動設定
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// インデックス設定
roomSchema.index({ roomId: 1 });
roomSchema.index({ ownerId: 1 });
roomSchema.index({ state: 1 });

module.exports = mongoose.model('Room', roomSchema);