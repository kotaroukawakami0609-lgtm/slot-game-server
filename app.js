require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

// ルートファイルのインポート
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const slotRoutes = require('./routes/slot');
const statsRoutes = require('./routes/stats');
const teamRoutes = require('./routes/team');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Socket.IOインスタンスをアプリに保存（ルートからアクセスするため）
app.set('io', io);

// プロキシ信頼設定（ngrok用）
app.set('trust proxy', 1);

// セキュリティミドルウェア
app.use(helmet());

// レート制限（プロキシ対応）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});
app.use(limiter);

// CORS設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
  credentials: true
}));

// JSONパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/slotgame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB に接続しました');
})
.catch((error) => {
  console.error('MongoDB 接続エラー:', error);
  process.exit(1);
});

// ルート設定
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slot', slotRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/team', teamRoutes);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({ 
    message: 'Balance-focused Multiplayer Slot Game API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      slot: '/api/slot',
      stats: '/api/stats',
      team: '/api/team',
      health: '/health'
    }
  });
});

// 404エラーハンドリング
app.use('*', (req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// エラーハンドリングミドルウェア
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'バリデーションエラー', details: error.message });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ error: '無効なIDです' });
  }
  
  res.status(500).json({ error: 'サーバー内部エラーが発生しました' });
});

// WebSocket接続処理
io.on('connection', (socket) => {
  console.log('ユーザーが接続しました:', socket.id);

  // ユーザー認証（JWTトークンを使用）
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      // JWTトークン検証（簡略化）
      socket.userId = data.userId;
      socket.join(`user_${data.userId}`);
      
      console.log(`ユーザー ${data.userId} が認証されました`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error('認証エラー:', error);
      socket.emit('authError', { error: '認証に失敗しました' });
    }
  });

  // ルーム参加
  socket.on('joinRoom', (data) => {
    const { roomId } = data;
    socket.join(roomId);
    socket.roomId = roomId;
    
    console.log(`ユーザー ${socket.userId} がルーム ${roomId} に参加しました`);
    socket.to(roomId).emit('userJoined', { userId: socket.userId });
  });

  // ルーム退出
  socket.on('leaveRoom', (data) => {
    const { roomId } = data;
    socket.leave(roomId);
    
    console.log(`ユーザー ${socket.userId} がルーム ${roomId} から退出しました`);
    socket.to(roomId).emit('userLeft', { userId: socket.userId });
  });

  // 収支更新通知
  socket.on('balanceUpdate', (data) => {
    const { userId, balance, teamBalance, globalBalance } = data;
    
    // 個人収支更新を全体に通知
    io.emit('updateBalance', {
      userId,
      totalBalance: balance.total,
      periodBalance: balance.period
    });

    // チーム収支更新を通知
    if (teamBalance) {
      io.emit('updateTeamStats', {
        teamId: teamBalance.teamId,
        teamBalance: teamBalance.balance
      });
    }

    // 全体収支更新を通知
    io.emit('updateGlobalStats', {
      globalBalance: globalBalance.total,
      globalPeriodBalance: globalBalance.period
    });
  });

  // 切断処理
  socket.on('disconnect', () => {
    console.log('ユーザーが切断しました:', socket.id);
    
    if (socket.roomId) {
      socket.to(socket.roomId).emit('userLeft', { userId: socket.userId });
    }
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`サーバーがポート ${PORT} で起動しました (127.0.0.1)`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`アクセスURL: http://127.0.0.1:${PORT}`);
});