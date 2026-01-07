/**
 * VoiceClassifier - 声部分类器（简化版）
 * 只保留两种分类：人声、旋律乐器
 * 基于严格的特征：音高、振幅、持续时间
 */

class VoiceClassifier {
  constructor() {
    // 声部类型定义（简化版）
    this.voiceTypes = {
      vocal: { name: 'vocal', color: '#10B981', priority: 1 },    // 人声 - 绿色
      melody: { name: 'melody', color: '#3B82F6', priority: 2 }  // 旋律乐器 - 蓝色
    };
  }

  /**
   * 分类单个音符（简化版）
   * @param {Object} note - 音符对象
   * @returns {Object} 分类结果
   */
  classifyNote(note) {
    const pitchMidi = note.pitchMidi || 60;
    const amplitude = note.amplitude || 0.5;
    const duration = note.durationSeconds || 0.1;
    const pitchBends = note.pitchBends || [];

    // 只进行人声判断，传入 pitchBends
    const vocalScore = this.scoreVocal(pitchMidi, amplitude, duration, pitchBends);
    
    // 阈值：超过0.7分就认为是人声
    if (vocalScore >= 0.8) {
      return {
        voiceType: 'vocal',
        confidence: vocalScore
      };
    }
    
    // 其他所有音符都归类为旋律
    return {
      voiceType: 'melody',
      confidence: 0.7 // 固定的旋律置信度
    };
  }

  /**
   * 分析 pitch bend 特征
   * @param {Array} pitchBends - 弯曲值数组
   * @returns {Object} pitch bend 特征
   */
  analyzePitchBends(pitchBends) {
    if (!pitchBends || pitchBends.length < 2) {
      return {
        hasBend: false,
        intensity: 0,
        range: 0,
        frequency: 0,
        vibratoScore: 0
      };
    }

    // 提取弯曲值
    const bendValues = pitchBends.map(b => {
      if (typeof b === 'number') return b;
      if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
      return 0;
    });

    const min = Math.min(...bendValues);
    const max = Math.max(...bendValues);
    const range = max - min;
    const avg = bendValues.reduce((a, b) => a + b, 0) / bendValues.length;
    
    // 计算方差（用于衡量变化强度）
    const variance = bendValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / bendValues.length;
    const intensity = Math.sqrt(variance); // 标准差作为强度

    // 计算零交叉次数（用于识别颤音）
    let zeroCrossings = 0;
    let lastSign = Math.sign(bendValues[0] - avg);
    for (let i = 1; i < bendValues.length; i++) {
      const currentSign = Math.sign(bendValues[i] - avg);
      if (lastSign !== currentSign && lastSign !== 0 && currentSign !== 0) {
        zeroCrossings++;
      }
      lastSign = currentSign;
    }

    // 计算颤音得分（人声特征：频繁的零交叉）
    const vibratoScore = bendValues.length > 0 
      ? Math.min(1, (zeroCrossings / bendValues.length) * 2) 
      : 0;

    return {
      hasBend: true,
      intensity: intensity,
      range: range,
      frequency: zeroCrossings / bendValues.length,
      vibratoScore: vibratoScore
    };
  }

  /**
   * 评分：人声（基于振幅和 pitch bend）
   * 核心特征：
   * - 音高范围：MIDI 48-84（C3-C6，放宽的人声范围）
   * - 振幅：0.4-0.8（放宽的人声振幅范围）
   * - 持续时间：0.2-1.5秒（放宽的人声持续时间）
   * - Pitch Bend：人声通常有更多的弯音变化（提高权重）
   */
  scoreVocal(pitchMidi, amplitude, duration, pitchBends = []) {
    let score = 0;
    
    // 放宽的人声范围：MIDI 48-84 (C3-C6)
    if (pitchMidi >= 48 && pitchMidi <= 84) {
      score += 0.3; // 降低基础分，为 pitch bend 留出空间
      // 最佳范围（MIDI 55-76）额外加分
      if (pitchMidi >= 55 && pitchMidi <= 76) {
        score += 0.1;
      }
    } else {
      return 0; // 不在人声范围直接返回0
    }
    
    // 振幅评分（权重：0.2）
    if (amplitude >= 0.4 && amplitude <= 0.8) {
      score += 0.2;
    } else if (amplitude >= 0.3 && amplitude <= 0.9) {
      score += 0.1; // 接近范围也给分
    } else {
      score -= 0.05; // 减少扣分力度
    }
    
    // 持续时间评分（权重：0.15）
    if (duration >= 0.2 && duration <= 1.5) {
      score += 0.15;
    } else if (duration >= 0.15 && duration <= 2.0) {
      score += 0.08; // 接近范围也给分
    } else {
      score -= 0.05; // 减少扣分力度
    }
    
    // Pitch Bend 评分（提高权重：0.35）
    const bendFeatures = this.analyzePitchBends(pitchBends);
    if (bendFeatures.hasBend) {
      // 有 pitch bend 是强烈的人声特征
      score += 0.15;
      
      // 颤音特征（人声常见）
      if (bendFeatures.vibratoScore > 0.3) {
        score += 0.15; // 高权重
      } else if (bendFeatures.vibratoScore > 0.1) {
        score += 0.05;
      }
      
      // 适度的弯音强度（人声特征）
      if (bendFeatures.intensity > 0.5 && bendFeatures.intensity < 3.0) {
        score += 0.05;
      }
    } else {
      // 没有 pitch bend 可能不是人声，但不要扣太多分
      score -= 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 获取声部颜色（预留接口，支持不同颜色方案）
   * @param {String} voiceType - 声部类型
   * @param {String} colorScheme - 颜色方案（默认：'default'）
   * @returns {String} 颜色值（十六进制）
   */
  getVoiceColor(voiceType, colorScheme = 'default') {
    const colorSchemes = {
      default: {
        vocal: '#10B981',    // 人声 - 绿色
        melody: '#3B82F6'    // 旋律乐器 - 蓝色
      },
      vibrant: {
        vocal: '#00FF88',    // 人声 - 鲜艳绿色
        melody: '#0066FF'    // 旋律乐器 - 鲜艳蓝色
      }
    };
    
    const scheme = colorSchemes[colorScheme] || colorSchemes.default;
    return scheme[voiceType] || scheme.melody;
  }
}

export default VoiceClassifier;
