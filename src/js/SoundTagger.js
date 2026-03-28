/**
 * SoundTagger - 声音标签分析器（简化版）
 * 只进行基本的旋律分类，不进行弯音分析
 */

import VoiceClassifier from './VoiceClassifier.js';

class SoundTagger {
  constructor() {
    this.voiceClassifier = new VoiceClassifier();
  }

  /**
   * 分析音符数组，为每个音符添加声部标签（简化版）
   * @param {Array} notes - 音符数组
   * @param {Object} options - 配置选项（保留接口兼容性，但不再使用）
   * @returns {Array} 添加了标签的音符数组
   */
  analyze(notes, options = {}) {
    const startTime = performance.now();
    
    if (!notes || notes.length === 0) {
      return [];
    }

    // 批处理优化：一次处理所有音符
    const analyzedNotes = notes.map((note) => {
      // 直接分类音符（不进行弯音分析）
      const classification = this.voiceClassifier.classifyNote(note);
      
      // 合并结果（只保存类型，不保存颜色，颜色在渲染时根据颜色方案决定）
      return {
        ...note,
        voiceType: classification.voiceType,
        confidence: classification.confidence
      };
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    console.log(`SoundTagger: 处理了 ${notes.length} 个音符，耗时 ${processingTime.toFixed(2)}ms`);
    
    return analyzedNotes;
  }

  /**
   * 获取统计信息
   */
  getStatistics(notes) {
    const stats = {
      total: notes.length,
      byType: {},
      averageConfidence: 0
    };

    let totalConfidence = 0;
    
    notes.forEach(note => {
      // 按类型统计
      const type = note.voiceType || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // 累计置信度
      totalConfidence += note.confidence || 0;
    });

    stats.averageConfidence = notes.length > 0 ? totalConfidence / notes.length : 0;
    
    return stats;
  }
}

export default SoundTagger;
