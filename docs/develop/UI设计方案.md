# 音乐工具 Web UI 设计方案

## 一、设计调研总结

### 1.1 市场主流设计风格

| 风格 | 特点 | 适用场景 | 代表作品 |
|------|------|----------|----------|
| **Glassmorphism** (毛玻璃) | 透明度、模糊背景、边框高光 | 现代、科技感 | Windows 11、iOS 通知 |
| **Neumorphism** (新拟物) | 柔和阴影、凸起/凹陷效果 | 简洁、柔和 | 概念设计较多 |
| **Flat 2.0** (扁平化 2.0) | 微阴影、渐变、圆角 | 通用、易实现 | Spotify、Apple Music |

### 1.2 参考案例

| 产品 | 设计亮点 | 可借鉴点 |
|------|----------|----------|
| **Spotify** | 深色主题、绿色强调色、大圆角卡片 | 颜色对比、卡片布局 |
| **Apple Music** | 毛玻璃效果、精致动画、大封面 | 玻璃效果、过渡动画 |
| **SoundCloud** | 波形可视化、橙色品牌色 | 音频可视化、品牌色运用 |
| **Tidal** | 高对比度、黑金配色 | 高端感、对比度 |

### 1.3 设计趋势 (2024)

1. **深色模式优先** - 音乐类应用普遍采用深色主题
2. **微交互动画** - 按钮点击、滑块拖动都有反馈
3. **渐变色彩** - 用于强调和视觉引导
4. **圆角设计** - 8px-16px 圆角成为主流
5. **适度留白** - 减少视觉负担

---

## 二、设计规范

### 2.1 色彩系统

```
主色调（品牌色）：#F97316 (橙色)
背景色（深色）：#0F0F0F / #1A1A1A
背景色（浅色）：#FAFAFA / #F5F5F5
表面色（卡片）：#FFFFFF / #1E1E1E
边框色：#E5E7EB / #2D2D2D
文字色（主要）：#111827 / #F9FAFB
文字色（次要）：#6B7280 / #9CA3AF
成功色：#10B981
警告色：#F59E0B
错误色：#EF4444
```

### 2.2 圆角规范

| 元素 | 圆角 |
|------|------|
| 按钮 | 8px |
| 输入框 | 8px |
| 卡片 | 12px |
| 弹窗 | 16px |
| 标签 | 9999px (全圆) |

### 2.3 阴影规范

```css
/* 卡片阴影 */
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* 弹窗阴影 */
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* 悬浮阴影 */
--shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
```

### 2.4 动画规范

| 动画类型 | 时长 | 缓动函数 |
|----------|------|----------|
| 微交互（按钮点击） | 150ms | ease-out |
| 过渡（弹窗出现） | 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| 动画（加载旋转） | 1000ms | linear |

---

## 三、组件设计方案

### 3.1 弹窗模态框

**设计原则**：
- 居中显示，背景遮罩半透明模糊
- 弹窗采用卡片式设计，圆角 16px
- 标题栏固定，内容区可滚动
- 关闭按钮采用圆形悬浮设计

**交互规范**：
- 点击遮罩关闭
- ESC 键关闭
- 弹窗出现时背景页面禁止滚动

### 3.2 加载提示框

**设计原则**：
- 进度条采用渐变色
- 百分比数字实时显示
- 可选：添加预估剩余时间
- 加载动画流畅，无卡顿

**交互规范**：
- 加载过程中禁止其他操作
- 支持取消操作
- 加载完成后自动关闭

### 3.3 滑动条

**设计原则**：
- 轨道采用浅色背景
- 已选择区域采用品牌色填充
- 滑块采用圆形设计，带阴影
- 数值实时显示

**交互规范**：
- 悬浮时滑块放大
- 拖动时有触觉反馈
- 支持键盘方向键调整

### 3.4 按钮

**设计原则**：
- 主要按钮：实心填充
- 次要按钮：边框描边
- 文字按钮：无边框
- 图标按钮：圆形背景

**交互规范**：
- 悬浮时颜色加深/放大
- 点击时有下压效果
- 禁用状态降低透明度

---

## 四、示例文件

请打开以下 HTML 文件预览组件效果：

| 文件 | 说明 |
|------|------|
| [components/buttons.html](./components/buttons.html) | 按钮组件示例 |
| [components/sliders.html](./components/sliders.html) | 滑动条组件示例 |
| [components/loading.html](./components/loading.html) | 加载框组件示例 |

---

## 五、参考资源

- [Dribbble - Music Web App](https://dribbble.com/tags/music-web-app)
- [Dribbble - Glassmorphism Music App](https://dribbble.com/search/glassmorphism-music-app)
- [LogRocket - Modal UX Design](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [CSS-Tricks - Range Slider Styling](https://css-tricks.com/styling-cross-browser-compatible-range-inputs-css/)
- [Medium - Music App UI Design](https://medium.com/mockingbot/music-app-ui-design-gorgeous-examples-for-inspiration-d4944de43f12)

---

*文档版本: 1.0*
*创建日期: 2025-04-05*
