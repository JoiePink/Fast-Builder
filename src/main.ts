import type { UserModule } from './types'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import { setupLayouts } from 'virtual:generated-layouts'
import { ViteSSG } from 'vite-ssg'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import 'element-plus/dist/index.css'

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  {
    routes: setupLayouts([...routes]),
    base: import.meta.env.BASE_URL,
  },
  (ctx) => {
    ctx.app.use(ElementPlus)
    for (const [key, component] of Object.entries(ElementPlusIconsVue))
      ctx.app.component(key, component)

    // install all modules under `modules/`
    Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
      .forEach(i => i.install?.(ctx))
    // ctx.app.use(Previewer)
  },
)
