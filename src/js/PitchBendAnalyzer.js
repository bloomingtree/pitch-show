/**
 * PitchBendAnalyzer - 音高弯曲分析器
 * 分析音符的 pitchBends 特征，提取弯曲模式、强度、频率等特征
 */

class PitchBendAnalyzer {
  /**
   * 分析单个音符的 pitchBends 特征
   * @param {Object} note - 音符对象，包含 pitchBends 数组
   * @returns {Object} 分析结果
   */
  analyzeNote(note) {
    if (!note.pitchBends || note.pitchBends.length === 0) {
      return this.getDefaultFeatures();
    }

    const bends = note.pitchBends;
    // 修复：pitchBends 是直接的数字数组，不需要 .map()
    // 但为了兼容性，支持两种格式
    const values = Array.isArray(bends) 
      ? bends.map(b => {
          // 如果是数字，直接返回
          if (typeof b === 'number') return b;
          // 如果是对象，提取 pitchBend 属性
          if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
          return 0;
        })
      : [];
    
    if (values.length === 0) {
      return this.getDefaultFeatures();
    }
    
    // 计算所有特征
    const variance = this.calculateVariance(values);
    const range = this.calculateBendRange(values);
    const frequency = this.calculateBendFrequency(values);
    const intensity = Math.sqrt(variance); // 使用标准差作为强度
    
    // 基于真实数据调整的模式识别
    const pattern = this.identifyBendPattern(intensity, frequency, range);
    
    return {
      // 弯曲强度：标准差（修复：使用标准差而不是最大偏差）
      bendIntensity: intensity,
      
      // 弯曲频率：变化次数
      bendFrequency: frequency,
      
      // 弯曲平滑度：变化是否平滑
      bendSmoothness: this.calculateBendSmoothness(values),
      
      // 弯曲方向：主要趋势（向上/向下/稳定）
      bendDirection: this.calculateBendDirection(values),
      
      // 弯曲范围：变化范围
      bendRange: range,
      
      // 弯曲模式：整体模式（基于新的阈值）
      bendPattern: pattern,
      
      // 平均弯曲值
      averageBend: this.calculateAverageBend(values),
      
      // 弯曲方差
      bendVariance: variance,
      
      // 详细统计信息（用于调试）
      _stats: {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: this.calculateAverageBend(values),
        stdDev: intensity,
        range: range,
        frequency: frequency
      }
    };
  }

  /**
   * 识别弯曲模式（基于真实数据的阈值）
   * @param {Number} intensity - 弯曲强度（标准差）
   * @param {Number} frequency - 弯曲频率
   * @param {Number} range - 弯曲范围
   * @returns {String} 模式类型
   */
  identifyBendPattern(intensity, frequency, range) {
    // 基于真实数据调整阈值
    if (intensity < 0.2) {
      return 'stable';          // 几乎无变化
    } else if (frequency > 0.3 && range > 0.5) {
      return 'vibrato';         // 高频振荡（人声特征）
    } else if (frequency < 0.15 && range > 2.0) {
      return 'glide';           // 单向大幅弯曲
    } else if (intensity > 0.5) {
      return 'strong';          // 强弯曲
    } else if (intensity > 0.2) {
      return 'expressive';      // 表情弯曲
    } else {
      return 'gentle';          // 轻微弯曲
    }
  }

  /**
   * 计算弯曲频率（变化次数）
   */
  calculateBendFrequency(values) {
    if (values.length < 2) return 0;
    let changes = 0;
    for (let i = 1; i < values.length; i++) {
      const diff = Math.abs(values[i] - values[i - 1]);
      if (diff > 0.01) { // 阈值，避免微小波动
        changes++;
      }
    }
    return changes / (values.length - 1); // 归一化到 [0, 1]
  }

  /**
   * 计算弯曲平滑度
   */
  calculateBendSmoothness(values) {
    if (values.length < 2) return 1.0;
    let totalDiff = 0;
    let maxDiff = 0;
    for (let i = 1; i < values.length; i++) {
      const diff = Math.abs(values[i] - values[i - 1]);
      totalDiff += diff;
      maxDiff = Math.max(maxDiff, diff);
    }
    const avgDiff = totalDiff / (values.length - 1);
    // 平滑度：平均变化越小，平滑度越高
    return Math.max(0, 1 - avgDiff / (maxDiff + 0.001));
  }

  /**
   * 计算弯曲方向
   * @returns {number} -1: 向下, 0: 稳定, 1: 向上
   */
  calculateBendDirection(values) {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    if (Math.abs(diff) < 0.01) return 0;
    return diff > 0 ? 1 : -1;
  }

  /**
   * 计算弯曲范围
   */
  calculateBendRange(values) {
    if (values.length === 0) return 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max - min;
  }

  /**
   * 计算平均弯曲值
   */
  calculateAverageBend(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 计算方差
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = this.calculateAverageBend(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 获取默认特征（当没有 pitchBends 时）
   */
  getDefaultFeatures() {
    return {
      bendIntensity: 0,
      bendFrequency: 0,
      bendSmoothness: 1.0,
      bendDirection: 0,
      bendRange: 0,
      bendPattern: 'stable',
      averageBend: 0,
      bendVariance: 0,
      _stats: {
        min: 0,
        max: 0,
        mean: 0,
        stdDev: 0,
        range: 0,
        frequency: 0
      }
    };
  }
}

export default PitchBendAnalyzer;
