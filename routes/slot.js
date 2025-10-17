const express = require('express');
const { User, Team, GlobalStats } = require('../models');
const auth = require('../middleware/auth');
const SlotLogic = require('../utils/SlotLogic');
const router = express.Router();

// スロットプレイ実行
router.post('/play', auth, async (req, res) => {
  try {
    const { setting = 1 } = req.body;
    
    const user = await User.findById(req.user.id).populate('teamId');
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // スロット抽選実行
    const slotLogic = new SlotLogic(setting);
    const lotteryResult = slotLogic.lottery();
    const reelIndices = slotLogic.generateReelPositions(lotteryResult);
    const judgeResult = slotLogic.judgeWin(reelIndices, lotteryResult);

    const bet = 3; // 固定ベット
    const payout = judgeResult.payout;
    const balance = payout - bet; // 収支計算

    // ゲーム履歴追加
    const gameNumber = user.totalGames + 1;
    const historyEntry = {
      game: gameNumber,
      result: lotteryResult,
      payout,
      bet,
      balance,
      isWin: judgeResult.payout > 0,
      isBonus: judgeResult.bonusGame,
      timestamp: new Date()
    };

    // ユーザーデータ更新
    user.totalGames += 1;
    user.balance.total += balance;
    user.balance.period += balance;
    
    if (lotteryResult.includes('BIG') || lotteryResult === 'BIG') {
      user.bigCount += 1;
    }
    if (lotteryResult.includes('REG') || lotteryResult === 'REG') {
      user.regCount += 1;
    }

    user.history.push(historyEntry);
    
    // 履歴を最新100件に制限
    if (user.history.length > 100) {
      user.history = user.history.slice(-100);
    }

    await user.save();

    // チーム収支更新
    if (user.teamId) {
      user.teamId.balance.total += balance;
      user.teamId.balance.period += balance;
      await user.teamId.save();
    }

    // グローバル統計更新
    const globalStats = await GlobalStats.getInstance();
    globalStats.totalGames += 1;
    globalStats.globalBalance.total += balance;
    globalStats.globalBalance.period += balance;
    
    if (lotteryResult.includes('BIG') || lotteryResult === 'BIG') {
      globalStats.totalBigCount += 1;
    }
    if (lotteryResult.includes('REG') || lotteryResult === 'REG') {
      globalStats.totalRegCount += 1;
    }

    await globalStats.save();

    // WebSocket通知用のイベントを送信（実装は後で）
    req.app.get('io')?.emit('playResult', {
      userId: user.userId,
      result: lotteryResult,
      payout,
      balance,
      userBalance: user.balance,
      teamBalance: user.teamId ? user.teamId.balance : null,
      globalBalance: globalStats.globalBalance
    });

    res.json({
      result: lotteryResult,
      reelIndices,
      payout,
      balance,
      userBalance: user.balance,
      teamBalance: user.teamId ? user.teamId.balance : null,
      judgeResult,
      gameNumber
    });

  } catch (error) {
    console.error('Slot play error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ゲーム履歴取得
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const history = user.history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      history,
      totalCount: user.history.length
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;