<template>
    <div class="container">
      <header>

      </header>

      <main>
        <div class="flex flex-col md:flex-row gap-8 justify-between">
          <!-- 左侧内容 -->
          <div class="flex-1 md:pr-4">
            <div class="flex justify-center text-3xl md:text-5xl font-bold leading-normal text-[#D94E1F]">
              <h1>{{ $t('infoView.title') }}</h1>
            </div>
            <div class="mt-4 md:mt-8">
              <p>{{ $t('infoView.description') }}</p>
            </div>
            <div class="my-6 md:m-8 flex justify-center">
              <button
                @click="toMain"
                class="text-lg md:text-xl font-bold rounded-xl bg-[#D94E1F] text-white py-3 md:py-4 px-6 md:px-8 hover:bg-[#C4411A] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                {{ $t('infoView.button') }}
              </button>
            </div>
          </div>

          <!-- 右侧演示组件 -->
          <div class="w-full md:w-1/2 md:min-w-[400px] h-[250px] md:h-[300px] flex-shrink-0 md:ml-4">
            <PitchDemo />
          </div>
        </div>
        
        <!-- Basic-Pitch 介绍模块 - 水平居中 -->
      <section class="intro mx-auto text-center max-w-2xl">
        <h2 class="text-xl md:text-2xl text-[#D94E1F] font-bold">{{ $t('infoView.whatIsBasicPitch') }}</h2>
        <p class="text-left text-sm md:text-base indent-8">
          {{ $t('infoView.whatIsBasicPitchDescription') }}
        </p>
      </section>

        <!-- 示例歌曲体验模块 -->
        <section class="demo-song-section">
          <h2 class="text-xl md:text-2xl text-[#D94E1F] font-bold text-center">{{ $t('infoView.demoSongTitle') }}</h2>
          <div class="demo-song-card">
            <div class="demo-song-info">
              <h3 class="text-lg font-bold text-gray-800">{{ $t('infoView.demoSongName') }} <span class="text-sm font-normal text-gray-500">— {{ $t('infoView.demoSongArtist') }}</span></h3>
              <p class="text-sm text-gray-500 mt-1">{{ $t('infoView.demoSongDescription') }}</p>
              <button
                @click="tryDemoSong"
                class="mt-4 text-base font-bold rounded-lg bg-[#D94E1F] text-white py-2 px-6 hover:bg-[#C4411A] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105">
                {{ $t('infoView.demoSongButton') }}
              </button>
            </div>
            <div class="demo-song-preview">
              <div class="staff-preview">
                <svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">
                  <!-- 五线谱 -->
                  <g stroke="#c4a882" stroke-width="1">
                    <line x1="0" y1="20" x2="320" y2="20"/>
                    <line x1="0" y1="36" x2="320" y2="36"/>
                    <line x1="0" y1="52" x2="320" y2="52"/>
                    <line x1="0" y1="68" x2="320" y2="68"/>
                    <line x1="0" y1="84" x2="320" y2="84"/>
                  </g>
                  <!-- 高音谱号 -->
                  <text x="6" y="68" font-size="52" font-family="serif" fill="#5a3e2b" opacity="0.7">&#119070;</text>
                  <!-- 音符 -->
                  <g class="staff-notes">
                    <!-- 四分音符 -->
                    <ellipse cx="68" cy="52" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,68,52)"/>
                    <line x1="74" y1="52" x2="74" y2="26" stroke="#D94E1F" stroke-width="1.8"/>

                    <ellipse cx="88" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,88,44)"/>
                    <line x1="94" y1="44" x2="94" y2="18" stroke="#FF6B35" stroke-width="1.8"/>

                    <ellipse cx="108" cy="36" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,108,36)"/>
                    <line x1="114" y1="36" x2="114" y2="10" stroke="#D94E1F" stroke-width="1.8"/>

                    <ellipse cx="128" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,128,44)"/>
                    <line x1="134" y1="44" x2="134" y2="18" stroke="#FF6B35" stroke-width="1.8"/>

                    <!-- 二分音符 -->
                    <ellipse cx="152" cy="52" rx="7" ry="5.5" fill="none" stroke="#D94E1F" stroke-width="2" transform="rotate(-15,152,52)"/>
                    <line x1="158" y1="52" x2="158" y2="26" stroke="#D94E1F" stroke-width="1.8"/>

                    <ellipse cx="176" cy="60" rx="7" ry="5.5" fill="none" stroke="#FF6B35" stroke-width="2" transform="rotate(-15,176,60)"/>
                    <line x1="182" y1="60" x2="182" y2="34" stroke="#FF6B35" stroke-width="1.8"/>

                    <!-- 八分音符对 -->
                    <ellipse cx="200" cy="44" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,200,44)"/>
                    <line x1="206" y1="44" x2="206" y2="14" stroke="#D94E1F" stroke-width="1.8"/>
                    <ellipse cx="218" cy="36" rx="7" ry="5.5" fill="#D94E1F" transform="rotate(-15,218,36)"/>
                    <line x1="224" y1="36" x2="224" y2="10" stroke="#D94E1F" stroke-width="1.8"/>
                    <line x1="206" y1="14" x2="224" y2="10" stroke="#D94E1F" stroke-width="2.5"/>

                    <ellipse cx="240" cy="52" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,240,52)"/>
                    <line x1="246" y1="52" x2="246" y2="26" stroke="#FF6B35" stroke-width="1.8"/>
                    <ellipse cx="258" cy="44" rx="7" ry="5.5" fill="#FF6B35" transform="rotate(-15,258,44)"/>
                    <line x1="264" y1="44" x2="264" y2="18" stroke="#FF6B35" stroke-width="1.8"/>
                    <line x1="246" y1="26" x2="264" y2="18" stroke="#FF6B35" stroke-width="2.5"/>

                    <!-- 全音符 -->
                    <ellipse cx="288" cy="52" rx="8" ry="6" fill="none" stroke="#D94E1F" stroke-width="2.5" transform="rotate(-15,288,52)"/>
                  </g>
                  <!-- 底部小字 -->
                  <text x="160" y="108" text-anchor="middle" font-size="10" fill="#a0a0a0" font-family="sans-serif">♪ AI Note Analysis</text>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section class="features">
          <h2 class="text-xl md:text-2xl text-[#D94E1F] font-bold">{{ $t('infoView.ourAdvantages') }}</h2>
          <div class="flex flex-col md:flex-row gap-4 md:gap-0">
            <div>
              <div class="flex justify-center items-center mb-3">
                <svg t="1746543171920" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1169" width="15%"><path d="M427.46186 56.834c432.834-4.786 529.112 615.78 344.58 663.086-98.328 25.204-179.882-76.034-244.962-38.774-66.422 38.022-44.698 101.268-80.674 183.594-27.684 63.354-116.948 104.902-192.868 102.34-198.396-6.692-277.826-253.964-247.14-489.182C37.08586 242.678 194.93186 59.402 427.46186 56.834z m287.376 448.66c-33.034 0-59.81 26.774-59.81 59.806 0 33.034 26.776 59.81 59.81 59.81 33.032 0 59.806-26.776 59.806-59.81 0-33.03-26.776-59.806-59.806-59.806z" fill="#086E7D" p-id="1170"></path><path d="M213.13186 564.32c-8.242-3.12-21.614-28.202-46.85-22.288-15.374 3.602-13.12 30.172-18.168 40.27-7.954 15.908-39.086 12.104-48.77 38.392-9.68 26.286 34.242 25.252 35.628 47.384 1.382 22.13-32.162 57.41-1.386 77.124 30.78 19.714 43.232-41.85 64.674-43.922 21.444-2.076 25.246 48.07 70.9 34.24 45.656-13.834-24.896-67.446-25.938-95.804-1.04-28.358 41.158-16.946 42.886-51.878s-52.786-15.88-72.976-23.518zM219.55986 281.592c-14.02 10.808-44.66 11.564-57.024 33.892-12.358 22.332 23.53 36.688 24.324 58.216 0.796 21.532-44.658 70.974 4.784 85.33s80.548-16.748 63.402-54.228c-17.146-37.482 33.494-68.984 55.822-32.298 22.332 36.688 57.022 14.352 55.824-25.52s-49.846-19.934-55.426-52.63c-5.582-32.696-1.998-57.024-37.084-63.798-35.086-6.78-34.574 35.576-54.622 51.036zM495.09986 169.942c-32.594 13.066-11.964 34.686-20.338 64.594-8.372 29.91-39.076 27.512-30.7 61.806 8.372 34.296 45.06-3.588 65.792-1.992 20.736 1.594 21.134 34.686 43.064 32.296 21.928-2.392 3.588-38.676 34.69-44.658s40.676 31.9 69.38 15.154c28.708-16.746-19.138-33.894-25.52-64.598-6.38-30.702-6.376-43.058-25.12-56.218-18.74-13.162-37.084 9.566-61.006 10.764-23.924 1.194-27.024-26.452-50.242-17.148zM963.49386 20.188h7.016c4.826 0 9.214 2.1 12.474 5.342a18.4 18.4 0 0 1 5.458 12.678c1.624 74.962 3.53 162.208 5.76 265 2.672 122.972 5.92 272.658 9.964 458.706 0.324 14.914-2.884 29.04-8.432 39.232-5.568 10.22-13.486 16.51-22.26 16.51h-12.758c-8.778 0-16.702-6.29-22.266-16.51-5.552-10.192-8.744-24.318-8.424-39.232 3.998-186.048 7.218-335.734 9.858-458.706l5.7-265a18.344 18.344 0 0 1 5.442-12.678c3.256-3.242 7.648-5.342 12.468-5.342z" fill="#FFC900" p-id="1171"></path><path d="M929.08386 1003.812C995.79586 995.686 1024.00786 962.666 1024.00786 900.396c0-45.054-27.004-81.916-60.62-82.74-23.862-0.59-51.258 17.886-53.11 54.214-3.252 63.944 85.29 73.442 18.806 131.942z" fill="#086E7D" p-id="1172"></path><path d="M54.02586 519.96c-1.286 9.876-10.344 16.838-20.218 15.552s-16.84-10.344-15.552-20.218c16.51-126.548 68.378-238.874 148.106-318.598 75.784-75.786 176.572-122.13 295.992-123.448 9.958-0.076 18.096 7.932 18.17 17.888s-7.932 18.094-17.888 18.168c-109.15 1.204-201.322 43.618-270.682 112.982-74.152 74.15-122.46 179.104-137.928 297.674z" fill="#279EB0" p-id="1173"></path></svg>
                <div class="text-lg md:text-xl text-[#C4411A] font-bold ml-2">{{ $t('infoView.advantage1') }}</div>
              </div>
              <div class="text-xs md:text-sm text-gray-500">{{ $t('infoView.advantage1Description') }}</div>
            </div>
            <div>
              <div class="flex justify-center items-center mb-3">
                <svg t="1746543562376" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1330" width="15%"><path d="M92.158 0h839.686c19.31 0 35.108 15.798 35.108 35.108v953.784c0 19.31-15.798 35.106-35.108 35.106H92.158c-19.31 0-35.108-15.798-35.108-35.106V35.108C57.048 15.798 72.846 0 92.158 0z" fill="#086E7D" p-id="1331"></path><path d="M172.612 392.032h89.24c12.874 0 23.404 10.53 23.404 23.404v89.242c0 12.874-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.242c0-12.874 10.53-23.404 23.404-23.404z" fill="#FFC900" p-id="1332"></path><path d="M172.612 593.914h89.24c12.874 0 23.404 10.53 23.404 23.404v89.24c0 12.874-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404z" fill="#D9AA00" p-id="1333"></path><path d="M172.612 795.79h89.24c12.874 0 23.404 10.53 23.404 23.404v89.24c0 12.876-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404z" fill="#FFC900" p-id="1334"></path><path d="M369.12 392.032h89.244c12.87 0 23.4 10.53 23.4 23.404v89.242c0 12.874-10.53 23.404-23.4 23.404H369.12c-12.876 0-23.404-10.53-23.404-23.404v-89.242c0-12.874 10.53-23.404 23.404-23.404z" fill="#D9AA00" p-id="1335"></path><path d="M565.636 392.032h89.24c12.876 0 23.404 10.53 23.404 23.404v89.242c0 12.874-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.242c0-12.874 10.53-23.404 23.404-23.404zM762.146 392.032h89.24c12.874 0 23.404 10.532 23.404 23.404v291.126c0 12.868-10.53 23.402-23.404 23.402h-89.24c-12.876 0-23.404-10.532-23.404-23.402V415.436c-0.002-12.87 10.528-23.404 23.404-23.404z" fill="#FFC900" p-id="1336"></path><path d="M762.146 795.79h89.24c12.874 0 23.404 10.53 23.404 23.404v89.24c0 12.876-10.53 23.404-23.404 23.404h-89.24c-12.876 0-23.404-10.53-23.404-23.404v-89.24c-0.002-12.874 10.528-23.404 23.404-23.404z" fill="#D9AA00" p-id="1337"></path><path d="M369.12 593.914h89.244c12.87 0 23.4 10.53 23.4 23.404v89.24c0 12.874-10.53 23.404-23.4 23.404H369.12c-12.876 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404z" fill="#FFC900" p-id="1338"></path><path d="M565.636 593.914h89.24c12.876 0 23.404 10.53 23.404 23.404v89.24c0 12.874-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404zM369.12 795.79h89.244c12.87 0 23.4 10.53 23.4 23.404v89.24c0 12.876-10.53 23.404-23.4 23.404H369.12c-12.876 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404z" fill="#D9AA00" p-id="1339"></path><path d="M565.636 795.79h89.24c12.876 0 23.404 10.53 23.404 23.404v89.24c0 12.876-10.53 23.404-23.404 23.404h-89.24c-12.874 0-23.404-10.53-23.404-23.404v-89.24c0-12.874 10.53-23.404 23.404-23.404z" fill="#FFC900" p-id="1340"></path><path d="M204.2 121.23h646.5c13.25 0 24.086 10.84 24.086 24.084v153.896c0 13.244-10.836 24.084-24.086 24.084H204.2c-13.25 0-24.086-10.84-24.086-24.084V145.314c-0.002-13.244 10.836-24.084 24.086-24.084z" fill="#FFFFFF" p-id="1341"></path><path d="M122.984 488.97c0 9.976-8.092 18.068-18.068 18.068s-18.068-8.092-18.068-18.068V85.282c0-13.54 5.564-25.9 14.524-34.89l0.068-0.068c8.99-8.958 21.348-14.524 34.89-14.524h220.022c9.976 0 18.068 8.092 18.068 18.066a18.072 18.072 0 0 1-18.068 18.068H136.328a13.254 13.254 0 0 0-9.412 3.866l-0.068 0.068a13.264 13.264 0 0 0-3.864 9.412z" fill="#279EB0" p-id="1342"></path></svg>
                <div class="text-lg md:text-xl text-[#C4411A] font-bold ml-2">{{ $t('infoView.advantage2') }}</div>
              </div>
              <div class="text-xs md:text-sm text-gray-500">{{ $t('infoView.advantage2Description') }}</div>
            </div>
            <div>
              <div class="flex justify-center items-center mb-3">
                <svg t="1746543761929" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1497" width="15%"><path d="M486.83 175.42c0-32.2 5.172-63.25 14.728-92.342C511.428 53.024 526.044 25.034 544.512 0l19.142 14.1a271.11 271.11 0 0 0-39.412 76.358c-8.766 26.686-13.508 55.246-13.508 84.962z" fill="#0A5561" p-id="1498"></path><path d="M343.784 117.516c52.96-20.778 109.592-12.962 158.01 16.404 48.414-29.366 105.046-37.182 158.008-16.404 104.284 40.908 154.82 177.134 112.872 304.27-39.178 118.74-156.766 203.478-270.88 153.566-114.112 49.91-231.7-34.828-270.882-153.566-41.946-127.134 8.588-263.36 112.872-304.27z" fill="#086E7D" p-id="1499"></path><path d="M205.022 589.816h702.09c-59.702 0-108.546 48.844-108.546 108.544v0.004c0 59.702 48.844 108.546 108.546 108.546H205.022c-59.702 0-108.546-48.844-108.546-108.546v-0.004c0-59.698 48.844-108.544 108.546-108.544z" fill="#FFC900" p-id="1500"></path><path d="M827.476 624.808c-17.92 19.376-28.91 45.242-28.91 73.552v0.004c0 28.312 10.99 54.176 28.91 73.556H205.022c-40.388 0-73.556-33.168-73.556-73.556s33.164-73.556 73.556-73.556z" fill="#E6E6E6" p-id="1501"></path><path d="M818.978 1024H116.888l25.38-34.99V841.9l-25.38-34.99H818.98c59.702 0 108.546 48.844 108.546 108.542v0.004C927.524 975.156 878.68 1024 818.978 1024z" fill="#086E7D" p-id="1502"></path><path d="M142.264 841.9l0.004 147.11H818.98c40.39 0 73.556-33.168 73.556-73.558 0-40.384-33.168-73.552-73.556-73.552z" fill="#E6E6E6" p-id="1503"></path><path d="M291.806 404.212a17.92 17.92 0 0 1-34.036 11.208c-18.888-57.246-16.916-116.656 1.548-166.424 18.826-50.762 54.836-91.722 103.544-110.83 9.202-3.594 19.582 0.952 23.176 10.154 3.594 9.2-0.952 19.582-10.154 23.176-38.68 15.176-67.554 48.448-82.954 89.966-15.766 42.512-17.386 93.46-1.124 142.75z" fill="#279EB0" p-id="1504"></path></svg>
                <div class="text-lg md:text-xl text-[#C4411A] font-bold ml-2">{{ $t('infoView.advantage3') }}</div>
              </div>
              <div class="text-xs md:text-sm text-gray-500">{{ $t('infoView.advantage3Description') }}</div>
            </div>
          </div>
        </section>
  
        <section>
            <h2 class="text-xl md:text-2xl text-[#D94E1F] font-bold">{{ $t('infoView.useNow') }}</h2>
            <p class="text-sm md:text-base">{{ $t('infoView.useNowDescription') }}</p>
        </section>
      </main>

      <footer>
        <p>&copy; kecsun@163.com . {{ $t('infoView.copyright') }}</p>
      </footer>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import PitchDemo from '@/components/PitchDemo.vue'

  const router = useRouter()

  const toMain = () => {
    router.push('/main')
  }

  const tryDemoSong = () => {
    sessionStorage.setItem('pendingDemoSong', 'true')
    router.push('/main')
  }
  </script>
  
  <style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    color: #333;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 40px;
  }

  header h1 {
    font-size: 2.5rem;
    color: #D94E1F;
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
    color: #D94E1F;
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
    border-top: 1px solid #ffd9c4;
    color: #888;
  }

  /* 示例歌曲模块 */
  .demo-song-section {
    margin-bottom: 40px;
  }

  .demo-song-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    background: linear-gradient(135deg, #fff7f0 0%, #fff 100%);
    border: 1px solid #ffd9c4;
    border-radius: 16px;
    padding: 24px;
    margin-top: 16px;
  }

  @media (min-width: 768px) {
    .demo-song-card {
      flex-direction: row;
    }
    .demo-song-info {
      flex: 1;
    }
  }

  .demo-song-info {
    text-align: left;
  }

  .demo-song-preview {
    width: 100%;
    max-width: 280px;
    flex-shrink: 0;
  }

  .note-preview {
    position: relative;
    width: 100%;
    height: 140px;
    background: #1a1a2e;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .staff-preview {
    width: 100%;
    background: linear-gradient(135deg, #fefcf8 0%, #f8f0e3 100%);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(90, 62, 43, 0.12);
    border: 1px solid #e8d5be;
  }

  .staff-preview svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .staff-notes {
    animation: notesFadeIn 1s ease forwards;
    opacity: 0;
  }

  @keyframes notesFadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  </style>