class SlotLogic {
  constructor(setting = 1) {
    this.setting = setting;
    
    // リール配列定義
    this.leftReel = ["ベル", "リプレイ", "ブドウ", "チェリー", "ブドウ", "リプレイ", "ブドウ", "ピエロ", "ブドウ", "リプレイ", "ブドウ", "チェリー", "ブドウ", "リプレイ", "ブドウ", "bar", "ブドウ", "リプレイ", "ブドウ", "7", "ブドウ"];
    this.middleReel = ["リプレイ", "7", "ブドウ", "リプレイ", "ブドウ", "チェリー", "ブドウ", "リプレイ", "ブドウ", "bar", "ブドウ", "リプレイ", "ブドウ", "ピエロ", "ブドウ", "リプレイ", "ブドウ", "ベル", "ブドウ", "リプレイ", "ブドウ"];
    this.rightReel = ["ブドウ", "7", "bar", "ブドウ", "リプレイ", "ブドウ", "チェリー", "ブドウ", "リプレイ", "ブドウ", "ピエロ", "ブドウ", "リプレイ", "ブドウ", "ベル", "ブドウ", "リプレイ", "ブドウ", "リプレイ", "ブドウ", "リプレイ"];
    
    // 設定別確率テーブル
    this.probabilities = this.getProbabilityTable(setting);
  }

  getProbabilityTable(setting) {
    const baseProbabilities = {
      1: {
        'BIG': 0.00257,
        'REG': 0.00157,
        'チェリー+BIG': 0.00108,
        'チェリー+REG': 0.00070,
        'ブドウ': 0.166,
        'ピエロ': 0.000915,
        'ベル': 0.000915,
        'リプレイ': 0.137,
        'チェリー': 0.0281
      }
    };
    
    return baseProbabilities[setting] || baseProbabilities[1];
  }

  lottery() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [yaku, prob] of Object.entries(this.probabilities)) {
      cumulative += prob;
      if (random < cumulative) {
        return yaku;
      }
    }
    
    return 'ハズレ';
  }

  generateReelPositions(result) {
    // 抽選結果に基づいてリール停止位置を決定
    const positions = [0, 0, 0];
    
    if (result === 'BIG' || result === 'チェリー+BIG') {
      // 7が揃う位置を探す
      positions[0] = this.findSymbolPosition(this.leftReel, '7');
      positions[1] = this.findSymbolPosition(this.middleReel, '7');
      positions[2] = this.findSymbolPosition(this.rightReel, '7');
    } else if (result === 'REG' || result === 'チェリー+REG') {
      // barが揃う位置を探す
      positions[0] = this.findSymbolPosition(this.leftReel, 'bar');
      positions[1] = this.findSymbolPosition(this.middleReel, 'bar');
      positions[2] = this.findSymbolPosition(this.rightReel, 'bar');
    } else if (result === 'ベル') {
      positions[0] = this.findSymbolPosition(this.leftReel, 'ベル');
      positions[1] = this.findSymbolPosition(this.middleReel, 'ベル');
      positions[2] = this.findSymbolPosition(this.rightReel, 'ベル');
    } else if (result === 'ピエロ') {
      positions[0] = this.findSymbolPosition(this.leftReel, 'ピエロ');
      positions[1] = this.findSymbolPosition(this.middleReel, 'ピエロ');
      positions[2] = this.findSymbolPosition(this.rightReel, 'ピエロ');
    } else if (result === 'ブドウ') {
      positions[0] = this.findSymbolPosition(this.leftReel, 'ブドウ');
      positions[1] = this.findSymbolPosition(this.middleReel, 'ブドウ');
      positions[2] = this.findSymbolPosition(this.rightReel, 'ブドウ');
    } else if (result === 'リプレイ') {
      positions[0] = this.findSymbolPosition(this.leftReel, 'リプレイ');
      positions[1] = this.findSymbolPosition(this.middleReel, 'リプレイ');
      positions[2] = this.findSymbolPosition(this.rightReel, 'リプレイ');
    } else if (result === 'チェリー' || result.includes('チェリー')) {
      positions[0] = this.findSymbolPosition(this.leftReel, 'チェリー');
      positions[1] = Math.floor(Math.random() * this.middleReel.length);
      positions[2] = Math.floor(Math.random() * this.rightReel.length);
    } else {
      // ハズレの場合はランダム（ただし役が揃わないように）
      positions[0] = Math.floor(Math.random() * this.leftReel.length);
      positions[1] = Math.floor(Math.random() * this.middleReel.length);
      positions[2] = Math.floor(Math.random() * this.rightReel.length);
    }
    
    return positions;
  }

  findSymbolPosition(reel, symbol) {
    const index = reel.indexOf(symbol);
    return index !== -1 ? index : Math.floor(Math.random() * reel.length);
  }

  judgeWin(reelIndices, result) {
    const display = this.getDisplaySymbols(reelIndices);
    
    // 配当表
    const payouts = {
      'BIG': 0,           // ボーナス（別処理）
      'REG': 0,           // ボーナス（別処理）
      'チェリー+BIG': 0,  // ボーナス（別処理）
      'チェリー+REG': 0,  // ボーナス（別処理）
      'ベル': 14,
      'ピエロ': 10,
      'ブドウ': 8,
      'リプレイ': 3,
      'チェリー': 2,
      'ハズレ': 0
    };

    const payout = payouts[result] || 0;
    const bonusGame = result.includes('BIG') || result.includes('REG');
    
    return {
      payout,
      effect: bonusGame ? 'bonus' : (payout > 0 ? 'win' : ''),
      bonusGame,
      winLine: this.getWinLine(display, result),
      display
    };
  }

  getDisplaySymbols(reelIndices) {
    const display = [];
    
    for (let i = 0; i < 3; i++) {
      const reel = [this.leftReel, this.middleReel, this.rightReel][i];
      const index = reelIndices[i];
      
      display.push([
        reel[(index - 1 + reel.length) % reel.length],
        reel[index],
        reel[(index + 1) % reel.length]
      ]);
    }
    
    return display;
  }

  getWinLine(display, result) {
    if (result === 'ハズレ') return null;
    
    // 中段ライン（最も一般的）
    const middleLine = [display[0][1], display[1][1], display[2][1]];
    
    // チェリーの場合は左リールのみチェック
    if (result.includes('チェリー')) {
      return {
        line: 'middle',
        symbols: [display[0][1], '', ''],
        positions: [[0, 1]]
      };
    }
    
    return {
      line: 'middle',
      symbols: middleLine,
      positions: [[0, 1], [1, 1], [2, 1]]
    };
  }
}

module.exports = SlotLogic;