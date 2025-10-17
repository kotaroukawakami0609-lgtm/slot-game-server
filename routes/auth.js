const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, GlobalStats } = require('../models');
const router = express.Router();

// ユーザー登録
router.post('/register', async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // バリデーション
    if (!userName || !email || !password) {
      return res.status(400).json({ error: 'すべてのフィールドが必要です' });
    }

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザーID生成（ユニーク）
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ユーザー作成
    const user = new User({
      userId,
      userName,
      email,
      password: hashedPassword,
      balance: {
        total: 0,
        period: 0,
        periodStartDate: new Date()
      }
    });

    await user.save();

    // グローバル統計更新
    const globalStats = await GlobalStats.getInstance();
    globalStats.totalPlayers += 1;
    await globalStats.save();

    // JWT生成
    const token = jwt.sign(
      { userId: user.userId, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        balance: user.balance
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードが必要です' });
    }

    // ユーザー検索
    const user = await User.findOne({ email }).populate('teamId');
    if (!user) {
      return res.status(400).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // パスワード確認
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    // オンライン状態更新
    user.isOnline = true;
    user.lastLogin = new Date();
    await user.save();

    // JWT生成
    const token = jwt.sign(
      { userId: user.userId, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'ログインしました',
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        balance: user.balance,
        totalGames: user.totalGames,
        bigCount: user.bigCount,
        regCount: user.regCount,
        team: user.teamId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ログアウト
router.post('/logout', async (req, res) => {
  try {
    // トークンから取得するため、認証ミドルウェアが必要
    const user = await User.findById(req.user.id);
    if (user) {
      user.isOnline = false;
      await user.save();
    }

    res.json({ message: 'ログアウトしました' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;