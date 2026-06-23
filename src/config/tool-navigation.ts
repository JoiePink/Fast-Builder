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
    label: '01-启动页自动登录',
    path: '/miniapp/01loginStart',
    group: '小程序',
  },
  {
    label: '02-绑定手机号',
    path: '/miniapp/02bindPhoneNumber',
    group: '小程序',
  }
]

export const defaultToolPath = '/ruoyi/crud'
