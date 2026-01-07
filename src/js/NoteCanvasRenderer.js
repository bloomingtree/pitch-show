/**
 * NoteCanvasRenderer - 音符Canvas渲染器
 * 支持绘制带弯音轨迹的音符
 */

import { BendVisualizer } from './BendVisualizer.js';

export class NoteCanvasRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      showBendTrajectory: true,
      showBendIntensity: true,
      bendLineWidth: 1.5,
      noteOpacity: 0.7,
      highlightBendNotes: true,
      showBendLabels: true,
      ...options
    };
  }
  
  /**
   * 绘制带弯音的音符
   * @param {Object} note - 音符对象
   * @param {Number} playTime - 当前播放时间
   * @param {Number} secondLength - 每秒对应的像素长度
   * @param {Number} noteAreaWidth - 音符区域宽度
   */
  drawNoteWithBend(note, playTime, secondLength, noteAreaWidth) {
    const ctx = this.ctx;
    
    // 计算基本位置
    const x = note.x * noteAreaWidth;
    const y = (note.y - playTime) * secondLength;
    const width = note.width * noteAreaWidth;
    const height = note.height * secondLength;
    
    // 1. 先绘制音符背景（半透明矩形）
    let color = `rgba(236, 44, 100, ${note.amplitude || 0.5})`;
    if (note.voiceColor) {
      // 将十六进制颜色转换为 rgba，保持透明度
      const hex = note.voiceColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      color = `rgba(${r}, ${g}, ${b}, ${note.amplitude || 0.5})`;
    }
    
    ctx.fillStyle = color;
    ctx.globalAlpha = this.options.noteOpacity;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
    
    // 2. 如果有弯音，绘制轨迹
    if (this.options.showBendTrajectory && note.pitchBends && note.pitchBends.length > 1) {
      this.drawBendTrajectory(note, x, y, width, height);
    }
    
    // 3. 绘制音符边框
    ctx.strokeStyle = this.options.highlightBendNotes && note.pitchBends && note.pitchBends.length > 1 
      ? '#FFFFFF' 
      : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // 4. 绘制弯音强度指示器（可选）
    if (this.options.showBendIntensity && note.pitchBends && note.pitchBends.length > 1) {
      this.drawBendIntensityIndicator(note, x, y, width, height);
    }
  }
  
  /**
   * 绘制弯音轨迹
   */
  drawBendTrajectory(note, x, y, width, height) {
    const ctx = this.ctx;
    
    // 分析弯音模式
    const bendPattern = BendVisualizer.analyzeBendPattern(note.pitchBends);
    const bendStyle = BendVisualizer.getBendStyle(bendPattern.type, bendPattern.intensity);
    
    // 生成轨迹点
    const trajectory = BendVisualizer.createBendTrajectory(
      note.pitchBends,
      note.pitchMidi,
      note.durationSeconds
    );
    
    // 设置绘制样式
    ctx.strokeStyle = bendStyle.color;
    ctx.lineWidth = bendStyle.lineWidth;
    ctx.setLineDash(bendStyle.dashArray);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // 开始绘制轨迹
    ctx.beginPath();
    
    // 绘制中间的主轨迹
    // 计算弯音的最大范围，用于缩放轨迹
    const bendValues = note.pitchBends.map(b => {
      if (typeof b === 'number') return b;
      if (b && typeof b === 'object' && 'pitchBend' in b) return b.pitchBend;
      return 0;
    });
    const maxBend = Math.max(...bendValues.map(Math.abs));
    const bendScale = maxBend > 0 ? Math.min(height / 2, height / (maxBend * 2)) : height / 12;
    
    for (let i = 0; i < trajectory.length; i++) {
      const point = trajectory[i];
      
      // 将轨迹坐标映射到画布坐标
      const pointX = x + (point.x * width);
      
      // y坐标需要映射：MIDI音高 → 像素位置
      // 计算相对于基础音高的偏移（以半音为单位）
      const pitchOffset = point.y - note.pitchMidi; // 相对于基础音高的偏移
      // 将弯音偏移映射到音符高度范围内，限制在音符矩形内
      const maxOffset = Math.min(height / 2, maxBend * bendScale);
      const pointY = y + (height / 2) + (pitchOffset * bendScale);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
      
      // 绘制关键点（起点、终点、转折点）
      if (point.isStart || point.isEnd || Math.abs(point.bendAmount) > 3) {
        this.drawTrajectoryPoint(pointX, pointY, point.bendAmount);
      }
    }
    
    ctx.stroke();
    
    // 重置虚线
    ctx.setLineDash([]);
    
    // 在音符上方显示弯音描述
    if (this.options.showBendLabels && bendPattern.type !== 'stable' && bendPattern.intensity > 1) {
      this.drawBendLabel(x + width / 2, y - 10, bendStyle.description, bendStyle.color);
    }
  }
  
  /**
   * 绘制轨迹关键点
   */
  drawTrajectoryPoint(x, y, bendAmount) {
    const ctx = this.ctx;
    const radius = 3;
    
    ctx.fillStyle = bendAmount > 0 ? '#4ECDC4' : 
                   bendAmount < 0 ? '#FFD166' : '#CCCCCC';
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 显示弯曲值（仅在弯曲较大时显示）
    if (Math.abs(bendAmount) > 2) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(bendAmount.toFixed(1), x, y - radius - 5);
    }
  }
  
  /**
   * 绘制弯音标签
   */
  drawBendLabel(x, y, text, color) {
    const ctx = this.ctx;
    
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // 添加文字背景
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - textWidth / 2 - 4, y - 16, textWidth + 8, 18);
    
    // 绘制文字
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  
  /**
   * 绘制弯音强度指示器
   */
  drawBendIntensityIndicator(note, x, y, width, height) {
    const ctx = this.ctx;
    const bendPattern = BendVisualizer.analyzeBendPattern(note.pitchBends);
    
    if (bendPattern.intensity < 0.5) return;
    
    // 在音符右侧绘制强度条
    const intensity = Math.min(1, bendPattern.intensity / 12);
    const barWidth = 5;
    const barHeight = height * intensity;
    const barX = x + width + 2;
    const barY = y + (height - barHeight) / 2;
    
    // 渐变颜色：从绿到红
    const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    gradient.addColorStop(0, '#4ECDC4'); // 低强度
    gradient.addColorStop(0.5, '#FFD166'); // 中强度
    gradient.addColorStop(1, '#FF6B6B'); // 高强度
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
  
  /**
   * 批量绘制音符
   */
  drawNotes(notes, playTime, secondLength, noteAreaWidth) {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制每个音符
    notes.forEach(note => {
      // 只绘制在可视区域内的音符
      const noteY = note.y - playTime;
      const noteHeight = note.height * secondLength;
      if (noteY + noteHeight >= 0 && noteY <= this.canvas.height) {
        this.drawNoteWithBend(note, playTime, secondLength, noteAreaWidth);
      }
    });
  }
}
