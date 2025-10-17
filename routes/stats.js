const express = require('express');
const { User, Team, GlobalStats } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// 全体収支取得
router.get('/global', auth, async (req, res) => {
  try {
    const globalStats = await GlobalStats.getInstance();
    
    res.json({
      totalPlayers: globalStats.totalPlayers,
      totalGames: globalStats.totalGames,
      totalBigCount: globalStats.totalBigCount,
      totalRegCount: globalStats.totalRegCount,
      globalBalance: globalStats.globalBalance,
      activeUsers: globalStats.activeUsers,
      lastUpdated: globalStats.lastUpdated
    });
  } catch (error) {
    console.error('Get global stats error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// 個人収支取得
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id })
      .select('userId userName balance totalGames bigCount regCount');

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      userId: user.userId,
      userName: user.userName,
      balance: user.balance,
      totalGames: user.totalGames,
      bigCount: user.bigCount,
      regCount: user.regCount,
      averageBalance: user.totalGames > 0 ? user.balance.total / user.totalGames : 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// チーム収支取得
router.get('/team/:id', auth, async (req, res) => {
  try {
    const team = await Team.findOne({ teamId: req.params.id })
      .populate('members', 'userId userName balance totalGames');

    if (!team) {
      return res.status(404).json({ error: 'チームが見つかりません' });
    }

    // メンバーの統計計算
    const memberStats = team.members.map(member => ({
      userId: member.userId,
      userName: member.userName,
      balance: member.balance,
      totalGames: member.totalGames
    }));

    const totalGames = team.members.reduce((sum, member) => sum + member.totalGames, 0);

    res.json({
      teamId: team.teamId,
      teamName: team.teamName,
      balance: team.balance,
      memberCount: team.members.length,
      totalGames,
      members: memberStats,
      averageBalance: totalGames > 0 ? team.balance.total / totalGames : 0
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// 期間別収支リセット
router.post('/reset-period', auth, async (req, res) => {
  try {
    const { target, targetId } = req.body; // target: 'user'|'team'|'global', targetId: 対象ID

    if (target === 'user') {
      const user = await User.findOne({ userId: targetId });
      if (!user) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }

      // 本人または管理者のみリセット可能
      if (req.user.userId !== targetId) {
        return res.status(403).json({ error: '権限がありません' });
      }

      user.balance.period = 0;
      user.balance.periodStartDate = new Date();
      await user.save();

      res.json({
        message: '個人の期間別収支をリセットしました',
        balance: user.balance
      });

    } else if (target === 'team') {
      const team = await Team.findOne({ teamId: targetId });
      if (!team) {
        return res.status(404).json({ error: 'チームが見つかりません' });
      }

      // チームオーナーのみリセット可能
      if (team.ownerId.toString() !== req.user.id) {
        return res.status(403).json({ error: '権限がありません' });
      }

      team.balance.period = 0;
      team.balance.periodStartDate = new Date();
      await team.save();

      res.json({
        message: 'チームの期間別収支をリセットしました',
        balance: team.balance
      });

    } else if (target === 'global') {
      // 管理者権限が必要（今回は省略、必要に応じて実装）
      return res.status(403).json({ error: '管理者権限が必要です' });

    } else {
      return res.status(400).json({ error: '無効なターゲットです' });
    }

  } catch (error) {
    console.error('Reset period error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ランキング取得
router.get('/ranking', auth, async (req, res) => {
  try {
    const { type = 'total', period = 'all', limit = 50 } = req.query;
    
    let sortField;
    if (period === 'period') {
      sortField = type === 'total' ? 'balance.period' : `${type}Count`;
    } else {
      sortField = type === 'total' ? 'balance.total' : `${type}Count`;
    }

    // ユーザーランキング
    const userRanking = await User.find()
      .select('userId userName balance totalGames bigCount regCount teamId')
      .populate('teamId', 'teamName')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    // チームランキング
    const teamRanking = await Team.find()
      .select('teamId teamName balance members')
      .populate('members', 'userId userName')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({
      userRanking: userRanking.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        userName: user.userName,
        balance: user.balance,
        totalGames: user.totalGames,
        bigCount: user.bigCount,
        regCount: user.regCount,
        team: user.teamId
      })),
      teamRanking: teamRanking.map((team, index) => ({
        rank: index + 1,
        teamId: team.teamId,
        teamName: team.teamName,
        balance: team.balance,
        memberCount: team.members.length
      }))
    });

  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;