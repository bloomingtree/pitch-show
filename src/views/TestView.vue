<template>
    <div>
        <button @click="buttonCLicked">踩你</button>
    </div>
</template>
<script setup>
import { onBeforeMount, onMounted } from 'vue';

let pyodide;

//第一步：load pyodide.js
onBeforeMount(() => {
  // 加载pyodide.js
  const script = document.createElement('script');
  script.src = '/pyodide/pyodide.js';
  document.body.appendChild(script);
})
// 第二步：load自己写的python wheel
async function installPyWheel() {
    console.log('bbbbbbbbbb')
  pyodide = await loadPyodide();
  console.log('aaaaaaaa')
  console.log(pyodide)
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install('/pyodide/hellotools-0.0.1-py3-none-any.whl');
}

function clickFileBtn(){
  console.log(pyodide);
  if(pyodide == undefined)
  {
    installPyWheel(); //载入python wheel,只需要在页面加载时install一次
  }
}

// 第三步：使用python wheel中的方法
function buttonCLicked(){
    clickFileBtn()
  const main = pyodide.pyimport("main"); //"main"为python程序中的文件名
  console.log(main);
  console.log(main.hello());
}
</script>