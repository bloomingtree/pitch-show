<template>
  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" :class="className" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M2.25 13.5a3.5 3.5 0 0 1 3.5-3.5h2a3.5 3.5 0 0 1 3.5 3.5v.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-.5Zm7-7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm5.55-1.61a.75.75 0 0 0-1.2.96l2.17 2.72a.75.75 0 0 0 1.15.06l1.08-1.08a.75.75 0 1 0-1.06-1.06l-.5.5-1.64-2.1Zm2.45 4.11a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clip-rule="evenodd"/>
  </svg>
</template>

<script>
export default {
  name: 'ConfidenceIcon',
  props: {
    className: {
      type: String,
      default: ''
    }
  }
}
</script>
