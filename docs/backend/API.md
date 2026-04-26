# 识音后端 API 文档

> 版本: 5.0.0 (定价方案)
> 更新时间: 2026-04-26

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

### 认证说明

登录与注册由外部统一认证服务 (auth-server) 处理，本项目不提供登录/注册接口。请求时在 Header 中携带 JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

### 通用响应格式

**成功响应:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-26T00:00:00.000Z"
}
```

**错误响应:**
```json
{
  "success": false,
  "data": null,
  "message": "错误信息",
  "timestamp": "2026-04-26T00:00:00.000Z",
  "path": "/api/songs"
}
```

---

## 套餐等级说明

用户套餐通过 `plan_level` 字段区分，共 5 个等级：

| 等级 | plan_level | 说明 |
|------|-----------|------|
| 免费版 | `free` | 默认等级 |
| 基础版 | `basic` | 入门付费 |
| 专业版 | `pro` | 高级功能 |
| 工作室版 | `studio` | 专业团队 |
| 自定义 | `custom` | 管理员手动配置 |

### 各等级配额默认值

| 参数 | 免费版 | 基础版 | 专业版 | 工作室版 |
|------|--------|--------|--------|---------|
| 月分析次数 (monthly_limit) | 1 | 15 | 50 | -1 (无限) |
| 存储上限 (storage_limit) | 1 首 | 15 首 | 50 首 | 200 首 |
| 单次时长上限 (max_duration) | 180s (3min) | 420s (7min) | 900s (15min) | 1800s (30min) |
| 每日上限 (daily_limit) | -1 | -1 | -1 | 100 |
| MIDI 导出 (midi_export) | false | false | true | true |
| API 调用 (api_access) | false | false | false | true |

> `monthly_limit` 和 `daily_limit` 为 `-1` 表示无限制。

---

## 歌曲管理 (Songs)

### POST /songs

上传音频并开始分析。时长上限取决于用户套餐等级。

**请求:** `multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 音频文件 (支持 mp3/wav/flac/ogg/aac/m4a，最大 30MB) |
| name | string | 否 | 歌曲标题（默认取文件名） |
| truncate | boolean | 否 | 超过套餐时长上限时是否截取 |

**响应 — 缓存命中（秒出）:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "晴天",
    "status": "completed",
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
      "key": "C major"
    },
    "cached": true,
    "created_at": "2026-04-26T10:00:00Z"
  }
}
```

**响应 — 需要新分析:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "晴天",
    "status": "analyzing",
    "audio": {
      "url": "https://storage.../xxx.mp3",
      "duration": 269,
      "filename": "晴天.mp3",
      "file_size": 6283264
    },
    "analysis": null,
    "cached": false,
    "created_at": "2026-04-26T10:00:00Z"
  }
}
```

**错误码:**

| 状态码 | code | 说明 | data 字段 |
|--------|------|------|-----------|
| 400 | `QUOTA_EXCEEDED` | 存储配额已满 | `storage_used`, `storage_limit` |
| 400 | `MONTHLY_LIMIT_EXCEEDED` | 本月分析次数已用完 | `monthly_used`, `monthly_limit` |
| 400 | `DAILY_LIMIT_EXCEEDED` | 今日分析次数已达上限 | `daily_used`, `daily_limit` |
| 400 | `AUDIO_TOO_LONG` | 音频时长超过套餐上限且未截取 | `duration`, `max_duration` |
| 400 | `DURATION_EXCEEDED` | 音频时长超过套餐上限 | `duration`, `max_duration` |

---

### GET /songs

获取我的歌曲列表（含配额信息）。

**参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 20 | 每页数量 (最大 100) |
| status | string | - | 筛选状态: pending / analyzing / completed / failed |
| search | string | - | 搜索歌曲标题 |

**响应:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "title": "晴天",
        "status": "completed",
        "audio": {
          "duration": 269,
          "filename": "晴天.mp3"
        },
        "created_at": "2026-04-26T10:00:00Z"
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
      "storage_limit": 1,
      "storage_used": 1,
      "plan_level": "free",
      "features": {
        "midi_export": false,
        "api_access": false
      }
    }
  }
}
```

---

### GET /songs/:id

获取歌曲详情（含音频 URL + 分析结果）。

**响应:**
```json
{
  "success": true,
  "data": {
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
    "created_at": "2026-04-26T10:00:00Z",
    "updated_at": "2026-04-26T10:03:35Z"
  }
}
```

**歌曲状态说明:**

| status | 说明 |
|--------|------|
| `pending` | 等待分析 |
| `analyzing` | 分析中 |
| `completed` | 分析完成 |
| `failed` | 分析失败（error_message 有值） |

---

### PUT /songs/:id

更新歌曲信息（仅允许修改标题）。

**请求体:**
```json
{
  "title": "新标题"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "新标题",
    "status": "completed",
    "updated_at": "2026-04-26T10:30:00Z"
  }
}
```

---

### DELETE /songs/:id

删除歌曲（含引用计数处理）。

**说明:**
- 仅 `completed` 状态的歌曲会释放 `storage_used` 配额
- 当音频文件引用计数归零时，自动清理 audio_file + analysis_result + Storage 文件

**响应:**
```json
{
  "success": true,
  "data": {
    "message": "歌曲已删除"
  }
}
```

---

### DELETE /songs/batch

批量删除歌曲。

**请求体:**
```json
{
  "song_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "message": "已删除 3 首歌曲",
    "deleted_count": 3
  }
}
```

---

### POST /songs/:id/retry

重新分析失败的歌曲。

**说明:**
- 仅 `status=failed` 的歌曲可重试
- 不重新上传，复用已有的 audio_file
- 不额外扣配额（上次失败已回滚 storage_used）

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "晴天",
    "status": "analyzing",
    "audio": {
      "url": "https://storage.../xxx.mp3",
      "duration": 269,
      "filename": "晴天.mp3",
      "file_size": 6283264
    },
    "analysis": null,
    "cached": false,
    "created_at": "2026-04-26T10:00:00Z"
  }
}
```

---

### GET /songs/:id/export/midi

导出 MIDI 文件（需要专业版或以上套餐）。

**说明:**
- 需要套餐 `features.midi_export` 为 `true`（专业版、工作室版支持）
- 歌曲必须处于 `completed` 状态
- 返回二进制 MIDI 文件，通过 `Content-Disposition` 头提供下载

**成功响应:**
- Content-Type: `audio/midi`
- Content-Disposition: `attachment; filename="<歌曲名>.mid"`
- Body: MIDI 二进制数据

**错误码:**

| 状态码 | code | 说明 |
|--------|------|------|
| 403 | `FEATURE_NOT_AVAILABLE` | 当前套餐不支持 MIDI 导出，请升级至专业版 |
| 404 | - | 歌曲不存在 |
| 400 | - | 歌曲尚未完成分析，无法导出 |

---

## 分析相关 (Analysis)

### GET /analysis/:songId/progress

获取分析进度。

**响应:**
```json
{
  "success": true,
  "data": {
    "song_id": "uuid",
    "status": "analyzing",
    "stage": "detecting",
    "label": "正在检测音符...",
    "percent": 55,
    "estimated_remaining_seconds": 128
  }
}
```

**进度阶段:**

| stage | label | percent |
|-------|-------|---------|
| `pending` | 等待开始... | 0% |
| `separating` | 正在分离音轨... | 26% |
| `detecting` | 正在检测音符... | 55% |
| `analyzing` | 正在分析和弦与节拍... | 80% |
| `finalizing` | 正在生成结果... | 95% |
| `completed` | 分析完成 | 100% |
| `failed` | 分析失败 | 0% |

---

### GET /analysis/quota/me

获取我的配额信息（含套餐等级和功能开关）。

**响应:**
```json
{
  "success": true,
  "data": {
    "storage_limit": 1,
    "storage_used": 0,
    "monthly_limit": 1,
    "monthly_used": 0,
    "max_duration": 180,
    "daily_limit": -1,
    "daily_used": 0,
    "features": {
      "midi_export": false,
      "api_access": false
    },
    "plan_level": "free",
    "plan_expires_at": null
  }
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| storage_limit | number | 存储上限（首） |
| storage_used | number | 已使用存储（首） |
| monthly_limit | number | 月分析次数上限，-1 为无限 |
| monthly_used | number | 本月已用分析次数 |
| max_duration | number | 单次音频时长上限（秒） |
| daily_limit | number | 每日分析上限，-1 为不限 |
| daily_used | number | 今日已用分析次数 |
| features | object | 功能开关，包含 midi_export 和 api_access |
| plan_level | string | 当前套餐等级: free / basic / pro / studio / custom |
| plan_expires_at | string \| null | 套餐到期时间，null 为永久 |

---

## 用户相关 (Users)

### GET /users/me

获取当前用户资料。

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "用户名",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "个人简介",
    "website_url": "https://example.com",
    "plan_level": "free",
    "plan_expires_at": null,
    "settings": {
      "theme": "auto",
      "language": "zh-CN"
    },
    "created_at": "2026-04-01T00:00:00Z"
  }
}
```

---

### PUT /users/me

更新当前用户资料。

**请求体:**
```json
{
  "username": "新用户名",
  "bio": "新个人简介",
  "website_url": "https://example.com",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "新用户名",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "bio": "新个人简介",
    "website_url": "https://example.com",
    "updated_at": "2026-04-26T10:00:00Z"
  }
}
```

---

### PUT /users/me/settings

更新用户设置（合并更新，只传需要修改的字段）。

**请求体:**
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

**响应:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "theme": "dark",
      "language": "zh-CN",
      "notifications": { "email": true, "push": false },
      "privacy": { "profile_visible": true, "activity_visible": false }
    }
  }
}
```

---

## 健康检查

### GET /health

健康检查（公开，无需认证）。

**响应:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-26T00:00:00.000Z",
    "app": "shiyin",
    "environment": "development"
  }
}
```

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 / 业务异常 (配额超限、音频过长等) |
| 401 | 未认证 (缺少或无效的 JWT Token) |
| 403 | 无权限 (操作他人资源 / 功能未开放) |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 业务错误码

以下错误码通过 400/403 状态码返回，`data` 字段包含详情：

| code | HTTP | 说明 | data 字段 |
|------|------|------|-----------|
| `QUOTA_EXCEEDED` | 400 | 存储配额已满 | `storage_used`, `storage_limit` |
| `MONTHLY_LIMIT_EXCEEDED` | 400 | 本月分析次数已用完 | `monthly_used`, `monthly_limit` |
| `DAILY_LIMIT_EXCEEDED` | 400 | 今日分析次数已达上限 | `daily_used`, `daily_limit` |
| `AUDIO_TOO_LONG` | 400 | 音频时长超过套餐上限且未选择截取 | `duration`, `max_duration` |
| `DURATION_EXCEEDED` | 400 | 音频时长超出套餐上限 | `duration`, `max_duration` |
| `FEATURE_NOT_AVAILABLE` | 403 | 当前套餐不支持该功能 | - |

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
| GET | `/api/songs/:id/export/midi` | 导出 MIDI 文件 | 需要 (专业版+) |
| GET | `/api/analysis/:songId/progress` | 获取分析进度 | 需要 |
| GET | `/api/analysis/quota/me` | 获取配额信息 | 需要 |
| GET | `/api/users/me` | 获取用户资料 | 需要 |
| PUT | `/api/users/me` | 更新用户资料 | 需要 |
| PUT | `/api/users/me/settings` | 更新用户设置 | 需要 |
| GET | `/api/health` | 健康检查 | 公开 |
