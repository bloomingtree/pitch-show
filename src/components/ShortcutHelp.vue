<template>
  <div class="group fixed right-5 top-[-31rem] min-w-72 shadow-lg shadow-inner p-3 bg-white rounded-md h-[31rem] transition-all duration-300 z-10
    hover:top-0 hover:z-20">
      <div class="w-full h-full flex flex-col items-center">
        <h2 class="font-bold text-orange-400 text-xl">快捷键说明</h2>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&lt;</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">向左移动2秒</p>
        </div>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">&gt;</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">向右移动2秒</p>
        </div>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">B</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">回到开始位置</p>
        </div>
        <div class="flex justify-center items-center mt-2">
          <div class="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Spacebar</div>
          <p class="ml-2 text-sm text-gray-500 dark:text-gray-400">播放/暂停</p>
        </div>
        <div class="justify-center items-center mt-2">
          <image class="w-full h-60" src="/comeon.jpg" />
          <p class="ml-2 text-sm text-gray-600 dark:text-gray-400 font-bold">你的赞助，是我更新的动力！</p>
        </div>
      </div>
      <div class="absolute -bottom-16 left-1/3 h-16 w-1/3 group-hover:scale-y-0 group-hover:-bottom-8 transition-all delay-200">
        <div class="h-16 w-full bg-amber-200 transition w-16 rounded-b"></div>
      </div>
    </div>
</template>

<script>
export default {
  name: 'ShortcutHelp'
}
</script>