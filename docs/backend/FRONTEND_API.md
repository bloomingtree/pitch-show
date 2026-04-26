# 识音 (Shiyin) 前端接入 API 文档

> **Base URL**: `https://shiyin.notalabs.cn/api`
> **版本**: 4.0.0 (去社区化重构)
> **更新时间**: 2026-04-24
> **认证方式**: Bearer JWT（由 auth-server `https://auth.notalabs.cn` 签发）
> **响应格式**: JSON，统一包裹为 `{ success, data, message?, timestamp }`

---

## 目录

1. [认证机制](#1-认证机制)
2. [统一响应格式](#2-统一响应格式)
3. [歌曲模块](#3-歌曲模块)
4. [分析模块](#4-分析模块)
5. [用户模块](#5-用户模块)
6. [分析结果数据结构](#6-分析结果数据结构)
7. [错误码参考](#7-错误码参考)
8. [典型流程](#8-典型流程)

---

## 1. 认证机制

### 概述

前端不直接调用本后端的登录接口。登录流程由统一的认证中心完成：

1. 前端调用 `auth-server` 完成 OTP 邮箱验证登录
2. `auth-server` 返回 JWT token
3. 前端将此 token 放入后续所有请求的 `Authorization` header 中

### Token 使用

```
Authorization: Bearer <jwt-token>
```

所有接口默认需要认证（返回 401 `Unauthorized`）。标注为 **公开** 的接口不需要 token。

### 前端接入示例

```typescript
// 登录后保存 token（由 auth-server 完成）
const token = await loginWithEmailOTP(email, code);

// 后续请求统一带 token
const api = axios.create({
  baseURL: 'https://shiyin.notalabs.cn/api',
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 2. 统一响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-24T00:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "data": null,
  "message": "错误描述",
  "timestamp": "2026-04-24T00:00:00.000Z",
  "path": "/api/xxx"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## 3. 歌曲模块

### POST /songs

上传音频并启动 AI 分析流水线。这是前端最核心的接口。

**认证**: 需要 | **Content-Type**: `multipart/form-data`

**请求参数**:

| 字段 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| file | File | form-data | 是 | 音频文件（mp3/wav/flac/ogg/aac/m4a，最大 30MB） |
| name | string | query | 否 | 歌曲标题（默认取文件名） |
| truncate | boolean | query | 否 | 超过 7 分钟时是否截取 |

**前端接入示例**:

```typescript
const formData = new FormData();
formData.append('file', audioFile);

const response = await api.post('/songs?name=我的歌曲&truncate=true', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000, // 上传超时
});

const { id, status, cached } = response.data.data;
// status = "completed" 时 cached=true，说明 MD5 命中缓存，秒出结果
// status = "analyzing" 时，需要轮询进度
```

**响应 — 缓存命中（秒出）**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的歌曲",
    "status": "completed",
    "audio": {
      "url": "https://storage.../xxx.mp3",
      "duration": 269,
      "filename": "我的歌曲.mp3",
      "file_size": 6283264
    },
    "analysis": {
      "tracks": { "vocals": {}, "bass": {}, "drums": {}, "other": {} },
      "beats": [],
      "chords": [],
      "tempo": 120,
      "key": "C major"
    },
    "cached": true,
    "created_at": "2026-04-24T10:00:00Z"
  }
}
```

**响应 — 需要新分析**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "我的歌曲",
    "status": "analyzing",
    "audio": {
      "url": "https://storage.../xxx.mp3",
      "duration": 269,
      "filename": "我的歌曲.mp3",
      "file_size": 6283264
    },
    "analysis": null,
    "cached": false,
    "created_at": "2026-04-24T10:00:00Z"
  }
}
```

**错误码**:

| 状态码 | code | 说明 |
|--------|------|------|
| 400 | `QUOTA_EXCEEDED` | 存储配额已满 |
| 400 | `MONTHLY_LIMIT_EXCEEDED` | 本月分析次数已用完 |
| 400 | `AUDIO_TOO_LONG` | 音频时长超过 7 分钟限制 |

---

### GET /songs

获取我的歌曲列表。

**认证**: 需要

**Query 参数**:

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量（最大 100） |
| status | string | - | 筛选状态：`pending` / `analyzing` / `completed` / `failed` |
| search | string | - | 搜索歌曲标题 |

**响应 data**:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "晴天",
      "status": "completed",
      "audio": {
        "duration": 269,
        "filename": "晴天.mp3"
      },
      "created_at": "2026-04-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "quota": {
    "storage_limit": 5,
    "storage_used": 3,
    "is_premium": false
  }
}
```

**前端建议**: 使用 `quota` 字段在列表页展示剩余配额，避免额外请求。

---

### GET /songs/:id

获取歌曲详情（含完整分析结果）。

**认证**: 需要

**响应 data**:

```json
{
  "id": "uuid",
  "title": "晴天",
  "status": "completed",
  "error_message": null,
  "audio": {
    "url": "https://storage.../xxx.mp3",
    "duration": 269,
    "filename": "晴天.mp3",
    "file_size": 6283264
  },
  "analysis": {
    "tracks": { "vocals": {}, "bass": {}, "drums": {}, "other": {} },
    "beats": [],
    "chords": [],
    "tempo": 120,
    "key": "C major",
    "processing_time": 215.3
  },
  "created_at": "2026-04-24T10:00:00Z",
  "updated_at": "2026-04-24T10:03:35Z"
}
```

**歌曲状态**:

| status | 说明 | analysis 值 |
|--------|------|------------|
| `pending` | 等待分析 | `null` |
| `analyzing` | 分析中 | `null` |
| `completed` | 分析完成 | 包含完整分析数据 |
| `failed` | 分析失败 | `null`，`error_message` 有值 |

---

### PUT /songs/:id

更新歌曲信息（仅允许修改标题）。

**认证**: 需要（仅歌曲所有者）

**请求 Body**:

```json
{
  "title": "新标题"
}
```

**响应 data**:

```json
{
  "id": "uuid",
  "title": "新标题",
  "status": "completed",
  "updated_at": "2026-04-24T10:30:00Z"
}
```

---

### DELETE /songs/:id

删除歌曲（含引用计数处理）。

**认证**: 需要（仅歌曲所有者）

**说明**:
- 仅 `completed` 状态的歌曲会释放 `storage_used` 配额
- 当音频文件引用计数归零时，自动清理 audio_file + analysis_result + Storage 文件

**响应 data**:

```json
{
  "message": "歌曲已删除"
}
```

---

### DELETE /songs/batch

批量删除歌曲。

**认证**: 需要

**请求 Body**:

```json
{
  "song_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**响应 data**:

```json
{
  "message": "已删除 3 首歌曲",
  "deleted_count": 3
}
```

---

### POST /songs/:id/retry

重新分析失败的歌曲。

**认证**: 需要（仅歌曲所有者）

**前置条件**: 歌曲 `status` 必须为 `failed`

**说明**:
- 不需要重新上传文件，复用已有的 audio_file
- 不额外扣配额（上次失败已回滚 storage_used）

**响应 data**: 同 [POST /songs](#post-songs) 的「需要新分析」响应

---

## 4. 分析模块

### GET /analysis/:songId/progress

获取分析进度（轮询接口）。

**认证**: 需要

**建议轮询间隔**: 每 5 秒

**响应 data**:

```json
{
  "song_id": "uuid",
  "status": "analyzing",
  "stage": "detecting",
  "label": "正在检测音符...",
  "percent": 55,
  "estimated_remaining_seconds": 128
}
```

**stage 取值**:

| stage | label | percent |
|-------|-------|---------|
| `pending` | 等待开始... | 0 |
| `separating` | 正在分离音轨... | 26 |
| `detecting` | 正在检测音符... | 55 |
| `analyzing` | 正在分析和弦与节拍... | 80 |
| `finalizing` | 正在生成结果... | 95 |
| `completed` | 分析完成 | 100 |
| `failed` | 分析失败 | 0 |

**前端轮询示例**:

```typescript
async function pollAnalysisProgress(songId: string): Promise<void> {
  while (true) {
    const { data } = await api.get(`/analysis/${songId}/progress`);
    const progress = data.data;

    updateUI({
      status: progress.status,
      stage: progress.label,
      percent: progress.percent,
      remaining: progress.estimated_remaining_seconds,
    });

    if (progress.status === 'completed') {
      // 获取完整歌曲数据（含分析结果）
      const song = await api.get(`/songs/${songId}`);
      return song.data.data;
    }

    if (progress.status === 'failed') {
      throw new Error(progress.label);
    }

    await sleep(5000);
  }
}
```

---

### GET /analysis/quota/me

获取当前用户配额信息。

**认证**: 需要

**响应 data**:

```json
{
  "storage_limit": 5,
  "storage_used": 2,
  "monthly_limit": 2,
  "monthly_used": 1,
  "is_premium": false
}
```

**配额说明**:

| 指标 | 免费用户 | 高级用户 |
|------|---------|---------|
| storage_limit | 5 首歌 | 30 首歌 |
| monthly_limit | 2 次/月 | 无限制 (-1) |

**前端建议**: 在分析页面展示 `剩余次数 = monthly_limit - monthly_used`，`剩余存储 = storage_limit - storage_used`。

---

## 5. 用户模块

### GET /users/me

获取当前用户完整资料。

**认证**: 需要

**响应 data**:

```json
{
  "id": "uuid",
  "username": "用户名",
  "avatar_url": "https://...",
  "bio": "个人简介",
  "website_url": "https://example.com",
  "is_premium": false,
  "premium_expires_at": null,
  "settings": {
    "theme": "auto",
    "language": "zh-CN"
  },
  "created_at": "2026-04-01T00:00:00Z"
}
```

**前端建议**: 应用启动时调用此接口，获取用户信息和设置。

---

### PUT /users/me

更新用户资料。

**认证**: 需要

**请求 Body**:

```json
{
  "username": "新昵称",
  "bio": "个人简介",
  "website_url": "https://example.com",
  "avatar_url": "https://..."
}
```

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| username | string | 否 | 1-64 字符，唯一 |
| bio | string | 否 | 最大 500 字符 |
| website_url | string(url) | 否 | 合法 URL |
| avatar_url | string(url) | 否 | 合法 URL |

---

### PUT /users/me/settings

更新用户设置（合并更新，只传需要修改的字段）。

**认证**: 需要

**请求 Body**:

```json
{
  "theme": "dark",
  "language": "zh-CN",
  "notifications": {
    "email": true,
    "push": false
  },
  "privacy": {
    "profile_visible": true,
    "activity_visible": false
  }
}
```

**响应 data**:

```json
{
  "settings": {
    "theme": "dark",
    "language": "zh-CN",
    "notifications": { "email": true, "push": false },
    "privacy": { "profile_visible": true, "activity_visible": false }
  }
}
```

---

## 6. 分析结果数据结构

当歌曲 `status` 为 `completed` 时，`GET /songs/:id` 返回的 `analysis` 字段结构如下：

```typescript
interface AnalysisResult {
  tracks: {
    vocals: Track;
    bass: Track;
    drums: Track;
    other: Track;
  };
  beats: {
    bpm: number;            // 估计 BPM
    time_signature: string; // 拍号，如 "4/4", "2/4"
    beats: number[];        // 所有节拍时间点（秒）
    downbeats: number[];    // 强拍时间点（秒）
  };
  chords: Array<{
    start: number;          // 和弦起始时间（秒）
    end: number;            // 和弦结束时间（秒）
    chord: string;          // 和弦名，如 "C:maj", "A:min", "N"（无和弦）
    confidence: number;     // 置信度
  }>;
  tempo: number;            // BPM
  key: string;              // 调性，如 "C major"
  processing_time: number;  // 分析耗时（秒）
}

interface Track {
  color: string;   // 渲染颜色 HEX
  instrument: string;
  notes: Note[];
}

interface Note {
  pitch: number;      // MIDI 音高 (0-127)
  onset: number;      // 起始时间（秒）
  offset: number;     // 结束时间（秒）
  velocity: number;   // 力度 (0.0-1.0)
  drum_name?: string; // 仅 drums 轨
}
```

### 四轨颜色映射

| 音轨 | 颜色 | 用途 |
|------|------|------|
| vocals | `#FF6B6B` (红色) | 人声旋律 |
| bass | `#4ECDC4` (青色) | 贝斯低音 |
| drums | `#FFE66D` (黄色) | 打击乐 |
| other | `#95E1D3` (薄荷色) | 其他伴奏 |

### 前端 Canvas 渲染转换

```typescript
function convertForCanvas(analysis: AnalysisResult) {
  const notes = [];
  for (const [trackName, track] of Object.entries(analysis.tracks)) {
    for (const n of track.notes) {
      notes.push({
        pitchMidi: n.pitch,
        startTimeSeconds: n.onset,
        durationSeconds: n.offset - n.onset,
        amplitude: n.velocity,
        trackName,
        trackColor: track.color,
      });
    }
  }
  notes.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
  return { notes, duration: audio.duration, beats: analysis.beats, chords: analysis.chords };
}
```

---

## 7. 错误码参考

### HTTP 状态码

| 状态码 | 说明 | message 示例 |
|--------|------|-------------|
| 200 | 成功 | - |
| 400 | 请求参数错误 / 业务异常 | "请上传音频文件", "不支持的音频格式" |
| 401 | 未认证 / Token 无效 | "Unauthorized" |
| 403 | 无权限 | "无权操作此歌曲" |
| 404 | 资源不存在 | "用户不存在", "歌曲不存在" |
| 500 | 服务器错误 | 内部异常 |

### 业务错误码（HTTP 400）

| code | 说明 | 附加 data |
|------|------|-----------|
| `QUOTA_EXCEEDED` | 存储配额已满 | `storage_used`, `storage_limit` |
| `MONTHLY_LIMIT_EXCEEDED` | 本月分析次数已用完 | `monthly_used`, `monthly_limit` |
| `AUDIO_TOO_LONG` | 音频时长超过限制 | `duration`, `max_duration` |

**前端错误处理示例**:

```typescript
try {
  await api.post('/songs', formData);
} catch (err) {
  const { code, message, data } = err.response?.data || {};
  switch (code) {
    case 'QUOTA_EXCEEDED':
      showUpgradeDialog('存储空间已满，升级 Pro 解锁 30 首歌');
      break;
    case 'MONTHLY_LIMIT_EXCEEDED':
      showUpgradeDialog('本月分析次数已用完');
      break;
    case 'AUDIO_TOO_LONG':
      confirm(`音频 ${data.duration}s 超过限制 ${data.max_duration}s，是否截取前 7 分钟？`);
      break;
    default:
      showError(message || '上传失败');
  }
}
```

---

## 8. 典型流程

### 完整分析流程

```
1. 前端上传音频
   POST /api/songs  (multipart/form-data)
   → { id: songId, status: "completed", cached: true }  // 缓存命中
   → { id: songId, status: "analyzing", cached: false }  // 需要分析

2. [仅 analyzing 时] 轮询进度（每 5 秒）
   GET /api/analysis/:songId/progress
   → { stage: "separating", percent: 26 }
   → { stage: "detecting", percent: 55 }
   → { stage: "completed", percent: 100 }
   → { stage: "failed", percent: 0 }  // 失败时可重试

3. 获取分析结果
   GET /api/songs/:songId
   → { analysis: { tracks, beats, chords, tempo, key, ... } }

4. 前端渲染四色钢琴卷帘 Canvas
```

### 分析失败重试流程

```
1. 分析失败
   GET /api/analysis/:songId/progress
   → { status: "failed" }

2. 用户点击重试
   POST /api/songs/:songId/retry
   → { status: "analyzing" }  // 不需要重新上传

3. 回到轮询流程（步骤 2）
```

### 删除歌曲流程

```
1. 单个删除
   DELETE /api/songs/:id
   → { message: "歌曲已删除" }

2. 批量删除
   DELETE /api/songs/batch
   Body: { "song_ids": ["uuid1", "uuid2"] }
   → { message: "已删除 2 首歌曲", deleted_count: 2 }

注意: 删除 completed 状态的歌曲会自动释放存储配额
```

---

## API 端点总览

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/songs` | 上传音频并开始分析 | 需要 |
| GET | `/api/songs` | 获取我的歌曲列表 | 需要 |
| GET | `/api/songs/:id` | 获取歌曲详情 | 需要 |
| PUT | `/api/songs/:id` | 更新歌曲标题 | 需要 |
| DELETE | `/api/songs/:id` | 删除歌曲 | 需要 |
| DELETE | `/api/songs/batch` | 批量删除歌曲 | 需要 |
| POST | `/api/songs/:id/retry` | 重试分析失败歌曲 | 需要 |
| GET | `/api/analysis/:songId/progress` | 获取分析进度 | 需要 |
| GET | `/api/analysis/quota/me` | 获取配额信息 | 需要 |
| GET | `/api/users/me` | 获取用户资料 | 需要 |
| PUT | `/api/users/me` | 更新用户资料 | 需要 |
| PUT | `/api/users/me/settings` | 更新用户设置 | 需要 |
| GET | `/api/health` | 健康检查 | 公开 |
