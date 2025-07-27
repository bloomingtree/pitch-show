<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-r from-amber-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">关于识音</h1>
          <p class="text-lg text-gray-600">AI扒谱神器 - 免费音频音高分析工具</p>
        </div>

        <div class="prose prose-lg max-w-none">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">功能介绍</h2>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  音高分析：精确检测音频中的音符和音高
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  音频分离：AI分离人声、鼓、低音等音轨
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  本地处理：保护隐私，无需上传到云端
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  免费使用：完全免费，无任何收费项目
                </li>
              </ul>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">技术特点</h2>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  基于Spotify Basic-Pitch技术
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  使用Demucs进行音频分离
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  支持多种音频格式
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  高精度音符识别
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">使用说明</h2>
            <div class="bg-gray-50 rounded-lg p-6">
              <p class="text-gray-700 mb-4">
                识音是一款专业的音频分析工具，采用先进的AI技术，为用户提供精准的音高分析和音频分离服务。
                所有处理都在本地完成，确保您的音频文件隐私安全。
              </p>
              <p class="text-gray-700">
                支持MP3、WAV等常见音频格式，操作简单，结果准确。无论是音乐学习、创作还是分析，识音都能为您提供专业的帮助。
              </p>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">联系我们</h2>
            <p class="text-gray-700">
              如果您在使用过程中遇到任何问题，或有任何建议和反馈，欢迎联系我们。(kecsun@163.com)
              我们会持续改进产品，为用户提供更好的服务体验。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  color: inherit;
}
</style>
