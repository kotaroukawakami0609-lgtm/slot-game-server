const express = require('express');
const { Team, User } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// チーム作成
router.post('/create', auth, async (req, res) => {
  try {
    const { teamName, description = '', maxMembers = 10, isPublic = true } = req.body;

    if (!teamName) {
      return res.status(400).json({ error: 'チーム名が必要です' });
    }

    // チームID生成（ユニーク）
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 既存チーム名チェック
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ error: 'このチーム名は既に使用されています' });
    }

    // チーム作成
    const team = new Team({
      teamId,
      teamName,
      description,
      maxMembers,
      isPublic,
      ownerId: req.user.id,
      members: [req.user.id],
      balance: {
        total: 0,
        period: 0,
        periodStartDate: new Date()
      }
    });

    await team.save();

    // ユーザーのチームID更新
    await User.findByIdAndUpdate(req.user.id, { teamId: team._id });

    res.status(201).json({
      message: 'チームを作成しました',
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        description: team.description,
        maxMembers: team.maxMembers,
        isPublic: team.isPublic,
        memberCount: team.members.length,
        balance: team.balance
      }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// チーム参加
router.post('/join', auth, async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'チームIDが必要です' });
    }

    const team = await Team.findOne({ teamId }).populate('members', 'userId userName');
    if (!team) {
      return res.status(404).json({ error: 'チームが見つかりません' });
    }

    // 既に参加しているかチェック
    if (team.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(400).json({ error: '既にこのチームに参加しています' });
    }

    // 定員チェック
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ error: 'チームの定員に達しています' });
    }

    // 現在のチームから脱退
    const currentUser = await User.findById(req.user.id);
    if (currentUser.teamId) {
      await Team.findByIdAndUpdate(currentUser.teamId, {
        $pull: { members: req.user.id }
      });
    }

    // 新しいチームに参加
    team.members.push(req.user.id);
    await team.save();

    // ユーザーのチームID更新
    currentUser.teamId = team._id;
    await currentUser.save();

    res.json({
      message: 'チームに参加しました',
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        description: team.description,
        memberCount: team.members.length,
        balance: team.balance
      }
    });

  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// チーム退出
router.post('/leave', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('teamId');
    if (!user.teamId) {
      return res.status(400).json({ error: 'チームに参加していません' });
    }

    const team = user.teamId;

    // オーナーの場合は特別処理
    if (team.ownerId.toString() === req.user.id) {
      if (team.members.length > 1) {
        // オーナー権限を次のメンバーに移譲
        const nextOwner = team.members.find(member => member.toString() !== req.user.id);
        team.ownerId = nextOwner;
      } else {
        // 最後のメンバーの場合はチーム削除
        await Team.findByIdAndDelete(team._id);
        user.teamId = null;
        await user.save();
        
        return res.json({ message: 'チームを削除しました' });
      }
    }

    // メンバーリストから削除
    team.members = team.members.filter(member => member.toString() !== req.user.id);
    await team.save();

    // ユーザーのチームID削除
    user.teamId = null;
    await user.save();

    res.json({ message: 'チームから退出しました' });

  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// チーム一覧取得
router.get('/', auth, async (req, res) => {
  try {
    const { isPublic = true, limit = 50, offset = 0 } = req.query;

    const query = isPublic === 'true' ? { isPublic: true } : {};
    
    const teams = await Team.find(query)
      .populate('members', 'userId userName')
      .populate('ownerId', 'userId userName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json({
      teams: teams.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        description: team.description,
        memberCount: team.members.length,
        maxMembers: team.maxMembers,
        balance: team.balance,
        owner: team.ownerId,
        isPublic: team.isPublic,
        createdAt: team.createdAt
      }))
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// チーム詳細取得
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findOne({ teamId: req.params.id })
      .populate('members', 'userId userName balance totalGames bigCount regCount isOnline')
      .populate('ownerId', 'userId userName');

    if (!team) {
      return res.status(404).json({ error: 'チームが見つかりません' });
    }

    res.json({
      teamId: team.teamId,
      teamName: team.teamName,
      description: team.description,
      balance: team.balance,
      maxMembers: team.maxMembers,
      isPublic: team.isPublic,
      owner: team.ownerId,
      members: team.members.map(member => ({
        userId: member.userId,
        userName: member.userName,
        balance: member.balance,
        totalGames: member.totalGames,
        bigCount: member.bigCount,
        regCount: member.regCount,
        isOnline: member.isOnline
      })),
      createdAt: team.createdAt
    });

  } catch (error) {
    console.error('Get team detail error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

module.exports = router;