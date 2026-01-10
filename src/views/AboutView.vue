<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img src="/icon-192.png" alt="Logo" class="w-16 h-16 object-contain">
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('mainView.aboutView.title') }}</h1>
          <p class="text-lg text-gray-600">{{ $t('mainView.aboutView.description') }}</p>
        </div>

        <div class="prose prose-lg max-w-none">
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('mainView.aboutView.functionTitle') }}</h2>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.function1') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.function2') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.function3') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.function4') }}
                </li>
              </ul>
            </div>

            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('mainView.aboutView.techTitle') }}</h2>
              <ul class="space-y-3 text-gray-700">
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.tech1') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.tech2') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.tech3') }}
                </li>
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ $t('mainView.aboutView.tech4') }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('mainView.aboutView.instructionTitle') }}</h2>
            <div class="bg-gray-50 rounded-lg p-6">
              <p class="text-gray-700 mb-4 text-left">
                {{ $t('mainView.aboutView.instruction1') }}
              </p>
              <p class="text-gray-700 text-left">
                {{ $t('mainView.aboutView.instruction2') }}
              </p>
            </div>
          </div>

          <div class="mt-8 pt-8 border-t border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ $t('mainView.aboutView.contactTitle') }}</h2>
            <p class="text-gray-700">{{ $t('mainView.aboutView.contact') }} (kecsun@163.com)</p>
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
