export interface ToolNavigationItem {
  label: string
  path: string
  group: string
  comingSoon?: boolean
}

export const toolNavigation: ToolNavigationItem[] = [
  {
    label: 'CRUD 提示词生成',
    path: '/ruoyi/crud',
    group: '若依后台',
  },
  {
    label: '微信小程序登录注册',
    path: '/miniapp/pages',
    group: '小程序',
  },
]

export const defaultToolPath = '/ruoyi/crud'
