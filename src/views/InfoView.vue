<template>
    <div class="container">
      <header>
        <h1>Basic-Pitch 音频分析工具</h1>
        <p>上传音频，轻松获取音符信息！</p>
        <p>音乐爱好者扒谱神器</p>
      </header>
  
      <main>
        <section class="intro">
          <h2>什么是 Basic-Pitch？</h2>
          <p>
            Basic-Pitch 是一款由 Spotify 开源的轻量级音频转 MIDI 工具，采用先进的机器学习算法，能够高效准确地识别音频中的音符信息（音高、长度）。
          </p>
        </section>
        <div class="mb-16">
            <router-link to="/home">
                <span class="text-xl border-2 rounded-lg bg-blue-500 text-white p-4">立即使用</span>
            </router-link>
        </div>
        <section class="features">
          <h2>我们的优势</h2>
          <ul>
            <li>操作简单：上传音频即可快速获取音符信息。</li>
            <li>精准识别：准确识别旋律、和声等音符信息。</li>
            <li>完全免费：无需注册，无需付费。</li>
          </ul>
        </section>
  
        <section class="flex flex-col">
            <div><h2>立即体验</h2></div>
            <div><p>上传您的音频文件，开始您的音乐创作之旅！</p></div>
        </section>
  
        <section class="use-cases">
          <h2>应用场景</h2>
          <ul>
            <li>音乐创作：快速获取灵感，将哼唱的旋律转化为音符。</li>
            <li>音乐学习：辅助乐器学习，掌握音乐理论知识。</li>
            <li>音频编辑：为音频文件添加 MIDI 信息，方便后续编辑。</li>
          </ul>
        </section>
      </main>
  
      <footer>
        <p>&copy; 2023 [你的网站名称]. 版权所有.</p>
      </footer>
    </div>
  </template>
  
  <script setup>
  </script>
  
  <style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f9f9f9;
    color: #333;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  header h1 {
    font-size: 2.5rem;
    color: #007bff;
  }
  
  header p {
    font-size: 1.2rem;
    color: #666;
  }
  
  section {
    margin-bottom: 40px;
  }
  
  h2 {
    font-size: 1.8rem;
    color: #007bff;
    margin-bottom: 10px;
  }
  
  ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  
  footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ccc;
    color: #666;
  }
  </style>