<script setup lang="ts">
defineProps<{ loading: boolean; error?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="loading" class="flex min-h-[320px] items-center justify-center"><span class="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-primary"></span></div>
  <div v-else-if="error" class="mx-auto my-16 max-w-xl rounded-xl border border-error/35 bg-error-container/15 p-6 text-center"><p class="text-sm text-on-error-container">{{ error }}</p><button class="mt-4 rounded bg-primary-container px-4 py-2 text-sm font-bold text-on-primary-container" type="button" @click="$emit('retry')">重新加载</button></div>
  <slot v-else />
</template>
