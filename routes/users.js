const express = require('express');
const { User } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// ユーザー情報取得
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id })
      .populate('teamId')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        balance: user.balance,
        totalGames: user.totalGames,
        bigCount: user.bigCount,
        regCount: user.regCount,
        setting: user.setting,
        team: user.teamId,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ユーザー設定更新
router.put('/:id', auth, async (req, res) => {
  try {
    const { userName, setting } = req.body;
    
    // 本人確認
    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: '権限がありません' });
    }

    const user = await User.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 更新
    if (userName) user.userName = userName;
    if (setting && setting >= 1 && setting <= 6) user.setting = setting;

    await user.save();

    res.json({
      message: 'ユーザー情報を更新しました',
      user: {
        userId: user.userId,
        userName: user.userName,
        setting: user.setting
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ユーザー一覧取得（ランキング用）
router.get('/', auth, async (req, res) => {
  try {
    const { sortBy = 'balance.total', order = 'desc', limit = 50 } = req.query;

    const sortOption = {};
    sortOption[sortBy] = order === 'desc' ? -1 : 1;

    const users = await User.find()
      .select('userId userName balance totalGames bigCount regCount teamId isOnline')
      .populate('teamId', 'teamName')
      .sort(sortOption)
      .limit(parseInt(limit));

    res.json({
      users: users.map(user => ({
        userId: user.userId,
        userName: user.userName,
        balance: user.balance,
        totalGames: user.totalGames,
        bigCount: user.bigCount,
        regCount: user.regCount,
        team: user.teamId,
        isOnline: user.isOnline
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;