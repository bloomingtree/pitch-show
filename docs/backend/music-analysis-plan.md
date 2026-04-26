# 识音 — 后端分析集成方案

> 日期: 2026-04-18（v3 更新：音频压缩策略、时长限制、8 核函数配置）
> 决策: 暂不实现支付API，微信手动开通 + Supabase Dashboard 管理，先用 CPU 部署，修改现有 SongPitch.vue
> 存储: 音频与分析结果共享池化（MD5 去重），初期不提供分离音轨下载功能
> 预处理: 统一 ffmpeg 压缩为 192kbps MP3，最长 7 分钟，函数配置 8 核 8192MB

## 一、系统架构

```
┌──────────────┐      ┌───────────────────────┐      ┌──────────────┐
│   Frontend   │      │    NestJS Backend      │      │   Supabase   │
│   (Vue 3)    │      │    (Auth + API 网关)    │      │ (DB + Auth)  │
│              │      │                        │      │              │
│ · 上传音频   │─────→│ · POST /projects       │─────→│ · profiles   │
│ · 展示结果   │←─────│ · POST /analyze        │      │ · projects   │
│ · 四色卷帘   │      │ · GET  /projects/:id   │      │ · files      │
└──────────────┘      └──────────┬─────────────┘      └──────────────┘
                                 │ HTTP (audio_url)
                                 ▼
                      ┌──────────────────────┐
                      │   Python AI Backend   │
                      │   (阿里云函数计算/CPU)  │
                      │   POST /analyze       │
                      └──────────────────────┘
```

### 数据流（含共享音频池去重 + 音频预处理）

```
1. 前端: 用户上传音频 → POST /api/projects (audio file)
2. NestJS:
   · 校验登录 + 存储配额（免费5首/会员30首）
   · 音频预处理（ffmpeg）:
     - 检测时长: 超过 7 分钟 → 提示截取前 7 分钟
     - 检测大小: 超过 30MB → 提示压缩
     - 统一压缩为 192kbps MP3（节省 40-86% 存储）
   · 计算压缩后文件 MD5
   · 查询 audio_files 表是否已有相同文件:
     - 已有 → 复用 audio_file，reference_count += 1
     - 已有且含 analysis_result → 直接返回结果（秒出！跳过分析）
     - 无 → 上传到 Supabase Storage，创建 audio_files 记录
   · 创建 project (status: 'analyzing')
   · 如需分析: POST Python /analyze { audio_url }
3. Python (~210-500s，3 分钟歌 ~210s，7 分钟歌 ~500s): 分离 → 检测 → 返回完整 JSON
4. NestJS: 保存 analysis_result（关联 audio_file）→ project.status = 'completed'
5. 前端: 轮询 GET /api/projects/:id/progress → 渲染进度 → 完成后显示四色钢琴卷帘
```

### 分析管道各阶段及预估耗时（8 vCPU 函数计算）

```
┌────────────────────────────────────────────────────────────────┐
│ Demucs 音轨分离 │ PYIN人声 │ BasicPitch×2 │ 鼓件 │ 和弦+节拍  │
│    ~90s (26%)   │  ~30s    │   ~40s       │ ~15s │  ~35s (100%)│
└────────────────────────────────────────────────────────────────┘
总计约 210-500s（3 分钟歌 ~210s，7 分钟歌 ~500s，取决于歌曲时长和复杂度）
```

---

## 二、用户体验流程（点击"开始分析"）

### 流程图

```
用户点击「开始分析」
       │
       ▼
  ┌─────────────┐
  │ 弹出选择面板  │
  │             │
  │ · 普通版     │ ──→ 浏览器内 BasicPitch（现有功能，免登录）
  │ · 专业版     │ ──→ 后端 AI 分析（4轨分离 + 和弦 + 节拍 + 鼓件分类）
  └─────────────┘
                    │
                    ▼ 专业版
              ┌───────────┐
              │ 已登录?    │
              │           │
              │ 是 → 直接开始分析（检查配额）                │
              │ 否 → 弹出登录/注册面板（Email OTP，6位验证码） │
              └───────────┘
                    │
                    ▼ 已登录
              ┌───────────┐
              │ 会员用户?  │
              │           │
              │ 是 → 直接开始分析（无限次）    │
              │ 否 → 免费用户（5首存储+2次/月） │
              └───────────┘
                    │
                    ▼ 存储配额已满
              ┌─────────────────┐
              │ 弹出空间管理面板  │
              │ (见下方 UI 设计)  │
              └─────────────────┘
```

### 配额管理 UX

**存储已满时的交互设计：**

```
用户点击「专业版分析」→ 检测到存储配额已满（如 30/30 首）
       │
       ▼
┌─────────────────────────────────────┐
│     存储空间已满                      │
│     您的分析配额已用 30/30 首         │
│                                     │
│  请释放空间后继续分析：               │
│                                     │
│  ☐ 致爱丽丝.mp3    2026-04-10  [🗑]  │
│  ☐ 晴天.mp3       2026-04-08  [🗑]  │
│  ☐ 夜曲.mp3       2026-04-01  [🗑]  │
│  ☐ 卡农.mp3       2026-03-25  [🗑]  │
│  ... (按时间排序，可滚动)             │
│                                     │
│  已选中 2 首，释放后将有 2 个空位      │
│                                     │
│       [取消]     [释放空间并继续]      │
└─────────────────────────────────────┘
```

设计要点：
- 列表按分析时间排序（最新在上），方便用户找到旧歌删除
- 多选删除，底部实时显示"释放后可用空位数"
- 确认后才执行删除 + 继续分析流程
- 删除的是用户 project 关联，底层音频文件因引用计数可能保留（其他用户共享）

### 音频时长限制 UX

**超过 7 分钟的音频处理逻辑：**

```
用户上传音频 → NestJS ffmpeg 检测时长
       │
       ▼
  ┌──────────────────────────┐
  │ 时长 ≤ 7 分钟?            │
  └──────────┬───────────────┘
             │
     ┌───────┴───────┐
     │               │
   是               否（> 7 分钟）
     │               │
     ▼               ▼
正常分析流程    弹出提示对话框:
              ┌──────────────────────────────────┐
              │  音频时长过长                      │
              │                                  │
              │  当前音频: 8 分 32 秒             │
              │  最长支持: 7 分钟                 │
              │                                  │
              │  ○ 截取前 7 分钟进行分析（推荐）    │
              │  ○ 取消上传                       │
              │                                  │
              │       [取消]    [确认分析]         │
              └──────────────────────────────────┘
```

设计要点：
- 默认选中"截取前 7 分钟"选项
- 截取操作在 NestJS 端通过 ffmpeg 完成：`ffmpeg -i input -t 420 -c copy output.mp3`
- 截取后的文件重新计算 MD5，进入正常的共享池去重流程
- 文件大小超过 30MB 的提示合并到同一对话框中
- 7 分钟限制原因：函数计算 HTTP 触发器硬性 600s 超时，7 分钟歌分析约 500s，留 100s 余量

### 分析进度弹窗

```
┌──────────────────────────────────┐
│     专业版 AI 分析中              │
│                                  │
│  正在分离音轨...                  │
│  ████████████░░░░░░░░  26%       │
│                                  │
│  预计剩余: 约 4 分钟              │
│                                  │
│       [取消分析]                  │
└──────────────────────────────────┘
```

- 前端每 3s 轮询 `GET /api/projects/:id/progress`
- MD5 命中已有分析时：不显示进度弹窗，直接秒出结果
```

### UI 交互设计

**选择面板（弹窗）**：
```
┌──────────────────────────────────┐
│        选择分析模式               │
│                                  │
│  ┌──────────┐  ┌──────────────┐  │
│  │  普通版   │  │   专业版      │  │
│  │  免费     │  │   免费 2次/月 │  │
│  │          │  │              │  │
│  │ 浏览器内  │  │ · AI 音轨分离 │  │
│  │ 音符检测  │  │ · 4色音符显示 │  │
│  │          │  │ · 和弦 + 节拍 │  │
│  │ 速度快    │  │ · 鼓件分类    │  │
│  │ 精度一般  │  │ · 高精度检测  │  │
│  │          │  │              │  │
│  │ [开始]   │  │  [开始分析]   │  │
│  └──────────┘  └──────────────┘  │
└──────────────────────────────────┘
```

**登录面板（弹窗，仅专业版未登录时出现）**：
```
┌──────────────────────────────────┐
│        登录以使用专业版           │
│                                  │
│  邮箱: [________________]        │
│        [发送验证码]              │
│                                  │
│  验证码: [______]                │
│                                  │
│  [登录 / 注册]                   │
│                                  │
│  无需密码，6位验证码即可         │
└──────────────────────────────────┘
```

---

## 三、前端修改清单

### 3.1 SongPitch.vue 修改

**新增方法**：
- `chooseAnalysisMode()` — 弹出普通版/专业版选择面板
- `startLocalAnalysis()` — 原有浏览器内分析（= 普通版）
- `startProAnalysis(file)` — 后端分析流程（= 专业版）
- `showSongFromBackend(backendData)` — 将后端 JSON 转为 Canvas 渲染数据

**修改方法**：
- `startAnanlyze()` — 改为调用 `chooseAnalysisMode()` 而非直接开始分析
- `drawNote(singleNote)` — 增加 `trackColor` 判断，支持四色渲染

**新增 data**：
- `analysisMode: 'none'` — 'none' | 'local' | 'pro'
- `beats: null` — 节拍数据
- `chords: null` — 和弦数据
- `trackFilters: { vocals: true, bass: true, drums: true, other: true }` — 音轨过滤

**新增组件引用**：
- `AnalysisModeDialog.vue` — 分析模式选择弹窗
- `TrackTogglePanel.vue` — 音轨开关面板

### 3.2 新建文件

| 文件 | 说明 |
|------|------|
| `src/api/analysis.js` | 后端分析 API 调用 + 数据转换函数 |
| `src/components/AnalysisModeDialog.vue` | 普通版/专业版选择弹窗 |
| `src/components/panels/TrackTogglePanel.vue` | 音轨开关面板 |

### 3.3 四色渲染逻辑

```javascript
drawNote(singleNote) {
    let color;
    if (singleNote.trackColor) {
        // 专业版：按音轨着色
        const hex = singleNote.trackColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const opacity = 0.2 + 0.8 * (singleNote.amplitude || 0.5);
        color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
        // 普通版：isDynamic 双色（保持不变）
        const scheme = this.colorSchemes[this.colorScheme] || this.colorSchemes.sunset;
        const hex = singleNote.isDynamic ? scheme.dynamic : scheme.stable;
        // ... 原有逻辑
    }
    // 后续绘制逻辑不变
}
```

### 3.4 后端数据转换

```javascript
// src/api/analysis.js
export function convertBackendResult(backendData) {
    const notes = []
    for (const [trackName, track] of Object.entries(backendData.tracks || {})) {
        for (const n of track.notes) {
            notes.push({
                pitchMidi: n.pitch,
                startTimeSeconds: n.onset,
                durationSeconds: n.offset - n.onset,
                amplitude: n.velocity,
                trackName,
                trackColor: track.color,
            })
        }
    }
    notes.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    return { notes, beats: backendData.beats, chords: backendData.chords }
}
```

---

## 四、NestJS 后端修改清单

### 4.1 新增数据库表

#### 4.1.1 共享音频文件池

```sql
-- 共享音频文件池：同一首歌只存一份
CREATE TABLE shiyin.audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash TEXT NOT NULL UNIQUE,      -- 文件 MD5（去重键）
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,             -- Supabase Storage 路径
    file_size INTEGER NOT NULL,             -- 字节
    duration REAL,                          -- 秒
    reference_count INTEGER NOT NULL DEFAULT 1,  -- 被多少个项目引用
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 共享分析结果池：同一首歌只分析一次
CREATE TABLE shiyin.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL REFERENCES shiyin.audio_files(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,           -- 完整分析 JSON
    processing_time REAL,                   -- 实际耗时(秒)，用于优化后续进度估算
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(audio_file_id)                   -- 每个音频文件只有一份分析结果
);
```

#### 4.1.2 用户存储配额

```sql
CREATE TABLE shiyin.analysis_quotas (
    user_id UUID PRIMARY KEY REFERENCES shiyin.profiles(id) ON DELETE CASCADE,
    storage_limit INTEGER NOT NULL DEFAULT 5,   -- 最大存储歌曲数
    storage_used INTEGER NOT NULL DEFAULT 0,    -- 当前已用歌曲数
    monthly_limit INTEGER NOT NULL DEFAULT 2,   -- 每月分析次数（免费用户）
    monthly_used INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.1.3 修改 projects 表

```sql
-- projects 表新增关联字段
ALTER TABLE shiyin.projects
    ADD COLUMN IF NOT EXISTS audio_file_id UUID REFERENCES shiyin.audio_files(id),
    ADD COLUMN IF NOT EXISTS analysis_result_id UUID REFERENCES shiyin.analysis_results(id);
```

### 4.2 共享音频池核心逻辑

#### 分析流程（含去重）

```
用户上传音频
       │
       ▼
计算文件 MD5
       │
       ▼
  ┌──────────────────────────┐
  │ audio_files 中是否存在    │
  │ 该 content_hash?          │
  └──────────┬───────────────┘
             │
     ┌───────┴───────┐
     │               │
   已存在          不存在
     │               │
     ▼               ▼
 reference_count   上传到 Supabase Storage
 += 1              创建 audio_files 记录
     │               │
     └───────┬───────┘
             ▼
  ┌──────────────────────────┐
  │ 是否已有 analysis_result? │
  └──────────┬───────────────┘
             │
     ┌───────┴───────┐
     │               │
   已有             没有
     │               │
     ▼               ▼
  秒出结果!         调用 Python AI 分析
  (0s 等待)         保存到 analysis_results
     │               │
     └───────┬───────┘
             ▼
创建 project 关联 audio_file + analysis_result
返回结果给前端
```

#### 删除流程（引用计数）

```
用户删除项目
       │
       ▼
删除 project 记录（解除用户与音频的关联）
       │
       ▼
audio_files.reference_count -= 1
       │
       ▼
  ┌──────────────────────────┐
  │ reference_count == 0 ?    │
  └──────────┬───────────────┘
             │
     ┌───────┴───────┐
     │               │
   = 0              > 0
     │               │
     ▼               ▼
删除:               保留
· analysis_result   （其他用户仍在使用）
· audio_file
· Storage 中的文件
```

### 4.3 存储配额与容量规划

#### nota 服务器存储现状

| 项目 | 大小 |
|------|------|
| 总磁盘 | 60GB |
| 已用 | 32GB（Docker 镜像 22GB + 系统 ~10GB） |
| 可用 | 25GB |
| 可用于用户数据 | ~15-20GB（预留系统开销） |

#### 音频预处理（上传时自动执行）

所有上传的音频文件在存储前统一经过 ffmpeg 预处理：

| 步骤 | 说明 | 命令 |
|------|------|------|
| 时长检测 | > 7 分钟 → 提示用户截取 | `ffprobe -v error -show_entries format=duration` |
| 文件大小检测 | > 30MB → 提示压缩 | 原始文件大小检查 |
| 统一压缩 | 转为 192kbps CBR MP3 | `ffmpeg -i input -codec:a libmp3lame -b:a 192k output.mp3` |

**压缩效果**：
- 原始 WAV/FLAC: 30-50MB → 压缩后 ~5-8MB（节省 80-86%）
- 原始 320kbps MP3: 8-15MB → 压缩后 ~5-8MB（节省 40-50%）
- 原始 128kbps MP3: 3-5MB → 保持原样（不向上重编码）
- 192kbps 足以保证分析精度（和弦、音符检测不受影响）

#### 每首歌的存储开销（压缩后）

| 数据类型 | 大小 | 存储策略 |
|---------|------|---------|
| 压缩音频（192kbps MP3） | 5-8MB（7 分钟歌约 8MB） | 永久存储（共享池） |
| 分析结果 JSON | 200-500KB | 永久存储（共享池） |
| 分离音轨（4轨 WAV） | 60-80MB | **不存储** |
| 分离音轨（4轨 MP3） | 10-20MB | **不存储** |
| **每首歌实际占用** | **~7MB** | |

#### 用户配额设计

| 用户类型 | 存储上限（歌曲数） | 单用户占用 | 说明 |
|---------|-----------------|-----------|------|
| 免费用户 | 5 首 | ~35MB | 含 2 次/月分析次数限制 |
| 会员用户 | 30 首 | ~210MB | 无分析次数限制 |

#### 容量估算（按压缩后 ~7MB/首计算）

| 场景 | 共享池节省 | 总占用 |
|------|-----------|--------|
| 100 用户（50 首不同歌） | 0% | ~350MB |
| 100 用户（含热门歌重复） | ~40% | ~210MB |
| 200 用户（含热门歌重复） | ~40% | ~420MB |
| 500 用户（含热门歌重复） | ~40% | ~1.05GB |
| 1000 用户（含热门歌重复） | ~40% | ~2.1GB |

结论：当前 15-20GB 可用空间，可支持 **500-1000 用户**，初期完全够用。

#### 分离音轨策略

**初期不提供分离音轨下载功能。** 原因：
- 存储 4 轨分离音轨会使每首歌占用从 7MB 增至 15-80MB
- 产品核心价值是"看"分析结果（四色卷帘 + 和弦 + 节拍），而非"听"分离音轨
- 未来如需提供，可按需重新运行 Demucs（~90s），或临时缓存 24h

### 4.4 新增 analysis 模块

| 文件 | 说明 |
|------|------|
| `src/modules/analysis/analysis.module.ts` | 模块定义 |
| `src/modules/analysis/analysis.service.ts` | 配额检查 + MD5 去重 + 调用 Python + 保存结果 |
| `src/modules/analysis/analysis.controller.ts` | `POST /projects/:id/analyze`、`GET /projects/:id/progress` |

核心逻辑：
1. 检查存储配额（`storage_used < storage_limit`）
2. 计算音频 MD5 → 查询 `audio_files` 去重
3. 如已有 `analysis_result` → 直接复用（秒出结果）
4. 如无 → HTTP POST Python `/analyze`，timeout 600s
5. 保存到 `analysis_results` → 关联 project → `status = 'completed'`
6. `storage_used += 1`

### 4.5 分析进度显示方案

采用 **NestJS 端基于时间的阶段估算**（方案 B），阿里云零额外开销。

#### 进度接口

```
GET /api/projects/:id/progress

返回: { stage, label, percent, estimated_remaining_seconds }
```

#### 阶段估算逻辑（NestJS 端）

```typescript
function getAnalysisProgress(startedAt: Date, duration?: number) {
  const elapsed = (Date.now() - startedAt.getTime()) / 1000;
  // 如果已知同音频的实际分析耗时，使用实际值估算
  const totalEstimated = duration || 343; // 默认按 343s 估算

  if (elapsed < totalEstimated * 0.26) {
    return { stage: 'separating', label: '正在分离音轨...', percent: 26 };
  } else if (elapsed < totalEstimated * 0.61) {
    return { stage: 'detecting', label: '正在检测音符...', percent: 55 };
  } else if (elapsed < totalEstimated * 0.73) {
    return { stage: 'analyzing', label: '正在分析和弦与节拍...', percent: 80 };
  } else if (elapsed < totalEstimated * 0.95) {
    return { stage: 'finalizing', label: '正在生成结果...', percent: 95 };
  } else {
    return { stage: 'timeout', label: '分析耗时较长，请稍候...', percent: 98 };
  }
}
```

#### 进度自优化

Python 返回结果时附带 `processing_time`，NestJS 记录到 `audio_files`。
后续相同歌曲或相同时长的歌曲使用实际耗时估算，精度随使用越来越准。

#### 资源消耗

| 组件 | 额外开销 |
|------|---------|
| 阿里云函数计算 | **零** — 函数执行时长不变，进度请求不打 Python |
| nota 服务器（NestJS） | 极低 — 每 3s 一个轻量查询 |
| 前端 | 极低 — setInterval 请求 |

### 4.6 修改 projects 模块

- 新增 `POST /:id/analyze` 路由
- 新增 `GET /:id/progress` 路由
- 新增 `DELETE /:id` 路由（含引用计数处理）
- 新增 `triggerAnalysis(projectId, userId)` 方法
- 新增 `handleDeleteWithRefCount(projectId)` 方法

---

## 五、会员管理与支付方案

### 付费流程（微信手动开通）

```
用户看到套餐页面（含微信二维码）
       │
       ▼
用户加微信 → 转账付费
       │
       ▼
管理员收到付款
       │
       ▼
管理员打开 Supabase Dashboard
       │
       ▼
Table Editor → shiyin.profiles
       │
       ▼
搜索用户 email → 修改:
  · is_premium = true
  · premium_expires_at = '2026-05-17'
       │
       ▼
用户下次访问时自动获得 Pro 权限
```

### 管理方式

**当前阶段（<50 付费用户）**：直接使用 Supabase Dashboard

操作步骤：
1. 登录 Supabase → Table Editor → `shiyin.profiles`
2. 搜索用户 email
3. 编辑 `is_premium` → `true`
4. 编辑 `premium_expires_at` → 设置到期日期

需要新增的字段（在 profiles 表）：
```sql
ALTER TABLE shiyin.profiles
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
```

### 定价页面设计

前端新增一个定价/套餐页面，展示：
- 免费版功能列表 + 限制说明
- Pro 版功能列表 + 价格
- 管理员微信二维码图片
- "扫码加微信开通 Pro" 引导文案

---

## 六、实施优先级

```
Phase 1: 前端核心（3天）
  · SongPitch.vue 增加分析模式选择弹窗
  · 新增四色渲染逻辑
  · 新增音轨开关面板
  · 新增后端数据转换
  · 新增定价页面（含微信二维码）
  · 新增分析进度弹窗组件
  · 新增存储配额管理弹窗

Phase 2: NestJS 对接（2-3天）
  · profiles 表新增 premium_expires_at 字段
  · 新增 audio_files、analysis_results、analysis_quotas 表
  · 修改 projects 表新增关联字段
  · 新增 analysis 模块（含 MD5 去重 + 引用计数 + 进度估算）
  · 调用 Python 后端
  · 存储配额管理（满额弹出删除面板）

Phase 3: 部署联调（1天）
  · Python 部署到阿里云函数计算（已完成镜像构建和推送）
  · 函数配置：内存 8192MB（8 vCPU）、超时 600s、匿名访问
  · 端到端测试
  · 验证共享音频池去重效果
```

---

## 七、验证方式

1. **普通版**：点击"普通版" → 浏览器内 BasicPitch 分析 → 原有双色音符显示（功能不变）
2. **专业版（未登录）**：点击"专业版" → 弹出登录面板 → 登录后开始分析
3. **专业版（已登录）**：点击"专业版" → 直接开始分析 → 进度弹窗 → 四色音符显示
4. **MD5 去重**：两个用户上传同一首歌 → 第二个用户秒出结果
5. **存储配额**：免费用户分析第 6 首 → 弹出空间管理面板 → 删除旧歌后继续
6. **引用计数**：两用户共享同一首歌 → 一人删除 → 另一人数据不受影响
7. **音轨开关**：切换 vocals/bass/drums/other 开关 → 对应音符隐藏/显示
8. **节拍线/和弦**：Canvas 上显示节拍虚线、小节线和和弦名称
9. **进度显示**：分析过程中前端显示当前阶段（分离音轨/检测音符/分析和弦）

---

## 八、存储策略决策记录

| 决策 | 结论 | 理由 |
|------|------|------|
| 分离音轨存储 | 不存储 | 每首歌从 7MB 增至 15-80MB，服务器空间不足 |
| 音频去重 | MD5 共享池 | 热门歌曲重复率高，节省 30-50% 空间 |
| 分析结果去重 | 同音频复用 | 相同音频分析结果完全一致，省 210-500s 计算 |
| 会员存储上限 | 30 首 | 30×7MB=210MB/人，100 会员≈21GB，可用 |
| 免费用户存储 | 5 首 | 引导付费的合理限制 |
| 进度显示方案 | NestJS 时间估算 | 阿里云零额外开销，实现简单 |
| 删除策略 | 引用计数 | 安全删除，不影响其他用户 |
| Demucs 中间结果存储 | 不可行 | 中间张量 100-300MB/首，比压缩音轨更大 |
| 频谱遮罩客户端重建 | 不推荐 | 简单遮罩分离质量远不如深度学习 |
| 音频压缩 | 192kbps MP3 | 节省 40-86% 存储，192kbps 足以保证分析精度 |
| 最长音频时长 | 7 分钟 | 函数计算 HTTP 触发器硬性 600s 超时，7 分钟歌分析约 500s |
| 文件大小限制 | 30MB | 超过 30MB 的原始文件提示压缩后上传 |
| 函数计算配置 | 8192MB（8 vCPU） | 8 核 CPU 并行处理，满足 7 分钟歌 500s 内完成 |
| 截取方式 | 前端提示 + 后端 ffmpeg 截取 | 用户选择截取，NestJS 用 ffmpeg -t 420 截取后重算 MD5 |

---

## 九、阿里云部署信息

| 项目 | 值 |
|------|-----|
| 容器镜像仓库 | `crpi-j009ysy7apwjstu3.cn-beijing.personal.cr.aliyuncs.com/nota/pitch-chord-detection` |
| 函数计算 URL | `https://pitch-cetection-lotgmhbzxe.cn-beijing.fcapp.run` |
| 区域 | cn-beijing |
| 部署方式 | 容器镜像模式 |
| 函数配置 | 内存 8192MB（8 vCPU）、超时 600s |
| 本地 Docker 镜像名 | `shiyin-ai-backend:latest`（2.5GB） |
| Python AI 分析耗时 | ~210-500s/首（3 分钟歌 ~210s，7 分钟歌 ~500s） |
| 音频预处理 | ffmpeg 统一压缩为 192kbps MP3，最长 7 分钟，最大 30MB |
