<script setup lang="ts">
import { computed } from 'vue'
import { toolNavigation } from '~/config/tool-navigation'

const route = useRoute()

const navigationGroups = computed(() => {
  const groups = toolNavigation.reduce<Record<string, typeof toolNavigation>>((grouped, item) => {
    if (!grouped[item.group])
      grouped[item.group] = []
    grouped[item.group].push(item)
    return grouped
  }, {})

  return Object.entries(groups).map(([label, items]) => ({
    label,
    items,
  }))
})

const defaultOpeneds = computed(() => navigationGroups.value.map(group => group.label))
</script>

<template>
  <main class="min-h-screen bg-#f5f7fb text-slate-800">
    <div class="min-h-screen md:flex">
      <aside class="border-r border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <div class="border-b border-slate-200 px-5 py-5">
          <div class="text-xs text-teal-700 font-bold uppercase">
            Vibe Coding
          </div>
          <div class="mt-1 text-lg text-slate-950 font-800">
            Vibe Coding 工具台
          </div>
        </div>

        <nav class="px-3 py-4">
          <el-menu
            :default-active="route.path"
            :default-openeds="defaultOpeneds"
            router
            class="tool-menu border-0"
          >
            <el-sub-menu
              v-for="group in navigationGroups"
              :key="group.label"
              :index="group.label"
            >
              <template #title>
                <span class="truncate">{{ group.label }}</span>
              </template>

              <el-menu-item
                v-for="item in group.items"
                :key="item.path"
                :index="item.path"
              >
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                <el-tag v-if="item.comingSoon" size="small" effect="plain">
                  Soon
                </el-tag>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
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

.tool-menu :deep(.el-sub-menu__title) {
  height: 40px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px !important;
}

.tool-menu :deep(.el-sub-menu__title:hover) {
  background: #f8fafc;
}

.tool-menu :deep(.el-menu-item) {
  height: 40px;
  margin-bottom: 4px;
  border-radius: 6px;
  padding: 0 12px 0 24px !important;
}

.tool-menu :deep(.el-menu-item.is-active) {
  background: #ccfbf1;
  font-weight: 700;
}
</style>
