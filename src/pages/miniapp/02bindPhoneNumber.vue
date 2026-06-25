<script setup lang="ts">
import { CopyDocument, MagicStick, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { parse as parseYaml } from 'yaml'

interface PhoneParameter {
  id: string
  label: string
  name: string
  source: string
  binding: string
  example: string
  required: boolean
}

interface ApiParameter {
  id: string
  name: string
  path: string
  type: string
  required: boolean
  description: string
  source: string
  manual?: boolean
}

interface OpenApiResult {
  method: string
  path: string
  summary: string
  requestParams: ApiParameter[]
  responseParams: ApiParameter[]
}

interface AuthApiParameter extends ApiParameter {
  enabled: boolean
  sourceMode: 'pool' | 'custom'
  sourceKey: string
  customSource: string
}

interface AuthApiResponseParameter extends ApiParameter {
  selected: boolean
}

interface AuthApiInterface {
  id: string
  role: 'login' | 'register' | 'combined'
  roleLabel: string
  method: string
  path: string
  summary: string
  requestPool: AuthApiParameter[]
  responsePool: AuthApiResponseParameter[]
}

const defaultFigmaMcpText = `Implement this design from Figma.
@https://www.figma.com/design/iqDtxgOfQMsodBHA9QFQso/%E5%BE%8B%E5%B8%88%E5%B0%8F%E7%A8%8B%E5%BA%8F?node-id=140-3451&m=dev`

const figmaMcpText = ref(defaultFigmaMcpText)
const wxmlPath = ref('pages/login/login.wxml')
const wxssPath = ref('pages/login/login.wxss')
const jsPath = ref('pages/login/login.js')
const generatedPrompt = ref('')
const agree = ref(false)
const parameterPool = reactive<PhoneParameter[]>([])
const loginCredentialMode = ref<'code' | 'phone'>('code')
const phoneApiDocument = ref('')
const phoneApiParserStatus = ref('等待粘贴 OpenAPI/Swagger')
const phoneResponsePath = ref('')
const parsedPhoneApi = reactive({
  method: '-',
  path: '-',
  summary: '未解析',
})
const phoneApiRequestPool = reactive<ApiParameter[]>([])
const phoneApiResponsePool = reactive<ApiParameter[]>([])
const authMode = ref<'separate' | 'combined'>('separate')
const authApiDocuments = reactive<Record<'login' | 'register' | 'combined', string>>({ login: '', register: '', combined: '' })
const authApiStatuses = reactive<Record<'login' | 'register' | 'combined', string>>({ login: '等待解析', register: '等待解析', combined: '等待解析' })
const authApiInterfaces = reactive<AuthApiInterface[]>([])
const currentStep = ref(1)
const activeStep = ref(1)
const separateAuthProcess = [
  'getCode 成功后读取 app.public.bindFlag',
  'bindFlag 为 true 时调用 role=login 的登录接口',
  'bindFlag 为 false 时调用 role=register 的注册接口',
  '登录或注册成功后保存 app.public.loginData、app.public.token、app.public.bindFlag、app.public.openId',
  '成功结果存在 token 时调用 getUserInfo，写入 app.public.userInfo',
  '没有 token 或 getUserInfo 失败时也要用 wx.hideLoading 结束原生 loading 并执行 linkTo',
  '注册接口 fail 且 msg 包含“已经绑定过第三方用户”时，重新调用 wx.login 获取新的 xcxCode，再调用登录接口',
  '所有失败分支必须调用 wx.hideLoading，避免原生 loading 悬挂',
]
const combinedAuthProcess = [
  'getPhoneNumber:ok 后校验协议，读取 e.detail.code 并写入 phoneCode',
  '调用 getCode，通过 wx.login 获取 codeXcx，不要与手机号授权 code 混用',
  '请求 role=combined 的登录注册共用接口，参数包含 phoneCode、codeXcx、clientId、grantType，若项目存在 inviteCode 则一并带上',
  '接口成功后保存 app.public.loginData、app.public.bingFlag 或 bindFlag、app.public.token、app.public.needEditInfo',
  '如果 token 存在，调用 getUserInfo 或 /app/user/self 获取当前用户信息，写入 app.public.userInfo 后 linkTo',
  '如果 token 不存在，也按参考流程执行 linkTo',
  '不纳入 showAvatarNicknameModal、头像昵称弹窗、submit、uploadUserInfoToServer、/app/user/update 这一段流程',
  '所有失败分支必须调用 wx.hideLoading，避免原生 loading 悬挂',
]

const flowSteps = [
  { id: 1, title: '粘贴 Figma MCP' },
  { id: 2, title: '获取手机号授权 code' },
  { id: 3, title: '选择 code 使用方式' },
  { id: 4, title: '执行 getCode' },
  { id: 5, title: '解析登录注册接口' },
  { id: 6, title: '生成 Skill 提示词' },
  { id: 7, title: '复制并执行' },
]

const needsPhoneExchangeApi = computed(() => loginCredentialMode.value === 'phone')
const phoneApiReady = computed(() => {
  return !needsPhoneExchangeApi.value
    || (parsedPhoneApi.path !== '-' && phoneApiResponsePool.length > 0 && Boolean(phoneResponsePath.value))
})
const hasXcxCode = computed(() => parameterPool.some(param => param.id === 'wx-login-code'))
const canGenerate = computed(() => {
  return figmaMcpText.value.trim().length > 0 && parameterPool.length > 0 && phoneApiReady.value && hasXcxCode.value && authApiReady.value
})

const phoneCodeConfig = computed(() => JSON.stringify({
  executionOrder: [
    '读取 Figma 并实现页面契约',
    '校验 agree 后获取手机号授权 code',
    '按 loginCredentialMode 直接使用 code 或先换取手机号',
    '调用 getCode，通过 wx.login 获取 xcxCode 并写入参数池',
    '按 authMode 解析登录注册接口，选择需要填写的请求参数和需要入池的响应参数',
    '按 authProcess 完成登录/注册后续流程',
    '生成最终实现提示词',
  ],
  trigger: 'onAuthorizePhone',
  prerequisite: 'agree === true',
  automaticParameterPool: parameterPool,
  loginCredentialMode: loginCredentialMode.value,
  phoneExchangeApi: needsPhoneExchangeApi.value
    ? {
        ...parsedPhoneApi,
        requestPool: phoneApiRequestPool,
        responsePool: phoneApiResponsePool,
        phoneResponsePath: phoneResponsePath.value,
      }
    : null,
  authMode: authMode.value,
  authProcess: authMode.value === 'separate'
    ? {
        reference: 'D:\\project\\lawyer-huasheng\\weapp\\pages\\login\\login.js',
        branchField: 'app.public.bindFlag',
        steps: separateAuthProcess,
      }
    : {
        reference: 'D:\\project\\tiansenrun-shop\\pages\\bind\\bind.js',
        branchField: null,
        excludedFlow: 'D:\\project\\tiansenrun-shop\\pages\\bind\\bind.wxml 中 wx:if="{{ showAvatarNicknameModal }}" 的底部头像昵称弹窗，以及 bind.js 中 submit/uploadUserInfoToServer 相关流程',
        steps: combinedAuthProcess,
      },
  authApiInterfaces: selectedAuthApiInterfaces.value,
}, null, 2))

const phoneResponseOptions = computed(() => phoneApiResponsePool.map(param => ({
  label: `${param.path} · ${param.description || param.type}`,
  value: param.path,
})))
const isReviewingPrevious = computed(() => activeStep.value < currentStep.value)
const authDocumentDefinitions = computed(() => authMode.value === 'separate'
  ? [
      { key: 'login' as const, label: '登录接口' },
      { key: 'register' as const, label: '注册接口' },
    ]
  : [{ key: 'combined' as const, label: '登录注册共用接口' }])
const mergedFieldPoolOptions = computed(() => [
  ...parameterPool.map(param => ({ key: `auto:${param.name}`, label: `自动参数 / ${param.label} / ${param.name}` })),
  ...phoneApiResponsePool.map(param => ({ key: `phone-response:${param.path}`, label: `换手机号响应 / ${param.path}` })),
])
const selectedAuthApiInterfaces = computed(() => authApiInterfaces.map(api => ({
  ...api,
  requestPool: api.requestPool.filter(param => param.enabled),
  responsePool: api.responsePool.filter(param => param.selected),
})))
const authApiReady = computed(() => {
  const roles = authMode.value === 'separate' ? ['login', 'register'] : ['combined']
  return roles.every(role => {
    const api = authApiInterfaces.find(item => item.role === role)
    const enabledRequestPool = api?.requestPool.filter(param => param.enabled) || []
    const selectedResponsePool = api?.responsePool.filter(param => param.selected) || []
    return api
      && enabledRequestPool.length > 0
      && selectedResponsePool.length > 0
      && enabledRequestPool.every(param =>
        Boolean(param.name.trim())
        && Boolean(param.path.trim())
        && Boolean(param.type.trim())
        && (param.sourceMode === 'pool' ? Boolean(param.sourceKey) : Boolean(param.customSource.trim())),
      )
      && selectedResponsePool.every(param =>
        Boolean(param.name.trim())
        && Boolean(param.path.trim())
        && Boolean(param.type.trim()),
      )
  })
})

watch(loginCredentialMode, () => {
  generatedPrompt.value = ''
})

watch(phoneApiDocument, () => {
  if (parsedPhoneApi.path !== '-') {
    resetPhoneApiParse()
  }
})

watch(authMode, () => {
  authApiInterfaces.splice(0, authApiInterfaces.length)
  generatedPrompt.value = ''
})

function authorizePhoneLogin() {
  if (currentStep.value !== 2 || activeStep.value !== 2) return

  if (!agree.value) {
    ElMessage.warning('请先勾选用户协议和隐私条款')
    return
  }

  if (!parameterPool.some(param => param.id === 'phone-authorize-code')) {
    parameterPool.push({
      id: 'phone-authorize-code',
      label: '微信手机号授权 code',
      name: 'code',
      source: 'getPhoneNumber 授权回调',
      binding: 'e.detail.code',
      example: `phone_code_${Date.now()}`,
      required: true,
    })
  }

  ElMessage.success('手机号授权 code 已加入字段池')
  advanceStep(2)
}

function parsePhoneApiDocument() {
  if (!phoneApiDocument.value.trim()) {
    ElMessage.warning('请先粘贴 code 换手机号接口的 OpenAPI/Swagger')
    return
  }

  try {
    const result = parseOpenApiDocument(phoneApiDocument.value)
    parsedPhoneApi.method = result.method
    parsedPhoneApi.path = result.path
    parsedPhoneApi.summary = result.summary
    phoneApiRequestPool.splice(0, phoneApiRequestPool.length, ...result.requestParams)
    phoneApiResponsePool.splice(0, phoneApiResponsePool.length, ...result.responseParams)
    phoneResponsePath.value = findPhoneResponsePath(result.responseParams)
    phoneApiParserStatus.value = `已解析 ${result.method} ${result.path}：${result.requestParams.length} 个请求参数、${result.responseParams.length} 个响应参数`
    generatedPrompt.value = ''
    ElMessage.success('code 换手机号接口解析完成')
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '无法识别接口文档'
    phoneApiParserStatus.value = `解析失败：${message}`
    ElMessage.error(phoneApiParserStatus.value)
  }
}

function generatePrompt() {
  if (currentStep.value !== 6 || activeStep.value !== 6) return

  if (!figmaMcpText.value.trim()) {
    ElMessage.warning('请先粘贴 Figma MCP 内容')
    return
  }

  if (parameterPool.length === 0) {
    ElMessage.warning('请先勾选协议并获取手机号授权 code')
    return
  }

  if (!phoneApiReady.value) {
    ElMessage.warning('请先解析 code 换手机号接口，并选择返回的手机号字段')
    return
  }

  if (!hasXcxCode.value) {
    ElMessage.warning('请先执行 getCode 并把 wx.login code 加入参数池')
    return
  }
  if (!authApiReady.value) {
    ElMessage.warning('请先解析登录注册接口，选择需要填写的请求参数和需要入池的响应参数')
    return
  }

  generatedPrompt.value = `使用 $weapp 和 $02bind-phone-number。

任务：根据下面的 Figma 设计稿，实现微信原生小程序“绑定手机号登录”页面。

Figma：
${figmaMcpText.value.trim()}

目标文件：
- WXML：${wxmlPath.value.trim() || 'pages/login/login.wxml'}
- WXSS：${wxssPath.value.trim() || 'pages/login/login.wxss'}
- JS：${jsPath.value.trim() || 'pages/login/login.js'}

执行规则：
- 先读取 Figma 节点。目标文件存在就保留可复用的 class 命名和结构；不存在就新建页面。
- 严格按照 executionOrder 执行；前一步未完成时不要提前实现、调用或猜测后一步。
- 本阶段实现协议判断、手机号授权 code 入池、配置中选定的 code 使用分支、getCode 获取 xcxCode，以及按认证接口配置完成登录/注册调用骨架。
- 保持这些事件和状态名不变：onAuthorizeTap、onAuthorizePhone、onDeny、onToggleAgree、agree。
- 不要新增 shakeAgree、app-toast、app-loading 或自定义 toast/loading 依赖。
- loading 统一使用微信小程序原生 wx.showLoading / wx.hideLoading；不要实现或调用 finishAuthLoading、showAppLoading、hideAppLoading 这类自定义 loading 封装。
- 点击“授权手机号登录”时先判断 agree；未勾选协议就提示并终止。
- agree 为 true 时，由 open-type="getPhoneNumber" 触发 onAuthorizePhone，从 e.detail.code 读取手机号授权 code。
- getPhoneNumber:ok 且 code 存在时，把 code 按下面配置写入字段池；不要把它误当成 wx.login 返回的 xcxCode。
- loginCredentialMode=code 时，后续登录接口直接使用手机号授权 code。
- loginCredentialMode=phone 时，先按 phoneExchangeApi.requestPool 调用 code 换手机号接口，再从 phoneResponsePath 读取手机号，供后续登录接口使用。
- code 换手机号接口的请求参数、返回参数和手机号响应路径必须严格使用配置，不要猜测字段名。
- 完成手机号处理后调用 getCode；getCode 内部调用 wx.login，校验 res.code，并以变量名 xcxCode、绑定表达式 res.code 写入参数池。
- 手机号授权 code 来自 e.detail.code，xcxCode 来自 wx.login 的 res.code；两者必须作为两个独立字段保存，禁止覆盖或混用。
- authMode=separate 时分别实现登录接口与注册接口，并参考配置中的 role=login/register；authMode=combined 时只调用 role=combined 的共用接口。
- separate 模式参考 D:\\project\\lawyer-huasheng\\weapp\\pages\\login\\login.js 完成完整后续流程：getCode 成功后读取 app.public.bindFlag；bindFlag=true 调 role=login，bindFlag=false 调 role=register。
- separate 模式下登录/注册成功后，按项目既有写法保存 app.public.loginData、app.public.token、app.public.bindFlag、app.public.openId；如果 token 存在则调用 getUserInfo 并写入 app.public.userInfo，随后 wx.hideLoading 并 linkTo；如果没有 token，也要 wx.hideLoading 并 linkTo。
- separate 模式下注册接口 fail 且 msg 包含“已经绑定过第三方用户”时，不要直接失败；必须重新调用 wx.login 获取新的 xcxCode，再调用登录接口。wx.login 失败时 wx.hideLoading 并提示微信登录失败。
- separate 模式下所有 fail/early return 分支都要正确 wx.hideLoading，避免原生 loading 悬挂；getUserInfo 失败时登录已成功，仍然 wx.hideLoading 并 linkTo。
- combined 模式参考 D:\\project\\tiansenrun-shop\\pages\\bind\\bind.js：getPhoneNumber:ok 后先校验协议，把 e.detail.code 写入 phoneCode；再调用 getCode，通过 wx.login 获取 codeXcx；最后调用 role=combined 的登录注册共用接口。
- combined 模式请求参数参考 bind.js 的 loginData：phoneCode 来自手机号授权 code，codeXcx 来自 wx.login，clientId/grantType 来自项目配置，inviteCode 若目标项目存在则从 app.public.inviteCode 带入；实际字段名以 authApiInterfaces.requestPool 中用户勾选和手动补充的配置为准。
- combined 模式接口成功后，保存 app.public.loginData、app.public.bingFlag 或 bindFlag、app.public.token、app.public.needEditInfo；如果 token 存在，调用 getUserInfo 或 /app/user/self 获取当前用户信息并写入 app.public.userInfo，随后 wx.hideLoading 并 linkTo；如果 token 不存在，也要 wx.hideLoading 并 linkTo。
- combined 模式明确排除 bind.wxml 中 <view class="bottom-modal" wx:if="{{ showAvatarNicknameModal }}"> 头像昵称底部弹窗，以及 bind.js 中 showAvatarNicknameModal、submit、setUserInfoCancel、uploadUserInfoToServer、/app/user/update 相关流程；不要因为 needEditInfo 为 true 就实现或打开该弹窗。
- combined 模式下所有 fail/early return 分支都要正确 wx.hideLoading，避免原生 loading 悬挂。
- authApiInterfaces 中的 requestPool 只包含用户勾选为“需要填写”的请求参数；未勾选的请求参数不要组装进请求。
- 每个被勾选的认证接口请求参数必须按 sourceMode 取值：pool 从字段池 sourceKey 获取，custom 根据 customSource 的自然语言说明去目标项目中查找；不要凭空补值。
- authApiInterfaces 中的 responsePool 只包含用户勾选为“放入响应参数池”的响应参数；后续只按这些响应路径读取返回结果。
- 如果接口文档缺少必要字段，用户会以 manual=true 的参数手动补充；手动补充项与解析项同等有效，必须按配置中的 name/path/type/description/sourceMode/customSource 执行，不要忽略。
- authProcess 是认证后续流程的强约束：authMode=separate 时必须完整实现分流、登录、注册、注册冲突重试登录、保存登录态、拉用户信息和跳转；authMode=combined 时按 tiansenrun-shop 的共用接口流程执行，并严格跳过 excludedFlow。

字段池配置：

\`\`\`json
${phoneCodeConfig.value}
\`\`\`

必须保留的 WXML 契约：

\`\`\`xml
<view class="btn-primary-wrap">
  <button class="btn primary" hover-class="none" bindtap="onAuthorizeTap">
    授权手机号登录
  </button>
  <button
    wx:if="{{agree}}"
    class="btn primary btn-phone-auth"
    hover-class="none"
    open-type="getPhoneNumber"
    bindgetphonenumber="onAuthorizePhone"
  >
    授权手机号登录
  </button>
</view>
<button class="btn secondary" hover-class="none" bindtap="onDeny">
  不授权登录
</button>
\`\`\`

\`\`\`xml
<view class="agree-row" bindtap="onToggleAgree">
  <view class="checkbox {{agree ? 'checked' : ''}}">
    <view class="tick"></view>
  </view>
  <view class="agreement">
    登录即同意
    <text class="link">《用户服务协议》</text>
    和
    <text class="link">《隐私条款》</text>
    并使用本机号码登录
  </view>
</view>
\`\`\`

完成后请说明使用的 Figma 节点、修改或新建的文件，并确认两个“授权手机号登录”按钮、“不授权登录”按钮、协议勾选区域仍符合上面的契约。`

  ElMessage.success('已生成绑定手机号页面提示词')
  advanceStep(6)
}

function completeFigmaStep() {
  if (!figmaMcpText.value.trim()) {
    ElMessage.warning('请先粘贴 Figma MCP 内容')
    return
  }

  advanceStep(1)
}

function completeCredentialStep() {
  if (needsPhoneExchangeApi.value && !phoneApiReady.value) {
    ElMessage.warning('请先解析 code 换手机号接口，并选择手机号响应字段')
    return
  }

  advanceStep(3)
}

function runGetCodeStep() {
  if (currentStep.value !== 4 || activeStep.value !== 4) return

  if (!parameterPool.some(param => param.id === 'wx-login-code')) {
    parameterPool.push({
      id: 'wx-login-code',
      label: '微信登录临时 code',
      name: 'xcxCode',
      source: 'wx.login success 回调',
      binding: 'res.code',
      example: `wx_code_${Date.now()}`,
      required: true,
    })
  }

  ElMessage.success('wx.login 返回的 code 已加入字段池')
  advanceStep(4)
}

function parseAuthApiDocument(role: 'login' | 'register' | 'combined') {
  const source = authApiDocuments[role].trim()
  if (!source) {
    ElMessage.warning('请先粘贴接口 OpenAPI/Swagger')
    return
  }

  try {
    const result = parseOpenApiDocument(source)
    const roleLabel = role === 'login' ? '登录接口' : role === 'register' ? '注册接口' : '登录注册共用接口'
    const requestPool = result.requestParams.map(param => {
      const sourceKey = findDefaultAuthSource(param.name)
      return {
        ...param,
        enabled: param.required || Boolean(sourceKey),
        sourceMode: sourceKey ? 'pool' as const : 'custom' as const,
        sourceKey,
        customSource: '',
      }
    })
    const responsePool = result.responseParams.map(param => ({
      ...param,
      selected: false,
    }))
    const api: AuthApiInterface = {
      id: `auth-${role}`,
      role,
      roleLabel,
      method: result.method,
      path: result.path,
      summary: result.summary,
      requestPool,
      responsePool,
    }
    const index = authApiInterfaces.findIndex(item => item.role === role)
    if (index >= 0) authApiInterfaces.splice(index, 1, api)
    else authApiInterfaces.push(api)
    authApiStatuses[role] = `已解析 ${result.method} ${result.path}，请确认请求参数和响应入池字段`
    generatedPrompt.value = ''
  }
  catch (error) {
    authApiStatuses[role] = `解析失败：${error instanceof Error ? error.message : '无法识别文档'}`
    ElMessage.error(authApiStatuses[role])
  }
}

function invalidateAuthApi(role: 'login' | 'register' | 'combined') {
  const index = authApiInterfaces.findIndex(item => item.role === role)
  if (index >= 0) authApiInterfaces.splice(index, 1)
  authApiStatuses[role] = '等待重新解析'
  generatedPrompt.value = ''
}

function addManualAuthRequestParam(api: AuthApiInterface) {
  const index = api.requestPool.filter(param => param.manual).length + 1
  api.requestPool.push({
    id: `${api.id}-manual-request-${Date.now()}`,
    name: `manualParam${index}`,
    path: `manualParam${index}`,
    type: 'string',
    required: false,
    description: '手动补充的请求参数，请修改参数名、类型和取值来源',
    source: '手动添加',
    manual: true,
    enabled: true,
    sourceMode: 'custom',
    sourceKey: '',
    customSource: '',
  })
  generatedPrompt.value = ''
}

function addManualAuthResponseParam(api: AuthApiInterface) {
  const index = api.responsePool.filter(param => param.manual).length + 1
  api.responsePool.push({
    id: `${api.id}-manual-response-${Date.now()}`,
    name: `manualField${index}`,
    path: `data.manualField${index}`,
    type: 'string',
    required: false,
    description: '手动补充的响应参数，请修改响应路径、字段名和说明',
    source: '手动添加',
    manual: true,
    selected: true,
  })
  generatedPrompt.value = ''
}

function findDefaultAuthSource(name: string) {
  const exact = parameterPool.find(param => param.name.toLowerCase() === name.toLowerCase())
  if (exact) return `auto:${exact.name}`
  if (/^(phone|phonenumber|mobile|purePhoneNumber)$/i.test(name) && phoneResponsePath.value) return `phone-response:${phoneResponsePath.value}`
  return ''
}

function completeAuthApiStep() {
  if (!authApiReady.value) {
    ElMessage.warning('请解析所需接口，勾选要填写的请求参数并配置取值，再勾选要放入响应参数池的返回字段')
    return
  }
  advanceStep(5)
}

function advanceStep(completedStep: number) {
  if (completedStep !== currentStep.value || completedStep >= flowSteps.length) return
  currentStep.value += 1
  activeStep.value = currentStep.value
}

function viewStep(step: number) {
  if (step <= currentStep.value) activeStep.value = step
}

function returnToCurrentStep() {
  activeStep.value = currentStep.value
}

function stepState(step: number) {
  if (step < currentStep.value) return 'done'
  if (step === currentStep.value) return 'current'
  return 'locked'
}

function resetForm() {
  figmaMcpText.value = defaultFigmaMcpText
  wxmlPath.value = 'pages/login/login.wxml'
  wxssPath.value = 'pages/login/login.wxss'
  jsPath.value = 'pages/login/login.js'
  generatedPrompt.value = ''
  agree.value = false
  parameterPool.splice(0, parameterPool.length)
  loginCredentialMode.value = 'code'
  phoneApiDocument.value = ''
  resetPhoneApiParse()
  authMode.value = 'separate'
  authApiDocuments.login = ''
  authApiDocuments.register = ''
  authApiDocuments.combined = ''
  authApiStatuses.login = '等待解析'
  authApiStatuses.register = '等待解析'
  authApiStatuses.combined = '等待解析'
  authApiInterfaces.splice(0, authApiInterfaces.length)
  currentStep.value = 1
  activeStep.value = 1
}

function resetPhoneApiParse() {
  phoneApiParserStatus.value = '等待粘贴 OpenAPI/Swagger'
  phoneResponsePath.value = ''
  parsedPhoneApi.method = '-'
  parsedPhoneApi.path = '-'
  parsedPhoneApi.summary = '未解析'
  phoneApiRequestPool.splice(0, phoneApiRequestPool.length)
  phoneApiResponsePool.splice(0, phoneApiResponsePool.length)
  generatedPrompt.value = ''
}

function parseOpenApiDocument(source: string): OpenApiResult {
  const document = parseYaml(extractOpenApiSource(source)) as Record<string, unknown>
  const paths = asRecord(document?.paths)
  const pathEntry = Object.entries(paths).find(([, pathItem]) => Object.keys(asRecord(pathItem)).some(isHttpMethod))

  if (!pathEntry) {
    throw new Error('未找到 paths 接口定义')
  }

  const [path, rawPathItem] = pathEntry
  const pathItem = asRecord(rawPathItem)
  const methodEntry = Object.entries(pathItem).find(([method]) => isHttpMethod(method))

  if (!methodEntry) {
    throw new Error('未找到 HTTP 方法')
  }

  const [method, rawOperation] = methodEntry
  const operation = asRecord(rawOperation)
  const requestParams = parseOperationRequestParams(document, pathItem, operation)
  const responseParams = parseOperationResponseParams(document, operation)

  return {
    method: method.toUpperCase(),
    path,
    summary: String(operation.summary || operation.operationId || 'code 换手机号接口'),
    requestParams,
    responseParams,
  }
}

function parseOperationRequestParams(
  document: Record<string, unknown>,
  pathItem: Record<string, unknown>,
  operation: Record<string, unknown>,
) {
  const parameters = [
    ...asArray(pathItem.parameters),
    ...asArray(operation.parameters),
  ]
  const requestParams = parameters.flatMap((rawParam, index) => {
    const param = resolveRef(document, rawParam)
    const location = String(param.in || '')

    if (location === 'body') {
      return flattenSchema(document, param.schema, '', asStringArray(asRecord(resolveSchema(document, param.schema)).required))
    }

    const name = String(param.name || `param${index + 1}`)
    const schema = asRecord(resolveSchema(document, param.schema || param))
    return [createApiParameter(name, name, schema, Boolean(param.required), String(param.description || ''), requestSource(name))]
  })

  const requestBody = resolveRef(document, operation.requestBody)
  const requestSchema = getContentSchema(requestBody.content)

  if (requestSchema) {
    const schema = asRecord(resolveSchema(document, requestSchema))
    requestParams.push(...flattenSchema(document, schema, '', asStringArray(schema.required)))
  }

  return dedupeParams(requestParams)
}

function parseOperationResponseParams(document: Record<string, unknown>, operation: Record<string, unknown>) {
  const responses = asRecord(operation.responses)
  const responseEntry = Object.entries(responses)
    .sort(([left], [right]) => responsePriority(left) - responsePriority(right))
    .find(([, response]) => {
      const resolved = resolveRef(document, response)
      return Boolean(getContentSchema(resolved.content) || resolved.schema)
    })

  if (!responseEntry) {
    return []
  }

  const response = resolveRef(document, responseEntry[1])
  const schema = getContentSchema(response.content) || response.schema
  return flattenSchema(document, schema)
}

function flattenSchema(
  document: Record<string, unknown>,
  rawSchema: unknown,
  prefix = '',
  inheritedRequired: string[] = [],
  visited = new Set<string>(),
): ApiParameter[] {
  const ref = asRecord(rawSchema).$ref
  const refName = typeof ref === 'string' ? ref : ''

  if (refName && visited.has(refName)) {
    return []
  }

  const nextVisited = new Set(visited)
  if (refName) nextVisited.add(refName)

  const schema = asRecord(resolveSchema(document, rawSchema))
  const allOf = asArray(schema.allOf)
  if (allOf.length) {
    return allOf.flatMap(item => flattenSchema(document, item, prefix, inheritedRequired, nextVisited))
  }

  const properties = asRecord(schema.properties)
  if (Object.keys(properties).length === 0) {
    if (!prefix) return []
    const name = prefix.split('.').pop() || prefix
    return [createApiParameter(name, prefix, schema, inheritedRequired.includes(name), String(schema.description || ''), '')]
  }

  const required = asStringArray(schema.required)
  return Object.entries(properties).flatMap(([name, childSchema]) => {
    const path = prefix ? `${prefix}.${name}` : name
    const resolvedChild = asRecord(resolveSchema(document, childSchema))
    const childProperties = asRecord(resolvedChild.properties)
    const childAllOf = asArray(resolvedChild.allOf)

    if (Object.keys(childProperties).length || childAllOf.length || resolvedChild.type === 'object') {
      return flattenSchema(document, childSchema, path, required, nextVisited)
    }

    return [createApiParameter(
      name,
      path,
      resolvedChild,
      required.includes(name),
      String(resolvedChild.description || ''),
      requestSource(name),
    )]
  })
}

function createApiParameter(
  name: string,
  path: string,
  schema: Record<string, unknown>,
  required: boolean,
  description: string,
  source: string,
): ApiParameter {
  return {
    id: `${path || name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    path,
    type: String(schema.type || (schema.enum ? 'enum' : 'unknown')),
    required,
    description,
    source,
  }
}

function requestSource(name: string) {
  return /^(code|phoneCode|phone_code)$/i.test(name)
    ? '字段池 / 微信手机号授权 code'
    : '待配置'
}

function findPhoneResponsePath(params: ApiParameter[]) {
  const preferredNames = ['purePhoneNumber', 'phoneNumber', 'phonenumber', 'phone', 'mobile']

  for (const name of preferredNames) {
    const preferred = params.find(param => param.name.toLowerCase() === name.toLowerCase())
    if (preferred) return preferred.path
  }

  return ''
}

function extractOpenApiSource(source: string) {
  const trimmed = source.trim().replace(/^\uFEFF/, '')
  const fencedBlock = trimmed.match(/```(?:ya?ml|json)?\s*([\s\S]*?)```/i)

  if (fencedBlock?.[1]) {
    return fencedBlock[1].trim()
  }

  const openApiLine = trimmed.search(/^\s*(openapi|swagger)\s*:/m)
  if (openApiLine > 0) {
    return trimmed.slice(openApiLine)
  }

  const jsonStart = trimmed.indexOf('{')
  if (jsonStart > 0) {
    return trimmed.slice(jsonStart)
  }

  return trimmed
}

function resolveSchema(document: Record<string, unknown>, schema: unknown): unknown {
  const resolved = resolveRef(document, schema)
  return resolved.schema ? resolveRef(document, resolved.schema) : resolved
}

function resolveRef(document: Record<string, unknown>, value: unknown): Record<string, unknown> {
  const record = asRecord(value)
  const ref = record.$ref
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return record

  const resolved = ref.slice(2).split('/').reduce<unknown>((current, segment) => {
    return asRecord(current)[segment.replace(/~1/g, '/').replace(/~0/g, '~')]
  }, document)
  return asRecord(resolved)
}

function getContentSchema(content: unknown) {
  const mediaTypes = asRecord(content)
  const mediaType = Object.values(mediaTypes)[0]
  return asRecord(mediaType).schema
}

function responsePriority(status: string) {
  if (/^2\d\d$/.test(status)) return Number(status)
  if (status === 'default') return 999
  return 1000
}

function dedupeParams(params: ApiParameter[]) {
  const seen = new Set<string>()
  return params.filter((param) => {
    const key = param.path || param.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isHttpMethod(value: string) {
  return ['get', 'post', 'put', 'patch', 'delete'].includes(value.toLowerCase())
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function asStringArray(value: unknown): string[] {
  return asArray(value).map(item => String(item))
}

async function copyPrompt() {
  if (!generatedPrompt.value) {
    ElMessage.warning('请先生成提示词')
    return
  }

  try {
    await navigator.clipboard.writeText(generatedPrompt.value)
    ElMessage.success('已复制提示词')
  }
  catch {
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <main class="bind-page">
    <section class="page-head">
      <div>
        <p class="eyebrow">
          Mini Program / Step 02
        </p>
        <h1>绑定手机号页面提示词</h1>
      </div>
      <div class="head-actions">
        <el-button v-if="isReviewingPrevious" type="primary" plain @click="returnToCurrentStep">
          返回当前步骤
        </el-button>
        <el-button :icon="RefreshLeft" plain @click="resetForm">
          恢复示例
        </el-button>
      </div>
    </section>

    <section class="step-strip">
      <button
        v-for="step in flowSteps"
        :key="step.id"
        class="step-item"
        :class="[stepState(step.id), { active: activeStep === step.id }]"
        :disabled="step.id > currentStep"
        @click="viewStep(step.id)"
      >
        <span>{{ String(step.id).padStart(2, '0') }}</span>
        <strong>{{ step.title }}</strong>
        <small>{{ stepState(step.id) === 'done' ? '已完成' : stepState(step.id) === 'current' ? '当前步骤' : '未解锁' }}</small>
      </button>
    </section>

    <el-alert
      v-if="isReviewingPrevious"
      class="history-alert"
      title="正在查看已完成步骤；历史内容为只读。"
      type="info"
      :closable="false"
      show-icon
    />

    <el-card
      v-if="activeStep === 2"
      class="parameter-section"
      :class="{ 'review-mode': isReviewingPrevious }"
      :inert="isReviewingPrevious || undefined"
      shadow="never"
    >
      <template #header>
        <div class="panel-title">
          <span>Phone Authorization</span>
          <strong>协议判断与手机号授权 code 入池</strong>
        </div>
      </template>

      <div class="authorize-bar">
        <el-checkbox v-model="agree">
          已同意《用户服务协议》和《隐私条款》
        </el-checkbox>
        <el-button type="primary" @click="authorizePhoneLogin">
          授权手机号登录
        </el-button>
      </div>

      <el-alert
        title="只有勾选协议后才会模拟 getPhoneNumber 成功回调，并把 e.detail.code 加入字段池；该 code 与 wx.login 的 xcxCode 是两个不同凭证。"
        type="info"
        :closable="false"
        show-icon
      />

      <div class="section-title">
        <span>Parameter Pool</span>
        <strong>字段池：自动获取的参数</strong>
      </div>

      <el-table :data="parameterPool" border empty-text="勾选协议并点击“授权手机号登录”后，手机号授权 code 会加入这里">
        <el-table-column label="业务字段" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.label" />
          </template>
        </el-table-column>
        <el-table-column label="变量名" min-width="140">
          <template #default="{ row }">
            <el-input v-model="row.name" />
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" min-width="200" />
        <el-table-column prop="binding" label="绑定表达式" min-width="160" />
        <el-table-column prop="example" label="示例值" min-width="190" />
        <el-table-column label="必填" width="90">
          <template #default="{ row }">
            <el-select v-model="row.required">
              <el-option label="是" :value="true" />
              <el-option label="否" :value="false" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>

      <el-collapse class="config-collapse">
        <el-collapse-item title="当前可复用配置预览" name="phone-code-config">
          <pre><code>{{ phoneCodeConfig }}</code></pre>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card
      v-if="activeStep === 3"
      class="parameter-section"
      :class="{ 'review-mode': isReviewingPrevious }"
      :inert="isReviewingPrevious || undefined"
      shadow="never"
    >
      <template #header>
        <div class="panel-title">
          <span>Credential Mode</span>
          <strong>选择登录接口使用 code 还是手机号</strong>
        </div>
      </template>

      <el-radio-group v-model="loginCredentialMode" class="credential-mode">
        <el-radio-button value="code">
          登录接口直接传 code
        </el-radio-button>
        <el-radio-button value="phone">
          先用 code 换手机号
        </el-radio-button>
      </el-radio-group>

      <el-alert
        v-if="!needsPhoneExchangeApi"
        title="当前分支不需要额外接口：登录接口直接读取字段池中的手机号授权 code。"
        type="success"
        :closable="false"
        show-icon
      />

      <div v-else class="phone-api-workspace">
        <el-alert
          title="粘贴 code 换手机号接口的 OpenAPI/Swagger。解析后将生成请求参数池、响应参数池，并选择后续登录接口使用的手机号字段。"
          type="info"
          :closable="false"
          show-icon
        />

        <div class="parser-layout">
          <div class="yaml-panel">
            <label class="textarea-label" for="phone-api-document">OpenAPI/Swagger</label>
            <el-input
              id="phone-api-document"
              v-model="phoneApiDocument"
              type="textarea"
              :rows="14"
              resize="vertical"
              placeholder="粘贴 YAML 或 JSON 格式的 code 换手机号接口文档"
            />
            <div class="parser-actions">
              <el-button type="primary" :disabled="!phoneApiDocument.trim()" @click="parsePhoneApiDocument">
                解析接口文档
              </el-button>
              <el-tag type="info">
                {{ phoneApiParserStatus }}
              </el-tag>
            </div>
          </div>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="接口路径">
              {{ parsedPhoneApi.method }} {{ parsedPhoneApi.path }}
            </el-descriptions-item>
            <el-descriptions-item label="接口名称">
              {{ parsedPhoneApi.summary }}
            </el-descriptions-item>
            <el-descriptions-item label="请求参数">
              {{ phoneApiRequestPool.length }} 个
            </el-descriptions-item>
            <el-descriptions-item label="响应参数">
              {{ phoneApiResponsePool.length }} 个
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="section-title">
          <span>Request Pool</span>
          <strong>字段池：code 换手机号接口请求参数</strong>
        </div>
        <el-table :data="phoneApiRequestPool" border empty-text="解析接口文档后显示请求参数">
          <el-table-column prop="name" label="参数名" min-width="140" />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column label="必填" width="90">
            <template #default="{ row }">
              <el-tag :type="row.required ? 'danger' : 'info'">
                {{ row.required ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column label="取值来源" min-width="240">
            <template #default="{ row }">
              <el-input v-model="row.source" />
            </template>
          </el-table-column>
        </el-table>

        <div class="section-title">
          <span>Response Pool</span>
          <strong>字段池：code 换手机号接口返回参数</strong>
        </div>
        <el-table :data="phoneApiResponsePool" border empty-text="解析接口文档后显示返回参数">
          <el-table-column prop="path" label="响应路径" min-width="180" />
          <el-table-column prop="name" label="字段名" min-width="140" />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="description" label="说明" min-width="220" />
        </el-table>

        <el-form class="phone-field-form" label-position="top">
          <el-form-item label="登录接口使用的手机号响应字段">
            <el-select v-model="phoneResponsePath" filterable placeholder="请选择返回参数中的手机号字段">
              <el-option
                v-for="option in phoneResponseOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="step-actions">
        <el-button type="primary" :disabled="!phoneApiReady" @click="completeCredentialStep">
          确认选择并进入下一步
        </el-button>
      </div>
    </el-card>

    <el-card
      v-if="activeStep === 4"
      class="parameter-section"
      :class="{ 'review-mode': isReviewingPrevious }"
      :inert="isReviewingPrevious || undefined"
      shadow="never"
    >
      <template #header>
        <div class="panel-title">
          <span>WeChat Login Code</span>
          <strong>执行 getCode 并写入参数池</strong>
        </div>
      </template>

      <el-alert
        title="参考 login.js：getCode 调用 wx.login，success 中校验 res.code，再以 xcxCode 写入参数池。该值与手机号授权 code 完全独立。"
        type="info"
        :closable="false"
        show-icon
      />

      <div class="step-actions">
        <el-button type="primary" @click="runGetCodeStep">
          执行 getCode，获取 code 并加入参数池
        </el-button>
      </div>

      <div class="section-title">
        <span>Parameter Pool</span>
        <strong>字段池：当前自动获取参数</strong>
      </div>
      <el-table :data="parameterPool" border>
        <el-table-column prop="label" label="业务字段" min-width="180" />
        <el-table-column prop="name" label="变量名" min-width="140" />
        <el-table-column prop="source" label="来源" min-width="200" />
        <el-table-column prop="binding" label="绑定表达式" min-width="160" />
        <el-table-column prop="example" label="示例值" min-width="190" />
      </el-table>
    </el-card>

    <el-card
      v-if="activeStep === 5"
      class="parameter-section"
      :class="{ 'review-mode': isReviewingPrevious }"
      :inert="isReviewingPrevious || undefined"
      shadow="never"
    >
      <template #header>
        <div class="panel-title">
          <span>Auth API Mode</span>
          <strong>解析登录与注册接口</strong>
        </div>
      </template>

      <el-radio-group v-model="authMode" class="credential-mode">
        <el-radio-button value="separate">登录、注册两个接口</el-radio-button>
        <el-radio-button value="combined">登录注册共用一个接口</el-radio-button>
      </el-radio-group>

      <el-alert
        title="解析结果只是候选项：请勾选真正需要填写的请求参数，并勾选要放入响应参数池的返回字段；接口文档缺字段时可手动添加。"
        type="warning"
        :closable="false"
        show-icon
      />

      <el-alert
        v-if="authMode === 'separate'"
        class="flow-alert"
        type="success"
        :closable="false"
        show-icon
      >
        <template #title>
          分开接口后续流程将参考 lawyer-huasheng/login.js：getCode 后按 app.public.bindFlag 分流登录或注册；注册冲突时刷新 xcxCode 再登录；成功后保存登录态、拉用户信息并跳转。
          如果接口文档缺少 access_token、bindFlag、openid、user 等后续流程字段，请手动添加到响应参数池。
        </template>
      </el-alert>

      <el-collapse v-if="authMode === 'separate'" class="config-collapse">
        <el-collapse-item title="查看 separate 模式后续流程" name="separate-auth-process">
          <ol class="flow-list">
            <li v-for="step in separateAuthProcess" :key="step">{{ step }}</li>
          </ol>
        </el-collapse-item>
      </el-collapse>

      <el-alert
        v-if="authMode === 'combined'"
        class="flow-alert"
        type="success"
        :closable="false"
        show-icon
      >
        <template #title>
          共用接口后续流程将参考 tiansenrun-shop/bind.js：phoneCode + codeXcx 调用同一个登录接口，成功后保存登录态、拉用户信息并跳转；不纳入 showAvatarNicknameModal 头像昵称底部弹窗。
        </template>
      </el-alert>

      <el-collapse v-if="authMode === 'combined'" class="config-collapse">
        <el-collapse-item title="查看 combined 模式后续流程" name="combined-auth-process">
          <ol class="flow-list">
            <li v-for="step in combinedAuthProcess" :key="step">{{ step }}</li>
          </ol>
        </el-collapse-item>
      </el-collapse>

      <div v-for="definition in authDocumentDefinitions" :key="definition.key" class="auth-api-block">
        <div class="section-title">
          <span>OpenAPI / Swagger</span>
          <strong>{{ definition.label }}</strong>
        </div>
        <el-input
          v-model="authApiDocuments[definition.key]"
          type="textarea"
          :rows="10"
          resize="vertical"
          :placeholder="`粘贴${definition.label}的 OpenAPI/Swagger`"
          @input="invalidateAuthApi(definition.key)"
        />
        <div class="parser-actions">
          <el-button type="primary" :disabled="!authApiDocuments[definition.key].trim()" @click="parseAuthApiDocument(definition.key)">
            解析{{ definition.label }}
          </el-button>
          <el-tag type="info">{{ authApiStatuses[definition.key] }}</el-tag>
        </div>
      </div>

      <el-collapse v-if="authApiInterfaces.length" class="interface-collapse" accordion>
        <el-collapse-item v-for="api in authApiInterfaces" :key="api.id" :name="api.id">
          <template #title>
            <strong>{{ api.roleLabel }} · {{ api.method }} {{ api.path }}</strong>
          </template>

          <div class="section-title">
            <span>Request Pool</span>
            <strong>先选择需要填写的请求参数，再配置取值</strong>
          </div>
          <el-table :data="api.requestPool" border>
            <el-table-column label="需要填" width="92" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.enabled" />
              </template>
            </el-table-column>
            <el-table-column label="来源" width="88">
              <template #default="{ row }">
                <el-tag :type="row.manual ? 'warning' : 'info'">{{ row.manual ? '手动' : '解析' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="参数名" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="参数名" />
              </template>
            </el-table-column>
            <el-table-column label="路径" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.path" placeholder="body.xxx / query.xxx" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="130">
              <template #default="{ row }">
                <el-input v-model="row.type" placeholder="string" />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.required" />
              </template>
            </el-table-column>
            <el-table-column label="说明" min-width="220">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="参数说明" />
              </template>
            </el-table-column>
            <el-table-column label="取值方式" width="160">
              <template #default="{ row }">
                <el-select v-model="row.sourceMode" :disabled="!row.enabled">
                  <el-option label="从字段池选择" value="pool" />
                  <el-option label="Input 说明来源" value="custom" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="取值" min-width="280">
              <template #default="{ row }">
                <el-select v-if="row.sourceMode === 'pool'" v-model="row.sourceKey" filterable clearable :disabled="!row.enabled" placeholder="请选择字段池参数">
                  <el-option v-for="option in mergedFieldPoolOptions" :key="option.key" :label="option.label" :value="option.key" />
                </el-select>
                <el-input v-else v-model="row.customSource" :disabled="!row.enabled" placeholder="例如：从 app.public.config.clientId 获取" />
              </template>
            </el-table-column>
          </el-table>
          <div class="parser-actions">
            <el-button @click="addManualAuthRequestParam(api)">手动添加请求参数</el-button>
          </div>

          <div class="section-title">
            <span>Response Pool</span>
            <strong>选择要放入响应参数池的字段</strong>
          </div>
          <el-table :data="api.responsePool" border>
            <el-table-column label="入池" width="80" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.selected" />
              </template>
            </el-table-column>
            <el-table-column label="来源" width="88">
              <template #default="{ row }">
                <el-tag :type="row.manual ? 'warning' : 'info'">{{ row.manual ? '手动' : '解析' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="响应路径" min-width="210">
              <template #default="{ row }">
                <el-input v-model="row.path" placeholder="例如：data.token" />
              </template>
            </el-table-column>
            <el-table-column label="字段名" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="字段名" />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="130">
              <template #default="{ row }">
                <el-input v-model="row.type" placeholder="string" />
              </template>
            </el-table-column>
            <el-table-column label="说明" min-width="240">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="字段说明" />
              </template>
            </el-table-column>
          </el-table>
          <div class="parser-actions">
            <el-button @click="addManualAuthResponseParam(api)">手动添加响应参数</el-button>
          </div>
        </el-collapse-item>
      </el-collapse>

      <div class="step-actions">
        <el-button type="primary" :disabled="!authApiReady" @click="completeAuthApiStep">
          完成接口配置并进入下一步
        </el-button>
      </div>
    </el-card>

    <el-card
      v-if="activeStep === 6"
      class="parameter-section"
      :class="{ 'review-mode': isReviewingPrevious }"
      :inert="isReviewingPrevious || undefined"
      shadow="never"
    >
      <template #header>
        <div class="panel-title">
          <span>Prompt Generator</span>
          <strong>生成 Skill 提示词</strong>
        </div>
      </template>

      <el-alert
        title="前面步骤已经锁定为配置。确认预览后生成提示词，生成成功才会进入最后一步。"
        type="success"
        :closable="false"
        show-icon
      />
      <el-collapse class="config-collapse">
        <el-collapse-item title="查看完整配置" name="final-config">
          <pre><code>{{ phoneCodeConfig }}</code></pre>
        </el-collapse-item>
      </el-collapse>
      <div class="step-actions">
        <el-button :icon="MagicStick" type="primary" :disabled="!canGenerate" @click="generatePrompt">
          生成提示词并进入下一步
        </el-button>
      </div>
    </el-card>

    <section v-if="activeStep === 1 || activeStep === 7" class="workspace single-step">
      <el-card
        v-if="activeStep === 1"
        class="input-panel"
        :class="{ 'review-mode': isReviewingPrevious }"
        :inert="isReviewingPrevious || undefined"
        shadow="never"
      >
        <template #header>
          <div class="panel-title">
            <span>Figma MCP</span>
            <strong>第一步输入</strong>
          </div>
        </template>

        <el-form label-position="top">
          <el-form-item label="Figma MCP 内容">
            <el-input
              v-model="figmaMcpText"
              type="textarea"
              :rows="8"
              resize="vertical"
              placeholder="Implement this design from Figma.&#10;@https://www.figma.com/design/..."
            />
          </el-form-item>

          <div class="path-grid">
            <el-form-item label="WXML">
              <el-input v-model="wxmlPath" />
            </el-form-item>
            <el-form-item label="WXSS">
              <el-input v-model="wxssPath" />
            </el-form-item>
            <el-form-item label="JS">
              <el-input v-model="jsPath" />
            </el-form-item>
          </div>
        </el-form>

        <div class="contract-box">
          <div class="contract-title">
            <span>保留事件</span>
            <strong>login.js 接口点</strong>
          </div>
          <div class="event-list">
            <el-tag effect="plain">
              onAuthorizeTap
            </el-tag>
            <el-tag effect="plain">
              onAuthorizePhone
            </el-tag>
            <el-tag effect="plain">
              onDeny
            </el-tag>
            <el-tag effect="plain">
              onToggleAgree
            </el-tag>
            <el-tag effect="plain">
              agree
            </el-tag>
          </div>
        </div>
        <div class="step-actions">
          <el-button type="primary" :disabled="!figmaMcpText.trim()" @click="completeFigmaStep">
            确认设计输入并进入下一步
          </el-button>
        </div>
      </el-card>

      <el-card v-if="activeStep === 7" class="output-panel" shadow="never">
        <template #header>
          <div class="panel-title output-title">
            <div>
              <span>Prompt</span>
              <strong>复制到目标小程序项目</strong>
            </div>
            <el-button :icon="CopyDocument" type="primary" plain :disabled="!generatedPrompt" @click="copyPrompt">
              复制
            </el-button>
          </div>
        </template>

        <el-input
          :model-value="generatedPrompt"
          type="textarea"
          :rows="28"
          resize="none"
          readonly
          placeholder="点击“生成提示词”后，这里会出现可复制的完整提示词。"
        />
      </el-card>
    </section>
  </main>
</template>

<style scoped>
.bind-page {
  min-height: 100vh;
  background: #f4f7fb;
  color: #17212f;
  padding: 28px;
}

.page-head,
.step-strip,
.history-alert,
.parameter-section,
.workspace {
  max-width: 1440px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow,
.panel-title span,
.contract-title span {
  margin: 0 0 6px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 34px;
  line-height: 1.15;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.step-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.parameter-section {
  margin-top: 18px;
}

.authorize-bar,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.authorize-bar {
  margin-bottom: 14px;
}

.section-title {
  margin: 18px 0 12px;
}

.section-title span {
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.config-collapse {
  margin-top: 14px;
}

.flow-alert {
  margin-top: 14px;
}

.config-collapse pre {
  overflow: auto;
  margin: 0;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px;
}

.flow-list {
  margin: 0;
  padding-left: 20px;
  color: #334155;
  line-height: 1.8;
}

.credential-mode {
  margin-bottom: 14px;
}

.phone-api-workspace {
  display: grid;
  gap: 16px;
}

.parser-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.yaml-panel {
  display: grid;
  gap: 10px;
}

.textarea-label {
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.parser-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.phone-field-form {
  max-width: 620px;
}

.phone-field-form :deep(.el-select) {
  width: 100%;
}

.auth-api-block {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.interface-collapse {
  margin-top: 18px;
}

.interface-collapse :deep(.el-select) {
  width: 100%;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.step-item span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e5e7eb;
  color: #475569;
  font-weight: 900;
}

.step-item strong {
  color: #1f2937;
  font-size: 14px;
}

.step-item small {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
}

.step-item.done {
  border-color: #86efac;
  background: #f0fdf4;
}

.step-item.done span {
  background: #22c55e;
  color: #fff;
}

.step-item.locked {
  opacity: 0.48;
  cursor: not-allowed;
}

.step-item.active {
  border-color: #0f766e;
  background: #ecfdf5;
}

.step-item.active span {
  background: #0f766e;
  color: #fff;
}

.history-alert {
  margin-top: 18px;
}

.review-mode {
  opacity: 0.82;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(480px, 1.15fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}

.workspace.single-step {
  grid-template-columns: minmax(0, 1fr);
}

.input-panel,
.output-panel {
  border-radius: 8px;
}

.panel-title {
  display: flex;
  flex-direction: column;
}

.panel-title strong,
.contract-title strong {
  color: #17212f;
  font-size: 16px;
}

.output-title {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.path-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
}

.contract-box {
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.contract-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.event-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-textarea__inner) {
  font-family: 'DM Mono', Consolas, monospace;
  line-height: 1.55;
}

@media (max-width: 1080px) {
  .workspace,
  .step-strip,
  .parser-layout {
    grid-template-columns: 1fr;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .head-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .bind-page {
    padding: 16px;
  }

  h1 {
    font-size: 28px;
  }

  .output-title,
  .contract-title,
  .authorize-bar,
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
