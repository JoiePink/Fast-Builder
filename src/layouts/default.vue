<script setup lang="ts">
import { computed } from 'vue'
import { toolNavigation } from '~/config/tool-navigation'

const route = useRoute()

const groupedNavigation = computed(() => {
  return toolNavigation.reduce<Record<string, typeof toolNavigation>>((groups, item) => {
    if (!groups[item.group])
      groups[item.group] = []
    groups[item.group].push(item)
    return groups
  }, {})
})
</script>

<template>
  <main class="min-h-screen bg-#f5f7fb text-slate-800">
    <div class="min-h-screen md:flex">
      <aside class="border-r border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div class="border-b border-slate-200 px-5 py-5">
          <div class="text-xs text-teal-700 font-bold uppercase">
            Fast-Builder
          </div>
          <div class="mt-1 text-lg text-slate-950 font-800">
            Vibe Coding 工具台
          </div>
        </div>

        <nav class="px-3 py-4">
          <div v-for="(items, group) in groupedNavigation" :key="group" class="mb-5 last:mb-0">
            <div class="px-3 pb-2 text-xs text-slate-400 font-bold">
              {{ group }}
            </div>
            <el-menu
              :default-active="route.path"
              router
              class="tool-menu border-0"
            >
              <el-menu-item
                v-for="item in items"
                :key="item.path"
                :index="item.path"
              >
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                <el-tag v-if="item.comingSoon" size="small" effect="plain">
                  Soon
                </el-tag>
              </el-menu-item>
            </el-menu>
          </div>
        </nav>
      </aside>

      <section class="min-w-0 flex-1">
        <RouterView />
      </section>
    </div>
  </main>
</template>

<style scoped>
.tool-menu {
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: #f0fdfa;
  --el-menu-active-color: #0f766e;
}

.tool-menu :deep(.el-menu-item) {
  height: 40px;
  margin-bottom: 4px;
  border-radius: 6px;
  padding: 0 12px !important;
}

.tool-menu :deep(.el-menu-item.is-active) {
  background: #ccfbf1;
  font-weight: 700;
}
</style>
