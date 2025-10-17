// データベースモデルのエクスポート
const User = require('./User');
const Team = require('./Team');
const GlobalStats = require('./GlobalStats');
const Room = require('./Room');

module.exports = {
  User,
  Team,
  GlobalStats,
  Room
};