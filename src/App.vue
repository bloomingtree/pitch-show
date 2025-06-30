<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { Notivue, Notification } from 'notivue'
</script>

<template>
  <Notivue v-slot="item">
    <Notification :item="item" />
  </Notivue>
  <RouterView/>
</template>
