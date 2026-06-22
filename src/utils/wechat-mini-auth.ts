import type { WechatMiniAuthConfig, WechatMiniAuthParamConfig, WechatMiniAuthPromptStep } from '~/types/fast-builder'

export function createDefaultWechatMiniAuthConfig(): WechatMiniAuthConfig {
  return {
    flowMode: 'method1SeparateRegister',
    projectName: '微信原生小程序',
    apis: {
      login: '/auth/login',
      getPhone: '/auth/get-phone',
      register: '/auth/xcx-register',
      profile: '/system/user/profile',
    },
    fields: {
      appid: 'appid',
      loginCode: 'xcxCode',
      phoneCode: 'code',
      phoneNumber: 'phonenumber',
      source: 'source',
      token: 'access_token',
      bindFlag: 'bindFlag',
      openId: 'openid',
      inviteCode: 'inviteCode',
      shareId: 'shareId',
      userInfo: 'user',
    },
    pages: {
      startPage: '/pages/start/start',
      bindPage: '/pages/login/login',
      defaultHome: '/pages/index/index',
      sharePages: ['index'],
    },
    entry: {
      enableQrCode: true,
      enableShare: true,
      sceneParam: 'scene',
      pageParam: 'p',
    },
    method1: {
      getPhoneParams: [
        {
          field: 'code',
          source: 'phoneAuthCode',
          value: 'e.detail.code',
          remark: 'button open-type="getPhoneNumber" 返回的手机号授权 code',
        },
      ],
      registerParams: [
        {
          field: 'clientId',
          source: 'appConfig',
          value: 'app.public.config.clientId',
          remark: '项目全局配置',
        },
        {
          field: 'grantType',
          source: 'appConfig',
          value: 'app.public.config.grantType',
          remark: '项目全局配置',
        },
        {
          field: 'xcxCode',
          source: 'wxLoginCode',
          value: 'wx.login 返回的 code',
          remark: '手机号换取成功后重新 wx.login 获取',
        },
        {
          field: 'phonenumber',
          source: 'getPhoneResult',
          value: 'getPhoneRes.data.phonenumber',
          remark: '从 get-phone 返回结果读取真实手机号',
        },
        {
          field: 'parentId',
          source: 'inviteCode',
          value: 'app.public.inviteCode',
          remark: '分享或二维码带入的邀请码，没有则为空',
        },
      ],
      loginParams: [
        {
          field: 'clientId',
          source: 'appConfig',
          value: 'app.public.config.clientId',
          remark: '项目全局配置',
        },
        {
          field: 'grantType',
          source: 'appConfig',
          value: 'app.public.config.grantType',
          remark: '项目全局配置',
        },
        {
          field: 'xcxCode',
          source: 'wxLoginCode',
          value: 'wx.login 返回的 code',
          remark: '启动页静默登录或注册后补登录使用',
        },
      ],
    },
  }
}

export function generateWechatMiniAuthPromptSteps(config: WechatMiniAuthConfig): WechatMiniAuthPromptStep[] {
  return [
    {
      key: 'global_app',
      title: '第一步：全局 app.js',
      description: '补齐全局登录态、请求封装、401 引导、入口参数解析和分享路径生成。',
      prompt: generateGlobalAppPrompt(config),
    },
    {
      key: 'start_page',
      title: '第二步：start 启动页',
      description: '实现空白启动页静默登录、保存登录态、解析分享/二维码入口并跳转。',
      prompt: generateStartPagePrompt(config),
    },
    {
      key: 'bind_page',
      title: '第三步：login 绑定页',
      description: '按 method1 跑通授权手机号、get-phone、xcx-register、注册后拉用户信息。',
      prompt: generateBindPagePrompt(config),
    },
    {
      key: 'share_pages',
      title: '第四步：分享页',
      description: '给配置页面补 onShareAppMessage，并保证邀请码回到 start 页面闭环。',
      prompt: generateSharePagesPrompt(config),
    },
    {
      key: 'acceptance',
      title: '第五步：验收清单',
      description: '按冷启动、分享、二维码、未登录接口、token 过期、注册回跳逐项验证。',
      prompt: generateAcceptancePrompt(config),
    },
  ]
}

function generateGlobalAppPrompt(config: WechatMiniAuthConfig) {
  return `${baseHeader(config)}

请先改全局 app.js，只实现登录注册闭环需要的公共能力，不要改业务页面。

【必须实现】
1. 在 app.public 中维护 config、token、loginData、userInfo、openId、bindFlag、inviteCode。
2. 封装 ajaxWx 请求方法：有 token 时自动加 Authorization: Bearer token，并携带项目已有 clientId/clientid。
3. 当接口返回 401 时：
   - 如果已绑定但 token 过期，引导到 ${config.pages.startPage} 重新静默登录。
   - 如果未绑定或没有 token，引导到 ${config.pages.bindPage}。
4. 实现 getPagePar(options)：
   - 支持二维码入口 ${config.entry.sceneParam}，解析形如 t_xxx,p_index 的参数。
   - 支持分享入口 ${config.entry.pageParam}，保存 t 邀请码和目标页面标识。
   - 无参数时返回 type: "none"。
5. 实现 getShareInfo(pageKey)：
   - path 使用 "${config.pages.startPage}?t=" + app.public.userInfo.${config.fields.inviteCode} + "&${config.entry.pageParam}=" + pageKey。
   - title 可按项目名称 ${config.projectName} 填写。

【method1 固定流程】
- start 页面只做 wx.login -> ${config.apis.login} 静默登录。
- login 页面点击授权手机号后，先用授权 code 调 ${config.apis.getPhone} 换真实手机号，再 wx.login 获取新的 ${config.fields.loginCode}，再调 ${config.apis.register} 注册。
- 注册成功后保存 token，并调 ${config.apis.profile} 拉用户信息；如果后端提示已注册或需要补登录，再重新 wx.login 调 ${config.apis.login}。

【项目约束】
- 只写微信原生小程序代码，不要生成 uni-app、Taro、Vue 小程序写法。
- 保留目标项目已有请求提示、loading、错误弹窗风格。
- 字段名按配置读取：token=${config.fields.token}，bindFlag=${config.fields.bindFlag}，openId=${config.fields.openId}，inviteCode=${config.fields.inviteCode}。

【当前配置】
\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\``
}

function generateStartPagePrompt(config: WechatMiniAuthConfig) {
  return `${baseHeader(config)}

请实现或补齐启动页 ${config.pages.startPage}。启动页是空白页，只负责进入小程序后的静默登录和跳转分流。

【start 页面流程】
1. onLoad(options) 保存 options，并从分享参数 t 或二维码解析结果中写入 app.public.inviteCode。
2. onShow 调用 wx.login。
3. wx.login 成功后调用 ${config.apis.login}，请求参数按下面映射组装：
${formatParamConfig(config.method1.loginParams)}
4. 登录成功后保存：
   - app.public.loginData = res.data
   - app.public.token = res.data.${config.fields.token} || res.data.token || ""
   - app.public.bindFlag = res.data.${config.fields.bindFlag} || false
   - app.public.openId = res.data.${config.fields.openId} || ""
5. 如果拿到 token，调用 ${config.apis.profile} 拉用户信息，并保存 app.public.userInfo = res.data.${config.fields.userInfo} || res.data。
6. 如果没有 token，直接进入 linkTo 分流，不在启动页弹绑定弹窗。
7. linkTo 使用 app.getPagePar(options)：
   - none：reLaunch 到 ${config.pages.defaultHome}。
   - code：保存 inviteCode，reLaunch 到二维码指定页面。
   - share：保存 inviteCode，按 p 参数进入目标页面，没有目标页则进入 ${config.pages.defaultHome}。

【注意】
- 启动页不处理手机号授权，不调 ${config.apis.getPhone}，不调 ${config.apis.register}。
- 二维码和分享默认都支持，不要删除任意一种入口。
- 只写微信原生小程序 Page 代码。`
}

function generateBindPagePrompt(config: WechatMiniAuthConfig) {
  return `${baseHeader(config)}

请实现或补齐绑定注册页 ${config.pages.bindPage}。这个页面只跑 method1：手机号授权 code -> ${config.apis.getPhone} -> wx.login -> ${config.apis.register} -> 保存登录态/拉用户信息。

【login 页面流程】
1. 页面包含协议勾选状态，未勾选时不能触发手机号授权注册。
2. 使用 button open-type="getPhoneNumber"，在 bindgetphonenumber 中读取 e.detail.code。
3. 用户拒绝授权时，保留在当前页并给出项目已有风格的提示。
4. 解析 ${config.apis.getPhone} 的 OpenAPI/Swagger 后，按下面映射组装请求参数：
${formatParamConfig(config.method1.getPhoneParams)}
5. ${config.apis.getPhone} 成功后，从返回结果中读取真实手机号，保存到页面状态或临时变量。
6. 重新调用 wx.login 获取新的 ${config.fields.loginCode}，不要复用启动页的旧 code。
7. 解析 ${config.apis.register} 的 OpenAPI/Swagger 后，按下面映射组装注册请求参数：
${formatParamConfig(config.method1.registerParams)}
8. 调用 ${config.apis.register} 注册。注册成功后保存 token、bindFlag、openId、loginData。
9. 有 token 时调用 ${config.apis.profile} 拉用户信息，保存 app.public.userInfo。
10. 如果后端返回“已注册/已绑定/需要重新登录”等状态，重新 wx.login，并按下面映射调 ${config.apis.login} 完成登录：
${formatParamConfig(config.method1.loginParams)}
11. 完成后复用启动页 linkTo 逻辑，注册后回到分享/二维码原目标页面。

【不要混用流程】
- 不要把 e.detail.code 直接当手机号使用，必须先调 ${config.apis.getPhone} 换真实手机号。
- 不要把手机号授权 code 填到 ${config.fields.loginCode}；${config.fields.loginCode} 只能来自 wx.login。
- 不要在 method1 中生成登录注册一体逻辑。
- 只实现微信原生小程序，不要生成 uni-app/Taro 写法。`
}

function generateSharePagesPrompt(config: WechatMiniAuthConfig) {
  const pages = config.pages.sharePages.filter(Boolean).length
    ? config.pages.sharePages.filter(Boolean).map(page => `- ${page}`).join('\n')
    : '- index'

  return `${baseHeader(config)}

请给以下页面补齐分享入口，使邀请码通过分享进入 ${config.pages.startPage} 后闭环注册：
${pages}

【必须实现】
1. 每个页面都实现 onShareAppMessage，返回 app.getShareInfo(pageKey)。
2. pageKey 使用配置中的页面标识，不要直接写完整路径，除非该项目现有 app.getShareInfo 需要完整路径。
3. 分享路径必须包含：
   - t：当前登录用户的邀请码 app.public.userInfo.${config.fields.inviteCode}
   - ${config.entry.pageParam}：目标页面标识
4. 如果页面还有 onShareTimeline，按同样路径返回。
5. 页面进入时如果从分享或二维码带入 t，要保证最终写入 app.public.inviteCode。

【不要做】
- 不要给未配置的页面批量加分享。
- 不要生成 uni-app/Taro 的分享生命周期。
- 不要改变页面已有业务请求。`
}

function generateAcceptancePrompt(config: WechatMiniAuthConfig) {
  return `${baseHeader(config)}

请按下面清单检查本次微信原生小程序 method1 登录注册闭环，不要新增功能，只修复验收中发现的问题。

【验收场景】
1. 冷启动无参数：进入 ${config.pages.startPage}，自动 wx.login -> ${config.apis.login}，已登录用户进入 ${config.pages.defaultHome}。
2. 未绑定用户：静默登录拿不到 token 时，公共页面可继续访问；调用需要 token 的接口返回 401 后，引导到 ${config.pages.bindPage}。
3. 手机号绑定注册：勾选协议后授权手机号，确认 e.detail.code 先进入 ${config.apis.getPhone}。
4. 确认 ${config.apis.getPhone} 返回的真实手机号进入 ${config.apis.register}，不是把授权 code 当手机号。
5. 确认 ${config.fields.loginCode} 来自重新 wx.login 后的 code。
6. 注册成功后保存 token，并拉 ${config.apis.profile}。
7. 分享进入：路径 ${config.pages.startPage}?t=邀请码&${config.entry.pageParam}=页面标识 能保存 app.public.inviteCode，并在注册后跳回目标页。
8. 二维码进入：${config.entry.sceneParam} 解析后能拿到 t 和 ${config.entry.pageParam}，注册后跳回目标页。
9. token 过期：接口返回 401 且已绑定时，引导到 ${config.pages.startPage} 重新登录。
10. 字段兼容：确认 token、${config.fields.bindFlag}、openId、inviteCode 都按当前配置字段读取。

【验证要求】
- 使用微信开发者工具手动验证上述场景。
- 如果项目有 lint/typecheck，运行并修复本次改动引入的问题。
- 验收结论里说明哪些场景已验证，哪些受后端或微信授权限制只能静态检查。`
}

function formatParamConfig(params: WechatMiniAuthParamConfig[]) {
  if (!params.length)
    return '   - 当前未配置参数，请先根据 OpenAPI/Swagger 补充参数字段、来源和取值方式。'

  return params.map((param) => {
    const remark = param.remark ? `；说明：${param.remark}` : ''
    return `   - ${param.field}：来源=${sourceText(param.source)}；取值=${param.value || '按项目实际填写'}${remark}`
  }).join('\n')
}

function sourceText(source: WechatMiniAuthParamConfig['source']) {
  const sourceMap: Record<WechatMiniAuthParamConfig['source'], string> = {
    phoneAuthCode: '手机号授权 code',
    wxLoginCode: 'wx.login code',
    getPhoneResult: 'get-phone 返回结果',
    appConfig: 'app.public.config',
    inviteCode: '分享/二维码邀请码',
    fixed: '固定值',
    manual: '手动输入/项目变量',
    previousResponse: '上一步接口返回',
  }

  return sourceMap[source]
}

function baseHeader(config: WechatMiniAuthConfig) {
  return `你现在在一个微信原生小程序项目中工作，项目名称：${config.projectName}。
公司固定 method1 模式：启动页静默登录，login 页手机号绑定注册，二维码和分享都默认支持邀请码闭环。注册和登录是分开的：${config.apis.getPhone} 获取手机号，${config.apis.register} 注册，${config.apis.login} 登录。`
}
