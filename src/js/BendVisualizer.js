/**
 * BendVisualizer - 弯音可视化器
 * 将pitchBends转换为可视化的轨迹点，并分析弯音模式
 */

export class BendVisualizer {
  /**
   * 将pitchBends转换为可视化的轨迹点
   * @param {Array} pitchBends - 弯曲值数组，每个元素包含 {pitchBend: number} 或直接是数值
   * @param {Number} basePitch - 基础音高 (MIDI编号)
   * @param {Number} duration - 音符持续时间(秒)
   * @param {Number} sampleRate - 弯曲值采样率(默认：弯曲数组长度/持续时间)
   * @returns {Array} - 轨迹点 [{x, y, bendAmount}, ...]
   */
  static createBendTrajectory(pitchBends, basePitch, duration, sampleRate = null) {
    if (!pitchBends || pitchBends.length < 2) {
      // 没有弯曲或只有单个值，返回直线
      return [
        { x: 0, y: basePitch, bendAmount: 0 },
        { x: 1, y: basePitch, bendAmount: 0 }
      ];
    }
    
    // 1. 提取弯曲值：支持 {pitchBend: number} 格式或直接数值
    const bendValues = pitchBends.map(b => {
      if (typeof b === 'number') return b;
      if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
      return 0;
    });
    
    // 2. 规范化弯曲值：假设Basic Pitch的弯曲值范围是[-12, 12] (一个八度)
    const MAX_BEND = 12; // 最大弯曲半音数
    const normalizedBends = bendValues.map(b => 
      Math.max(-MAX_BEND, Math.min(MAX_BEND, b))
    );
    
    // 3. 创建时间轴上的点
    const points = [];
    const bendCount = normalizedBends.length;
    
    for (let i = 0; i < bendCount; i++) {
      const timeRatio = i / (bendCount - 1); // 0到1之间
      const bendAmount = normalizedBends[i];
      
      // 当前音高 = 基础音高 + 弯曲值
      const currentPitch = basePitch + bendAmount;
      
      points.push({
        x: timeRatio,          // 时间位置 (0-1)
        y: currentPitch,       // 当前音高 (MIDI编号)
        bendAmount,            // 弯曲量
        isStart: i === 0,
        isEnd: i === bendCount - 1
      });
    }
    
    // 4. 平滑处理（可选）
    return this.smoothTrajectory(points);
  }
  
  /**
   * 平滑轨迹（减少锯齿感）
   */
  static smoothTrajectory(points, windowSize = 3) {
    if (points.length <= windowSize) return points;
    
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < points.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - halfWindow); 
           j <= Math.min(points.length - 1, i + halfWindow); j++) {
        sum += points[j].y;
        count++;
      }
      
      smoothed.push({
        ...points[i],
        y: sum / count
      });
    }
    
    return smoothed;
  }
  
  /**
   * 识别弯曲模式
   */
  static analyzeBendPattern(pitchBends) {
    if (!pitchBends || pitchBends.length < 2) {
      return { type: 'none', intensity: 0, pattern: 'stable' };
    }
    
    // 提取弯曲值
    const bendValues = pitchBends.map(b => {
      if (typeof b === 'number') return b;
      if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
      return 0;
    });
    
    const stats = {
      min: Math.min(...bendValues),
      max: Math.max(...bendValues),
      range: 0,
      avg: bendValues.reduce((a, b) => a + b) / bendValues.length,
      zeroCrossings: 0,
      directionChanges: 0
    };
    
    stats.range = stats.max - stats.min;
    
    // 统计零交叉和方向变化
    let lastSign = Math.sign(bendValues[0]);
    for (let i = 1; i < bendValues.length; i++) {
      const currentSign = Math.sign(bendValues[i]);
      
      if (lastSign !== currentSign && lastSign !== 0 && currentSign !== 0) {
        stats.zeroCrossings++;
      }
      
      if (currentSign !== 0 && lastSign !== 0 && i >= 2 &&
          Math.sign(bendValues[i] - bendValues[i-1]) !== Math.sign(bendValues[i-1] - bendValues[Math.max(0, i-2)])) {
        stats.directionChanges++;
      }
      
      lastSign = currentSign;
    }
    
    // 识别模式
    let type = 'stable';
    if (stats.range > 3) {
      if (stats.zeroCrossings > bendValues.length * 0.3) {
        type = 'vibrato'; // 颤音
      } else if (stats.max > 2 && stats.min < -2) {
        type = 'scoop'; // 先下后上
      } else if (stats.max > 2) {
        type = 'bend_up'; // 上滑音
      } else if (stats.min < -2) {
        type = 'bend_down'; // 下滑音
      } else {
        type = 'expressive'; // 表情弯音
      }
    } else if (stats.range > 1) {
      type = 'expressive'; // 轻微表情弯音
    }
    
    return {
      type,
      intensity: stats.range,
      stats,
      confidence: Math.min(1, stats.range / 12) // 范围越大置信度越高
    };
  }
  
  /**
   * 获取弯曲模式的视觉样式
   */
  static getBendStyle(patternType, intensity) {
    const styles = {
      'vibrato': {
        lineWidth: 1,
        dashArray: [3, 3],
        color: '#FF6B6B',
        description: '颤音'
      },
      'bend_up': {
        lineWidth: 2,
        dashArray: [],
        color: '#4ECDC4',
        description: '上滑音'
      },
      'bend_down': {
        lineWidth: 2,
        dashArray: [],
        color: '#FFD166',
        description: '下滑音'
      },
      'scoop': {
        lineWidth: 2,
        dashArray: [5, 2],
        color: '#06D6A0',
        description: '先下后上'
      },
      'expressive': {
        lineWidth: 1.5,
        dashArray: [],
        color: '#118AB2',
        description: '表情弯音'
      },
      'stable': {
        lineWidth: 1,
        dashArray: [],
        color: '#CCCCCC',
        description: '稳定'
      },
      'none': {
        lineWidth: 1,
        dashArray: [],
        color: '#CCCCCC',
        description: '无弯音'
      }
    };
    
    return styles[patternType] || styles.stable;
  }
}
