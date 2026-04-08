# 识音 (Pitch) - 项目技术文档

## 项目概述

**识音** 是一款基于 Web 技术的 AI 扒谱工具，核心功能是音高分析和音频分离。该应用面向音乐爱好者、学习乐器的人群、音乐教师以及需要分析音乐作品的专业人士。

**目标用户**：
- 学习唱歌或乐器演奏的音乐爱好者
- 需要将歌曲分解为独立声部的音乐制作人
- 希望了解歌曲音符构成的音乐教师和学生
- 需要提取人声或伴奏的内容创作者

**核心价值**：所有音频处理均在浏览器本地完成，无需上传到服务器，保护用户隐私。支持中英文双语界面。

---

## 功能模块与技术实现

### 一、音高分析功能

**功能描述**：用户上传音频文件后，系统自动识别其中的音符，并以可视化的方式在钢琴卷帘界面上展示。用户可以看到每个音符的音高、时值、力度，以及播放时的实时高亮。

**技术实现**：

1. **音频预处理**
   - 使用 Web Audio API 将用户上传的音频文件解码为 AudioBuffer
   - 将音频重采样至 22050Hz 单声道格式，满足模型输入要求

2. **AI 模型推理**
   - 采用 Spotify 开源的 BasicPitch 模型（基于 TensorFlow.js）
   - 模型文件约 700KB，首次加载后由浏览器缓存
   - 模型输出包含音符的音高（MIDI 编号）、开始时间、持续时间和置信度

3. **音符后处理**
   - 对模型输出的原始音符数据进行过滤，剔除置信度过低的音符
   - 使用 PitchBendAnalyzer 分析每个音符的弯音特征（颤音、滑音等）
   - VoiceClassifier 根据音高范围、振幅和弯音特征判断声音类型（人声/乐器）

4. **可视化渲染**
   - 使用 HTML5 Canvas 绘制钢琴卷帘界面
   - NoteCanvasRenderer 负责将音符数据转换为图形元素
   - 每个音符用彩色矩形表示，颜色深浅反映力度
   - 播放时，当前播放位置的音符会高亮显示，钢琴键盘同步高亮对应按键

5. **数据持久化**
   - 使用 IndexedDB 存储分析过的歌曲数据
   - 数据库名为 `pitch-show`，存储对象为 `song`
   - 保存内容包括歌曲名称、音频文件、音符数据和日期

**关键文件**：
- `src/components/SongPitch.vue` - 主组件，协调分析流程
- `src/js/PitchBendAnalyzer.js` - 弯音分析
- `src/js/VoiceClassifier.js` - 声音分类
- `src/js/NoteCanvasRenderer.js` - Canvas 渲染
- `public/model.json` - BasicPitch 模型

---

### 二、音频分离功能

**功能描述**：用户上传音频文件后，系统将其分离为四个独立轨道：人声（Vocals）、鼓（Drums）、贝斯（Bass）、其他（Other）。每个轨道可以独立播放和下载。

**技术实现**：

1. **模型管理**
   - 采用基于 Meta Demucs 的 ONNX 模型（htdemucs_lite 版本）
   - 模型文件压缩后约 97MB，解压后约 300MB
   - 模型托管在 Cloudflare R2 存储，通过 CDN 加速下载
   - 使用 Cache API 将模型缓存在浏览器中，避免重复下载
   - 用户首次使用时显示下载进度，后续使用直接加载缓存

2. **Web Worker 架构**
   - 所有计算密集型任务在 Web Worker 中执行，避免阻塞主线程
   - Worker 通过 postMessage 与主线程通信，报告处理进度
   - 支持的消息类型：loadModel、loadAudio、applyModel、progress、complete、error

3. **音频处理流程**
   - 音频采样率标准化为 44100Hz
   - 使用 FFT.js 进行短时傅里叶变换（STFT），将时域信号转换为频域
   - 将音频分块处理，每块最长 5 秒，使用重叠窗口避免边界伪影
   - 相邻块的重叠区域进行交叉淡入淡出，确保平滑过渡

4. **模型推理**
   - 使用 ONNX Runtime Web 执行模型推理
   - 自动选择最优后端：优先 WebGPU，其次 WebGL，最后 WASM
   - 输入为 STFT 频谱图，输出为四个分离轨道的频谱图
   - 使用逆 STFT（ISTFT）将频谱转换回时域音频

5. **内存管理**
   - TensorFlow.js 的 tf.tidy() 自动回收中间张量
   - 大张量手动调用 tf.dispose() 释放
   - 使用 buffer 模式避免大数组的内存复制
   - 分块处理机制限制单次内存占用

6. **结果输出**
   - 将 AudioBuffer 编码为 WAV 格式
   - 生成四个独立的 Blob URL 供播放和下载

**关键文件**：
- `src/views/SeparateView.vue` - 主组件，UI 交互
- `src/js/demucs-worker.js` - Worker 源码，核心处理逻辑
- `src/js/demucsUtils.js` - 音频处理工具函数
- `public/demucs-worker.js` - 生产环境 Worker（由构建生成）

---

### 三、用户认证系统

**功能描述**：支持邮箱验证码登录，用户可以管理个人资料和查看历史记录。

**技术实现**：

1. **认证流程**
   - 用户输入邮箱地址
   - 调用 API 发送一次性验证码（OTP）
   - 用户输入验证码完成登录
   - 服务端返回 Access Token 和 Refresh Token

2. **Token 管理**
   - Access Token 存储在 Pinia Store 中
   - 使用 Axios 请求拦截器自动附加 Authorization 头
   - Token 过期时自动使用 Refresh Token 刷新
   - 刷新失败则跳转登录页

3. **路由守卫**
   - 需要认证的页面（如个人资料）由路由守卫保护
   - 未登录用户访问受保护页面时重定向到登录页

**关键文件**：
- `src/store/modules/auth.js` - 认证状态管理
- `src/api/auth.js` - 认证 API 调用
- `src/router/guards.js` - 路由守卫
- `src/views/auth/EmailLoginView.vue` - 登录页面

---

## 技术架构

### 前端技术栈

| 类别 | 技术 | 版本 | 用途 |
|-----|-----|-----|-----|
| 框架 | Vue.js | 3.4.29 | 响应式 UI 框架 |
| 构建 | Vite | 5.3.1 | 开发服务器与打包 |
| 样式 | Tailwind CSS | 3.4.14 | 原子化 CSS 框架 |
| 状态 | Pinia | 3.0.4 | 全局状态管理 |
| 路由 | Vue Router | 4.x | 页面路由管理 |
| 国际化 | vue-i18n | 11.1.11 | 多语言支持 |
| HTTP | Axios | 1.10.0 | API 请求 |
| 通知 | notivue | 2.4.5 | Toast 通知组件 |

### AI/ML 相关

| 类别 | 技术 | 用途 |
|-----|-----|-----|
| 音高检测 | @spotify/basic-pitch | 基于 TensorFlow.js 的音符识别 |
| 运行时 | @tensorflow/tfjs | BasicPitch 模型运行环境 |
| 音频分离 | ONNX Runtime Web | Demucs 模型运行环境 |
| 信号处理 | fft.js / dsp.js | 傅里叶变换与数字信号处理 |
| 解压缩 | fflate | Gzip 模型文件解压 |

### 部署架构

- **国内站**：https://shiyin.notalabs.cn（Cloudflare Pages）
- **国际站**：https://pitch.shiyin.cyou（Cloudflare Pages）
- **API 服务**：独立后端服务，通过 `/api` 代理访问
- **模型存储**：Cloudflare R2 对象存储，通过 CDN 分发

---

## 项目结构

```
pitch-show/
├── public/                      # 静态资源
│   ├── model.json               # BasicPitch 模型定义
│   ├── group1-shard1of1.bin     # BasicPitch 模型权重
│   └── demucs-worker.js         # 生产环境 Worker
│
├── src/
│   ├── api/                     # API 调用层
│   │   ├── index.js             # Axios 实例与拦截器
│   │   ├── auth.js              # 认证接口
│   │   └── profile.js           # 用户资料接口
│   │
│   ├── components/              # 可复用组件
│   │   ├── SongPitch.vue        # 音高分析主组件
│   │   ├── AudioPlayer.vue      # 音频播放器
│   │   ├── AudioWaveformPlayer.vue  # 多轨波形播放器
│   │   ├── NavigationBar.vue    # 顶部导航栏
│   │   └── ...                  # 其他组件
│   │
│   ├── js/                      # 纯 JavaScript 模块
│   │   ├── demucs-worker.js     # Demucs Worker 源码
│   │   ├── demucsUtils.js       # 音频处理工具
│   │   ├── PitchBendAnalyzer.js # 弯音分析
│   │   ├── VoiceClassifier.js   # 声音分类
│   │   └── NoteCanvasRenderer.js# Canvas 渲染
│   │
│   ├── i18n/                    # 国际化
│   │   └── langs/
│   │       ├── zh.json          # 中文翻译
│   │       └── en.json          # 英文翻译
│   │
│   ├── router/                  # 路由配置
│   │   ├── index.js             # 路由定义
│   │   └── guards.js            # 路由守卫
│   │
│   ├── store/                   # 状态管理
│   │   ├── index.js             # Pinia 实例
│   │   ├── Song.js              # 歌曲数据存储（IndexedDB）
│   │   └── modules/auth.js      # 认证状态
│   │
│   ├── views/                   # 页面组件
│   │   ├── InfoView.vue         # 首页介绍
│   │   ├── MainView.vue         # 音高分析页
│   │   ├── SeparateView.vue     # 音频分离页
│   │   ├── AboutView.vue        # 关于页面
│   │   ├── HelpView.vue         # 帮助中心
│   │   └── ...                  # 其他页面
│   │
│   └── utils/                   # 工具函数
│
├── vite.config.js               # Vite 配置
├── tailwind.config.js           # Tailwind 配置
└── package.json                 # 依赖与脚本
```

---

## 页面路由

| 路径 | 页面 | 描述 |
|-----|-----|-----|
| `/` | InfoView | 首页，产品介绍 |
| `/main` | MainView | 音高分析主功能页 |
| `/separate` | SeparateView | 音频分离功能页 |
| `/about` | AboutView | 关于页面 |
| `/help` | HelpView | 帮助中心目录 |
| `/help/:slug` | HelpArticleView | 具体帮助文章 |
| `/auth/login` | EmailLoginView | 邮箱登录页 |
| `/user/profile` | ProfileView | 用户资料页（需登录） |

---

## 构建与部署

### 开发环境

```bash
npm run dev          # 启动开发服务器，端口 8080
```

### 生产构建

```bash
npm run build:cn     # 构建国内版本
npm run build:intl   # 构建国际版本
```

两个版本的区别在于 API 地址和 SEO 配置（hreflang 标签）。

### 部署

```bash
npm run deploy:cn    # 部署国内站到 Cloudflare Pages
npm run deploy       # 部署国际站到 Cloudflare Pages
```

### 关键配置

**Vite 代理配置**（开发环境）：
- `/api` → API 服务器
- `/r2-models` → Cloudflare R2 模型存储

**Vite 构建配置**：
- 资源内联阈值设为 0，避免 Worker 文件被内联导致运行错误
- 排除 onnxruntime-web 的预优化，避免与 Worker 冲突

---

## 性能优化要点

1. **模型缓存**：使用 Cache API 缓存大型模型文件，避免重复下载
2. **Worker 计算**：计算密集型任务在 Web Worker 中执行，保持 UI 响应
3. **分块处理**：长音频分块处理，控制内存峰值
4. **懒加载**：路由级别代码分割，按需加载页面
5. **CDN 分发**：静态资源和模型文件通过 CDN 加速

---

## 安全考虑

1. **本地处理**：所有音频分析在浏览器本地完成，音频数据不上传服务器
2. **Token 刷新**：使用 Refresh Token 机制，Access Token 短期有效
3. **路由守卫**：保护需要认证的页面
4. **HTTPS**：全站强制 HTTPS

---

## 维护与扩展

### 添加新的语言支持

1. 在 `src/i18n/langs/` 下添加新的语言文件
2. 在 `src/i18n/index.js` 中导入并注册
3. 更新 SEO 配置中的 hreflang 标签

### 更新 AI 模型

1. 替换 `public/` 目录下的模型文件
2. 或更新 R2 存储中的模型文件
3. 注意更新模型版本号以触发缓存更新

### 添加新的 API 接口

1. 在 `src/api/` 下定义接口函数
2. 使用统一的 Axios 实例（自动附加认证头）
3. 处理错误响应时使用 notivue 显示通知

---

## 总结

识音是一个技术栈现代化的 Web 应用，核心亮点在于：

1. **完全本地化处理**：保护隐私，无需网络即可完成核心功能
2. **先进的 AI 技术**：采用 Spotify BasicPitch 和 Meta Demucs 等业界领先的模型
3. **良好的用户体验**：响应式设计、实时可视化、进度反馈
4. **国际化支持**：中英文双语，SEO 友好

项目代码结构清晰，组件职责分明，便于后续维护和功能扩展。
