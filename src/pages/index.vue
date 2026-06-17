<script setup lang="ts">
import { defaultToolPath } from '~/config/tool-navigation'

const router = useRouter()

onMounted(() => {
  router.replace(defaultToolPath)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <el-empty description="正在进入工具台" />
  </div>
</template>
