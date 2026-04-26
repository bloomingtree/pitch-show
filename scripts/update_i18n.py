import json

# Read existing zh.json
with open('e:/jsProject/pitch-project/pitch-show/src/i18n/langs/zh.json', 'r', encoding='utf-8') as f:
    zh = json.load(f)

# Add new keys to zh
zh["pricing"] = {
    "title": "选择适合你的方案",
    "subtitle": "从免费版到工作室版，按需选择分析能力",
    "back": "返回",
    "yearly": "年付",
    "monthly": "月付",
    "saveYearly": "省约10%",
    "recommended": "推荐",
    "compareTitle": "功能对比",
    "compareFeature": "功能",
    "scanQr": "扫码添加微信开通",
    "scanQrDesc": "添加管理员微信，完成付款后即可立即开通对应套餐权限",
    "qrCode": "微信二维码",
    "plans": {
        "free": { "label": "免费版", "price": "¥0", "pricePeriod": "/永久" },
        "basic": { "label": "基础版", "price": "¥68", "pricePeriod": "/年", "annualNote": "≈ ¥5.7/月", "priceMonthly": "¥9.9", "pricePeriodMonthly": "/月" },
        "pro": { "label": "专业版", "price": "¥128", "pricePeriod": "/年", "annualNote": "≈ ¥10.7/月", "priceMonthly": "¥19.9", "pricePeriodMonthly": "/月" },
        "studio": { "label": "工作室版", "price": "¥299", "pricePeriod": "/年", "annualNote": "≈ ¥24.9/月", "annualOnly": "仅提供年付" }
    },
    "features": {
        "free": [
            "<strong>1 首</strong>歌存储",
            "每月 <strong>1 次</strong> Pro 分析",
            "本地 AI 音符检测",
            "最长 <strong>3 分钟</strong>音频"
        ],
        "basic": [
            "<strong>15 首</strong>歌存储",
            "每月 <strong>15 次</strong> Pro 分析",
            "AI 四轨分离 + 和弦 + 节拍",
            "最长 <strong>7 分钟</strong>音频"
        ],
        "pro": [
            "<strong>50 首</strong>歌存储",
            "每月 <strong>50 次</strong> Pro 分析",
            "AI 四轨分离 + 和弦 + 节拍",
            "最长 <strong>15 分钟</strong>音频",
            "<strong>MIDI 导出</strong>"
        ],
        "studio": [
            "<strong>200 首</strong>歌存储",
            "<strong>无限次</strong> Pro 分析",
            "每日上限 100 次",
            "最长 <strong>30 分钟</strong>音频",
            "MIDI 导出 + <strong>API 调用</strong>"
        ]
    },
    "compare": {
        "monthlyAnalysis": "月分析次数",
        "storageLimit": "存储上限",
        "durationLimit": "单次时长上限",
        "dailyLimit": "每日上限",
        "localAI": "本地 AI 检测",
        "trackSeparation": "四轨分离",
        "chordBeat": "和弦 + 节拍",
        "midiExport": "MIDI 导出",
        "apiAccess": "API 调用",
        "unlimited": "无限",
        "freeStorage": "1 首",
        "basicStorage": "15 首",
        "proStorage": "50 首",
        "studioStorage": "200 首",
        "freeDuration": "3 分钟",
        "basicDuration": "7 分钟",
        "proDuration": "15 分钟",
        "studioDuration": "30 分钟",
        "studioDaily": "100 次"
    }
}

zh["profileView"] = {
    "back": "返回",
    "edit": "编辑",
    "username": "用户名",
    "usernamePlaceholder": "请输入用户名",
    "usernameEmpty": "未设置用户名",
    "avatarUrl": "头像 URL",
    "avatarUrlPlaceholder": "请输入头像图片链接",
    "save": "保存",
    "saving": "保存中...",
    "cancel": "取消",
    "currentPlan": "当前套餐",
    "planLevel": "套餐等级",
    "expiresAt": "到期时间",
    "expired": "已过期",
    "changePlan": "变更套餐 →",
    "dataOverview": "数据概览",
    "loading": "加载中...",
    "totalSongs": "总歌曲",
    "cloudProjects": "云端项目",
    "usedThisMonth": "本月已用",
    "cloudStorage": "云端存储",
    "unitSong": "首",
    "monthlyQuota": "本月配额",
    "unitTimes": "次",
    "dailyQuota": "今日配额",
    "durationLimit": "单次时长上限",
    "upgradeHint": "升级套餐获取更多存储和分析次数 →",
    "mySongs": "我的歌曲",
    "noSongsLocal": "暂无本地歌曲",
    "noSongsCloud": "暂无云端歌曲",
    "sourceLocal": "本地",
    "sourceCloud": "云端",
    "open": "打开",
    "delete": "删除",
    "account": "账户",
    "logout": "退出登录",
    "deleteAccount": "删除账户",
    "deleteConfirmTitle": "确认删除账户？",
    "deleteConfirmWarning": "此操作不可逆，您的所有数据将被永久删除。",
    "confirmDelete": "确认删除",
    "tabAll": "全部",
    "tabLocal": "本地",
    "tabCloud": "云端",
    "untitledSong": "未命名歌曲",
    "saveSuccess": "保存成功",
    "saveFailed": "保存失败",
    "deleteSuccess": "删除成功",
    "deleteFailed": "删除失败",
    "unlimited": "无限",
    "freePlan": "免费版"
}

zh["loginDialog"] = {
    "title": "登录以使用专业版",
    "subtitle": "无需密码，6 位验证码即可登录 / 注册",
    "emailLabel": "邮箱",
    "emailPlaceholder": "请输入邮箱地址",
    "otpLabel": "验证码",
    "loginRegister": "登录 / 注册",
    "verifying": "验证中...",
    "sending": "发送中...",
    "sendOTP": "发送验证码",
    "sentSuccess": "已发送",
    "sendFailed": "发送失败，请稍后重试",
    "verifyFailed": "验证失败，请重试",
    "close": "关闭"
}

zh["analysisMode"] = {
    "title": "选择分析模式",
    "free": "免费",
    "basicLabel": "普通版",
    "basicDesc": "浏览器内音符检测，速度快，精度一般",
    "basicFeatures": [
        "本地 AI 音符检测",
        "动态/平稳音符双色显示",
        "无需登录"
    ],
    "basicStart": "开始",
    "proLabel": "专业版",
    "proDesc": "后端 AI 分析，高精度多轨分离",
    "proFeatures": [
        "AI 音轨分离（人声/贝斯/鼓/伴奏）",
        "四色音符显示",
        "和弦 + 节拍检测",
        "鼓件分类"
    ],
    "proStart": "开始分析",
    "proQuotaExhausted": "本月额度已用完，升级 Pro 可无限使用",
    "freePlan": "免费版",
    "freeQuotaMonthly": "免费 1次/月",
    "freeQuotaMonthlyLimit": "免费 {limit}次/月"
}

zh["proProgress"] = {
    "title": "专业版 AI 分析中",
    "estimatedRemaining": "预计剩余: 约 {time}",
    "seconds": "{n} 秒",
    "minutes": "{min} 分 {sec} 秒",
    "runInBackground": "后台运行",
    "cancelAnalysis": "取消分析",
    "completed": "分析完成！",
    "failed": "分析失败，请重试",
    "close": "关闭",
    "separating": "正在分离音轨...",
    "uploadingAudio": "正在上传音频..."
}

zh["quotaExhausted"] = {
    "title": "额度已用完",
    "dailyExhausted": "今日分析次数已达上限（{limit}次）。",
    "dailyUpgrade": "升级套餐即可获取更多每日分析次数。",
    "monthlyExhausted": "本月分析次数已用完（{limit}次）。",
    "monthlyUpgrade": "升级套餐即可享受更多分析次数和存储空间。",
    "dailyUsed": "今日已用 {used} 次",
    "monthlyUsed": "本月已用 {used} 次",
    "gotIt": "知道了",
    "upgrade": "前往升级",
    "unlimited": "无限"
}

zh["settings"] = {
    "title": "设置",
    "close": "关闭设置",
    "show": "显示",
    "pro": "专业版",
    "trackDisplay": "音轨显示",
    "account": "账号",
    "accountInfo": "账号信息",
    "appearance": "外观设置",
    "appearanceDesc": "选择音符的配色方案。动态音符是指有颤音或揉弦等技巧的音符。",
    "totalNotes": "总音符数",
    "techniqueNotes": "技巧音符",
    "techniqueNotesCount": "技巧音符数",
    "filterSettings": "过滤设置",
    "filterDesc": "隐藏不需要的音符，让谱面更清晰。",
    "autoMerge": "自动连接断音",
    "autoMergeDesc": "把同一音高的断续音连接成一条长音符",
    "mergeGap": "连接间隔",
    "seconds": "秒",
    "mergeGapDesc": "两个音之间最多隔多久还能连起来",
    "minDuration": "最短显示时长",
    "minDurationDesc": "隐藏短于 {n} 秒的音符（通常是杂音）",
    "resetDefault": "恢复默认",
    "trackDisplayDesc": "切换各音轨的显示状态，专业版分析支持四轨独立显示。",
    "selectAll": "全选",
    "deselectAll": "全不选",
    "freePlan": "免费版",
    "profile": "个人中心",
    "logout": "退出登录",
    "loginPrompt": "登录后可使用专业版分析功能，云端存储分析结果。",
    "login": "登录",
    "tracks": {
        "vocals": { "name": "人声", "desc": "主旋律声部" },
        "bass": { "name": "贝斯", "desc": "低音声部" },
        "drums": { "name": "鼓", "desc": "打击乐声部" },
        "other": { "name": "伴奏", "desc": "其他乐器" }
    },
    "themes": {
        "classic": { "name": "经典", "desc": "原始配色，清新自然" },
        "ocean": { "name": "海洋", "desc": "蓝灰配色，清爽干净" },
        "sunset": { "name": "落日", "desc": "橙粉配色，温暖活力" },
        "forest": { "name": "森林", "desc": "绿紫配色，自然神秘" }
    },
    "tabs": {
        "appearance": "外观设置",
        "filter": "过滤设置",
        "tracks": "音轨显示",
        "account": "账号信息"
    }
}

zh["songPitch"] = {
    "analysisComplete": "分析完成",
    "viewResult": "查看",
    "analysisCompleteBanner": "\"{title}\" 分析完成",
    "localTab": "本地",
    "cloudTab": "云端",
    "noLocalSongs": "暂无本地歌曲",
    "noCloudSongs": "暂无云端项目",
    "loginToViewCloud": "登录后查看云端项目",
    "login": "登录",
    "loading": "加载中...",
    "untitled": "未命名",
    "noteInfoDev": "音符信息 (Dev)",
    "startTime": "起始时间:",
    "duration": "持续时间:",
    "volume": "音量:",
    "type": "类型:",
    "dynamic": "动态",
    "steady": "平稳",
    "bendAmount": "弯音数:",
    "bendArray": "弯音数组:",
    "bendEnd": "弯音终值:",
    "loadCloudProject": "加载云端项目",
    "downloadingData": "正在下载分析数据和音频...",
    "analyzingAudio": "正在分析音频",
    "processingNotes": "正在处理音符",
    "aiDetecting": "AI 正在识别音符，请稍候...",
    "organizingNotes": "正在整理和优化音符数据...",
    "separatingTracks": "正在分离音轨...",
    "uploadingAudio": "正在上传音频...",
    "analysisFailed": "分析失败",
    "analysisError": "音高分析过程中发生错误",
    "analysisCancelled": "分析已取消",
    "emptyResult": "分析结果为空",
    "loadResultFailed": "加载结果失败",
    "statusAnalyzing": "分析中",
    "statusCompleted": "已完成",
    "statusFailed": "失败",
    "statusPending": "等待中",
    "loadFailed": "加载失败",
    "proAnalysisDefault": "专业版分析",
    "movedToBackground": "分析已转至后台运行",
    "willNotifyOnComplete": "完成后会通知您",
    "analysisFailedFor": "\"{title}\" 分析失败",
    "checkTopRightBanner": "点击右上角横幅查看结果"
}

with open('e:/jsProject/pitch-project/pitch-show/src/i18n/langs/zh.json', 'w', encoding='utf-8') as f:
    json.dump(zh, f, ensure_ascii=False, indent=2)

print("zh.json updated successfully")
print("New top-level keys:", list(zh.keys()))
