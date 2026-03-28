<template>
  <div>
    <!-- 文章导言 -->
    <p class="text-base">
      如果你的电脑有独立显卡，开启浏览器的 GPU 加速可以提升音频分离的处理速度。本文介绍如何在 Windows 系统中开启 Chrome 或 Edge 浏览器的 GPU 加速功能。
    </p>

    <!-- 什么是GPU加速 -->
    <h2>什么是 GPU 加速</h2>
    <p>
      GPU（图形处理器）在处理大量并行计算任务时效率比 CPU 更高。音频分离正是需要大量计算的任务，使用 GPU 可以获得更快的处理速度。
    </p>

    <div class="tip">
      <div class="tip-title">简单理解</div>
      <div class="tip-content">
        CPU 像一个能解各种题的教授，GPU 则像几千个只能做简单计算的小学生。对于大量重复的简单计算，人多力量大的 GPU 更有优势。
      </div>
    </div>

    <!-- 检查GPU -->
    <h2>检查电脑是否有 GPU</h2>

    <h3>方法一：任务管理器</h3>
    <ol>
      <li>按 <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Esc</kbd> 打开任务管理器</li>
      <li>点击"性能"标签页</li>
      <li>查看左侧是否有"GPU"选项</li>
    </ol>

    <img src="/help-GPU1.jpg" alt="任务管理器显示 GPU 信息" class="screenshot" />

    <h3>方法二：设备管理器</h3>
    <ol>
      <li>右键点击 Windows 开始按钮，选择"设备管理器"</li>
      <li>展开"显示适配器"</li>
      <li>查看是否有独立显卡（NVIDIA、AMD 等）</li>
    </ol>

    <img src="/help-GPU2.jpg" alt="设备管理器显示显卡信息" class="screenshot" />

    <div class="note">
      <div class="note-title">集成显卡</div>
      <div class="note-content">
        如果只看到 Intel UHD Graphics 等集成显卡，也可以开启 GPU 加速，但效果可能不如独立显卡明显。
      </div>
    </div>

    <!-- Chrome 浏览器设置 -->
    <h2>Chrome 浏览器设置</h2>

    <h3>开启 GPU 加速</h3>
    <ol>
      <li>打开 Chrome，在地址栏输入 <code>chrome://settings</code></li>
      <li>在左侧菜单点击"系统"</li>
      <li>开启"可用时使用图形加速"</li>
    </ol>

    <img src="/help-GPU3.jpg" alt="Chrome 设置页面" class="screenshot" />
    <img src="/help-GPU4.jpg" alt="Chrome GPU 加速开关" class="screenshot" />

    <h3>验证设置</h3>
    <ol>
      <li>完全关闭并重新打开 Chrome</li>
      <li>在地址栏输入 <code>chrome://gpu</code></li>
      <li>查看"GL_RENDERER"是否显示你的显卡型号</li>
    </ol>

    <img src="/help-GPU5.jpg" alt="Chrome GPU 信息页面" class="screenshot" />

    <!-- Edge 浏览器设置 -->
    <h2>Edge 浏览器设置</h2>

    <h3>开启 GPU 加速</h3>
    <ol>
      <li>打开 Edge，在地址栏输入 <code>edge://settings</code></li>
      <li>在左侧菜单点击"系统和性能"</li>
      <li>开启"在可用时使用图形加速"</li>
    </ol>

    <img src="/help-GPU6.jpg" alt="Edge 设置页面" class="screenshot" />
    <img src="/help-GPU7.jpg" alt="Edge GPU 加速开关" class="screenshot" />

    <h3>验证设置</h3>
    <ol>
      <li>完全关闭并重新打开 Edge</li>
      <li>在地址栏输入 <code>edge://gpu</code></li>
      <li>查看"GL_RENDERER"是否显示你的显卡型号</li>
    </ol>

    <img src="/help-GPU8.jpg" alt="Edge GPU 信息页面" class="screenshot" />

    <!-- 切换独立显卡 -->
    <h2>让浏览器使用独立显卡</h2>

    <p>
      如果电脑同时有集成显卡和独立显卡，Windows 默认可能让浏览器使用集成显卡来省电。以下是让浏览器使用独立显卡的方法。
    </p>

    <div class="tip">
      <div class="tip-title">如何判断当前使用的显卡</div>
      <div class="tip-content">
        在 <code>chrome://gpu</code> 页面查看 "GL_RENDERER"。如果显示 "Intel" 开头说明使用集成显卡，显示 "NVIDIA" 或 "AMD" 说明使用独立显卡。
      </div>
    </div>

    <h3>方法一：Windows 图形设置</h3>
    <ol>
      <li>点击 Windows 开始按钮，搜索"图形设置"</li>
      <li>点击"添加"，选择浏览器应用
        <ul>
          <li>Chrome: <code>C:\Program Files\Google\Chrome\Application\chrome.exe</code></li>
          <li>Edge: <code>C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe</code></li>
        </ul>
      </li>
      <li>点击添加的浏览器，选择"选项"</li>
      <li>选择"高性能"，点击"保存"</li>
    </ol>

    <img src="/help-GPU9.jpg" alt="Windows 图形设置" class="screenshot" />

    <h3>方法二：NVIDIA 控制面板</h3>
    <ol>
      <li>右键点击桌面，选择"NVIDIA 控制面板"</li>
      <li>展开"3D 设置"，点击"管理 3D 设置"</li>
      <li>点击"程序设置"标签页</li>
      <li>点击"添加"，选择浏览器</li>
      <li>在"为此程序选择首选图形处理器"中选择"高性能 NVIDIA 处理器"</li>
      <li>点击"应用"</li>
    </ol>

    <img src="/help-GPU10.jpg" alt="NVIDIA 控制面板" class="screenshot" />

    <div class="note">
      <div class="note-title">记得重启浏览器</div>
      <div class="note-content">
        设置后需要完全关闭浏览器再重新打开，然后在 <code>chrome://gpu</code> 确认 GL_RENDERER 显示的是独立显卡。
      </div>
    </div>

    <!-- 常见问题 -->
    <h2>常见问题</h2>

    <h3>如何确认 GPU 加速正在工作？</h3>
    <p>
      打开任务管理器，在"性能"标签页查看 GPU。开始音频分离任务时如果 GPU 使用率上升，说明 GPU 加速正在工作。
    </p>

    <h3>开启后还是只用 CPU 怎么办？</h3>
    <ol>
      <li>确保显卡驱动是最新版本</li>
      <li>按照上方步骤确保浏览器使用独立显卡</li>
      <li>在 <code>chrome://flags</code> 搜索"ANGLE"，尝试切换不同的图形后端</li>
    </ol>

    <h3>没有独立显卡能用吗？</h3>
    <p>
      可以。集成显卡开启 GPU 加速也能带来一定提升，只是效果不如独立显卡明显。
    </p>
  </div>
</template>

<script>
export default {
  name: 'GpuRenderingArticle'
}
</script>
