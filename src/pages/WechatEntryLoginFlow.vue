<template>
  <main class="flow-page">
    <section class="topbar">
      <div>
        <p class="eyebrow">Huasheng WeApp Auth Flow</p>
        <h1>微信小程序进入与登录注册流程</h1>
        <p class="summary">
          将二维码扫码、正常进入、分享进入三种入口，与静默登录、手机号授权、注册建档、续登换 token 串成一张可交互流程视图。
        </p>
      </div>

      <div class="status-panel">
        <span class="status-label">当前模拟状态</span>
        <strong>{{ bindModeLabel }}</strong>
        <button type="button" class="state-toggle" @click="toggleBindMode">
          {{ bindMode === 'bound' ? '切到未绑定' : '切到已绑定' }}
        </button>
      </div>
    </section>

    <section class="scenario-switch" aria-label="入口方式">
      <button
        v-for="scenario in scenarios"
        :key="scenario.id"
        type="button"
        class="scenario-tab"
        :class="{ active: activeScenarioId === scenario.id }"
        @click="selectScenario(scenario.id)"
      >
        <span class="tab-icon">{{ scenario.icon }}</span>
        <span>
          <strong>{{ scenario.title }}</strong>
          <small>{{ scenario.param }}</small>
        </span>
      </button>
    </section>

    <section class="workspace">
      <aside class="left-panel">
        <div class="section-heading">
          <span>入口解析</span>
          <strong>{{ activeScenario.title }}</strong>
        </div>

        <div class="entry-preview">
          <div class="phone-frame">
            <div class="phone-bar"></div>
            <div class="mini-card">
              <span>{{ activeScenario.source }}</span>
              <strong>{{ activeScenario.title }}</strong>
              <code>{{ activeScenario.raw }}</code>
            </div>
            <div class="phone-actions">
              <span>{{ activeScenario.action }}</span>
            </div>
          </div>
        </div>

        <dl class="facts">
          <div v-for="fact in activeScenario.facts" :key="fact.label">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>

        <div class="jump-box">
          <span>最终目标页</span>
          <code>{{ activeScenario.target }}</code>
        </div>
      </aside>

      <section class="flow-board">
        <div class="board-toolbar">
          <div>
            <p class="eyebrow">Interactive Flow</p>
            <h2>{{ activeScenario.title }}路径</h2>
          </div>
          <label class="detail-switch">
            <input v-model="showTechDetail" type="checkbox" />
            <span>显示接口与字段</span>
          </label>
        </div>

        <div class="flow-lanes">
          <button
            v-for="node in activeNodes"
            :key="node.id"
            type="button"
            class="flow-node"
            :class="[node.kind, { active: selectedNodeId === node.id }]"
            @click="selectedNodeId = node.id"
          >
            <span class="node-index">{{ node.step }}</span>
            <span class="node-body">
              <strong>{{ node.title }}</strong>
              <small>{{ node.short }}</small>
            </span>
          </button>
        </div>

        <div class="node-detail">
          <div class="detail-main">
            <span class="detail-type">{{ selectedNode.kindLabel }}</span>
            <h3>{{ selectedNode.title }}</h3>
            <p>{{ selectedNode.detail }}</p>
          </div>

          <div v-if="selectedNode.endpoint" class="endpoint-chip">
            <span>{{ selectedNode.endpoint.method }}</span>
            <code>{{ selectedNode.endpoint.path }}</code>
          </div>

          <ul v-if="showTechDetail" class="field-list">
            <li v-for="item in selectedNode.fields" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
      </section>
    </section>

    <section class="decision-layout">
      <div class="decision-map">
        <div class="section-heading">
          <span>登录注册决策</span>
          <strong>静默探测后的分支</strong>
        </div>

        <div class="decision-row">
          <button
            v-for="branch in branchCards"
            :key="branch.id"
            type="button"
            class="branch-card"
            :class="{ active: activeBranchId === branch.id }"
            @click="activeBranchId = branch.id"
          >
            <span>{{ branch.badge }}</span>
            <strong>{{ branch.title }}</strong>
            <small>{{ branch.description }}</small>
          </button>
        </div>

        <div class="branch-detail">
          <h3>{{ activeBranch.title }}</h3>
          <ol>
            <li v-for="step in activeBranch.steps" :key="step">{{ step }}</li>
          </ol>
        </div>
      </div>

      <div class="endpoint-panel">
        <div class="section-heading">
          <span>接口清单</span>
          <strong>{{ activeEndpoint.name }}</strong>
        </div>

        <div class="endpoint-tabs">
          <button
            v-for="endpoint in endpoints"
            :key="endpoint.id"
            type="button"
            :class="{ active: activeEndpointId === endpoint.id }"
            @click="activeEndpointId = endpoint.id"
          >
            {{ endpoint.name }}
          </button>
        </div>

        <div class="endpoint-card">
          <div class="endpoint-title">
            <span>{{ activeEndpoint.method }}</span>
            <code>{{ activeEndpoint.path }}</code>
          </div>
          <p>{{ activeEndpoint.purpose }}</p>

          <div class="schema-grid">
            <div>
              <h4>请求字段</h4>
              <ul>
                <li v-for="field in activeEndpoint.request" :key="field.name">
                  <strong>{{ field.name }}</strong>
                  <span>{{ field.desc }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4>响应使用</h4>
              <ul>
                <li v-for="field in activeEndpoint.response" :key="field.name">
                  <strong>{{ field.name }}</strong>
                  <span>{{ field.desc }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="notes-strip">
      <article v-for="note in notes" :key="note.title">
        <span>{{ note.tag }}</span>
        <strong>{{ note.title }}</strong>
        <p>{{ note.text }}</p>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const bindMode = ref('unbound')
const activeScenarioId = ref('qr')
const selectedNodeId = ref('entry')
const activeEndpointId = ref('login')
const activeBranchId = ref('silent')
const showTechDetail = ref(true)

const scenarios = [
  {
    id: 'qr',
    icon: 'QR',
    title: '二维码扫码进入',
    source: '微信小程序码 / scene',
    param: 'scene=id_1,p_index,t_ABC',
    raw: 'scene=id_1,p_lawyer-detail,t_ABC',
    action: '扫码后先进入启动页',
    target: '/pages/lawyer-detail/lawyer-detail?id=1&p=lawyer-detail&t=ABC',
    facts: [
      { label: '入口特征', value: '存在 scene，需要 URL 解码' },
      { label: '参数规则', value: '逗号分段，下划线拆键值' },
      { label: '邀请码', value: 't 写入全局运行态' },
      { label: '页面定位', value: 'p 作为页面目录名，缺省回首页' },
    ],
  },
  {
    id: 'normal',
    icon: 'IN',
    title: '正常进入',
    source: '搜索 / 最近使用 / 桌面入口',
    param: '无 scene，且无 p',
    raw: 'options = {}',
    action: '打开 app.json 首个页面',
    target: '普通用户 /pages/index/index；律师 /pages/lawyer-case-plaza/lawyer-case-plaza',
    facts: [
      { label: '入口特征', value: '没有二维码或分享目标参数' },
      { label: '默认动作', value: '启动页静默探测身份' },
      { label: '用户默认页', value: '/pages/index/index' },
      { label: '律师默认页', value: '/pages/lawyer-case-plaza/lawyer-case-plaza' },
    ],
  },
  {
    id: 'share',
    icon: 'SH',
    title: '分享页面点击进入',
    source: '好友 / 群分享卡片',
    param: 'p=index&t=',
    raw: '/pages/start/start?t=&p=index',
    action: '点击分享卡片后进入启动页',
    target: '/pages/{p}?原始参数；p 无效时切到首页 tab',
    facts: [
      { label: '入口特征', value: '存在 p，表示分享目标页' },
      { label: '参数保留', value: '原始 query 会带回目标页' },
      { label: '兜底页面', value: 'p 无效时进入首页 tab' },
      { label: '注意点', value: '分享 p 更适合传完整页面路径' },
    ],
  },
]

const commonNodes = [
  {
    id: 'entry',
    step: '01',
    title: '入口参数识别',
    short: '判断 scene、p 或空参数',
    detail: '启动页接收微信传入的 options，先判断这是二维码、普通打开还是分享打开，并保留原始参数用于后续跳转。',
    kind: 'entry',
    kindLabel: '入口',
    fields: ['scene：二维码场景值', 'p：分享目标页', 't：邀请码或推荐关系'],
  },
  {
    id: 'silent',
    step: '02',
    title: '静默身份探测',
    short: 'wx.login 换 xcxCode',
    detail: '进入启动页后先清空旧 token，再调用微信登录能力获取一次性 xcxCode，用它向后端尝试登录。',
    kind: 'auth',
    kindLabel: '微信能力',
    endpoint: { method: 'POST', path: '/auth/login' },
    fields: ['xcxCode：wx.login 返回 code', 'clientId：应用客户端 ID', 'grantType：固定为 xcx'],
  },
  {
    id: 'token',
    step: '03',
    title: '登录态落盘',
    short: '保存 token 与绑定状态',
    detail: '如果后端返回 access_token，则保存 token、bindFlag、openid，并继续拉取用户资料。未返回 token 时不强制注册，先进入目标页。',
    kind: 'state',
    kindLabel: '状态',
    fields: ['access_token：后续请求授权', 'bindFlag：是否已有微信绑定关系', 'openid：当前微信身份标识'],
  },
  {
    id: 'dispatch',
    step: '04',
    title: '目标页面分发',
    short: '按入口类型跳转',
    detail: '二维码入口按 scene 还原后的页面跳转，普通入口进入默认业务页，分享入口进入分享指定页。',
    kind: 'route',
    kindLabel: '路由',
    fields: ['二维码：/pages/{p}/{p}?query', '普通进入：按身份进入默认页', '分享：/pages/{p}?query'],
  },
  {
    id: 'guard',
    step: '05',
    title: '受保护接口拦截',
    short: '401 引导授权',
    detail: '目标页如果调用受保护接口且后端返回 401，会根据绑定状态提示登录或登录过期，并引导到授权页或启动页。',
    kind: 'guard',
    kindLabel: '拦截',
    fields: ['未绑定：跳转手机号授权页', '已绑定：跳转启动页重新静默登录'],
  },
  {
    id: 'phone',
    step: '06',
    title: '手机号授权换取',
    short: 'getPhoneNumber code 换手机号',
    detail: '用户勾选协议后点击手机号授权按钮，微信返回手机号授权 code，后端用该 code 换取 purePhoneNumber。',
    kind: 'phone',
    kindLabel: '授权',
    endpoint: { method: 'GET', path: '/auth/get-phone' },
    fields: ['code：手机号授权 code', 'clientType：当前固定为 1', 'purePhoneNumber：注册手机号'],
  },
  {
    id: 'register',
    step: '07',
    title: '账户建档或续登',
    short: '按 bindFlag 选择接口',
    detail: '未绑定时走小程序注册，已绑定时重新登录。注册接口如果提示已绑定第三方用户，会重新获取微信 code 后改走登录。',
    kind: 'register',
    kindLabel: '分支',
    endpoint: bindMode.value === 'bound'
      ? { method: 'POST', path: '/auth/login' }
      : { method: 'POST', path: '/auth/xcx-register' },
    fields: ['未绑定：/auth/xcx-register', '已绑定：/auth/login', '注册冲突：重新拿 code 后登录'],
  },
  {
    id: 'return',
    step: '08',
    title: '回到原目标页面',
    short: '保存用户资料后继续业务',
    detail: '注册或登录成功后保存 token，拉取用户资料，再根据进入授权页时携带的原始参数回到对应目标页面。',
    kind: 'done',
    kindLabel: '完成',
    fields: ['保存 token', '拉取 /system/user/profile', '按原入口参数跳回业务页'],
  },
]

const scenarioExtraNodes = {
  qr: [
    {
      id: 'qr-restore',
      step: '01A',
      title: '二维码场景还原',
      short: 'scene 转 query',
      detail: '二维码 scene 会被 URL 解码，并从 id_1,p_index,t_ABC 这类短串还原为 id=1&p=index&t=ABC。',
      kind: 'entry',
      kindLabel: '解析',
      fields: ['decodeURIComponent(scene)', '按逗号拆段', '按下划线拆键值'],
    },
  ],
  normal: [
    {
      id: 'normal-default',
      step: '04A',
      title: '默认业务页选择',
      short: '按身份落页',
      detail: '没有目标参数时，普通用户进入首页，律师身份进入案源广场。',
      kind: 'route',
      kindLabel: '默认页',
      fields: ['普通用户：首页', '律师：案源广场'],
    },
  ],
  share: [
    {
      id: 'share-keep',
      step: '01A',
      title: '分享参数保留',
      short: 'p 与 t 原样带回',
      detail: '分享进入会把 p、t 等 query 保留下来，静默探测后再带回分享目标页。',
      kind: 'entry',
      kindLabel: '分享',
      fields: ['p：分享目标页', 't：邀请码或推荐关系', 'p 无效：切首页 tab'],
    },
  ],
}

const endpoints = [
  {
    id: 'login',
    name: '登录方法',
    method: 'POST',
    path: '/auth/login',
    purpose: '用微信登录 code 尝试换取系统 token，判断当前微信身份是否已经绑定系统账号。',
    request: [
      { name: 'xcxCode', desc: 'wx.login 返回的一次性 code' },
      { name: 'clientId', desc: '全局配置中的应用客户端 ID' },
      { name: 'grantType', desc: '当前固定为 xcx' },
    ],
    response: [
      { name: 'access_token', desc: '写入全局 token' },
      { name: 'bindFlag', desc: '判断是否已有绑定关系' },
      { name: 'openid', desc: '保存当前微信身份' },
    ],
  },
  {
    id: 'phone',
    name: '获得小程序手机号',
    method: 'GET',
    path: '/auth/get-phone',
    purpose: '用微信手机号授权按钮返回的 code 换取用户真实手机号。',
    request: [
      { name: 'code', desc: 'getPhoneNumber 返回的授权 code' },
      { name: 'clientType', desc: '当前页面固定传 1' },
    ],
    response: [
      { name: 'purePhoneNumber', desc: '写入 phonenumber 并缓存到本地' },
    ],
  },
  {
    id: 'register',
    name: '小程序注册',
    method: 'POST',
    path: '/auth/xcx-register',
    purpose: '未绑定微信身份时，用手机号和新的微信登录 code 创建系统账号并直接获得 token。',
    request: [
      { name: 'clientId', desc: '全局配置中的应用客户端 ID' },
      { name: 'grantType', desc: '当前固定为 xcx' },
      { name: 'xcxCode', desc: 'wx.login 返回的新 code' },
      { name: 'phonenumber', desc: '/auth/get-phone 换到的手机号' },
      { name: 'parentId', desc: '预留邀请或上级关系字段' },
    ],
    response: [
      { name: 'access_token', desc: '注册成功后作为登录 token' },
      { name: 'bindFlag', desc: '更新当前绑定状态' },
    ],
  },
]

const branchCards = [
  {
    id: 'silent',
    badge: 'A',
    title: '已有 token',
    description: '静默登录成功，直接进入业务页',
    steps: [
      '保存 access_token、bindFlag、openid。',
      '拉取用户资料。',
      '根据二维码、普通进入、分享进入分发目标页面。',
    ],
  },
  {
    id: 'unbound',
    badge: 'B',
    title: '未绑定用户',
    description: '目标页触发 401 后授权手机号注册',
    steps: [
      '进入手机号授权页。',
      '用户勾选协议并授权手机号。',
      '调用 GET /auth/get-phone 换 purePhoneNumber。',
      '重新 wx.login 获取新的 xcxCode。',
      '调用 POST /auth/xcx-register 建档并获得 token。',
    ],
  },
  {
    id: 'expired',
    badge: 'C',
    title: '已绑定但过期',
    description: '重新换 token，不需要重新注册',
    steps: [
      '接口返回 401，且绑定状态为已绑定。',
      '回到启动页重新进行静默身份探测。',
      '调用 POST /auth/login 换新 token。',
      '拉取用户资料并回到原目标页面。',
    ],
  },
]

const notes = [
  {
    tag: 'Code',
    title: '两个 code 不要混用',
    text: 'wx.login 的 code 用于登录或注册，手机号授权按钮返回的 code 只用于 /auth/get-phone。',
  },
  {
    tag: 'Route',
    title: '二维码与分享拼接不同',
    text: '二维码当前按 /pages/{p}/{p} 拼接，分享当前按 /pages/{p} 拼接。',
  },
  {
    tag: 'Auth',
    title: '注册发生在授权页',
    text: '启动页只做静默探测，没有 token 时不会立刻强制注册。',
  },
]

const activeScenario = computed(() => scenarios.find((item) => item.id === activeScenarioId.value) || scenarios[0])

const activeNodes = computed(() => {
  const extra = scenarioExtraNodes[activeScenarioId.value] || []
  return [commonNodes[0], ...extra, ...commonNodes.slice(1)].map((node) => {
    if (node.id !== 'register') return node
    return {
      ...node,
      endpoint: bindMode.value === 'bound'
        ? { method: 'POST', path: '/auth/login' }
        : { method: 'POST', path: '/auth/xcx-register' },
      short: bindMode.value === 'bound' ? '已绑定时续登' : '未绑定时建档',
    }
  })
})

const selectedNode = computed(() => activeNodes.value.find((item) => item.id === selectedNodeId.value) || activeNodes.value[0])
const activeEndpoint = computed(() => endpoints.find((item) => item.id === activeEndpointId.value) || endpoints[0])
const activeBranch = computed(() => branchCards.find((item) => item.id === activeBranchId.value) || branchCards[0])
const bindModeLabel = computed(() => bindMode.value === 'bound' ? '已绑定：续登换 token' : '未绑定：手机号注册建档')

watch(activeScenarioId, () => {
  selectedNodeId.value = activeNodes.value[0].id
})

function selectScenario(id) {
  activeScenarioId.value = id
}

function toggleBindMode() {
  bindMode.value = bindMode.value === 'bound' ? 'unbound' : 'bound'
  activeBranchId.value = bindMode.value === 'bound' ? 'expired' : 'unbound'
}
</script>

<style scoped>
:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

.flow-page {
  min-height: 100vh;
  padding: 28px;
  color: #172033;
  background:
    linear-gradient(135deg, rgba(243, 247, 252, 0.95), rgba(255, 251, 244, 0.92)),
    #f7f8fb;
  font-family:
    Inter,
    "PingFang SC",
    "Microsoft YaHei",
    Arial,
    sans-serif;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #47647f;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
h3,
h4,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  font-size: 34px;
  line-height: 1.18;
}

.summary {
  max-width: 820px;
  margin-bottom: 0;
  color: #526070;
  font-size: 16px;
  line-height: 1.75;
}

.status-panel,
.left-panel,
.flow-board,
.decision-map,
.endpoint-panel,
.notes-strip article {
  border: 1px solid rgba(139, 153, 171, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 48px rgba(42, 59, 84, 0.08);
}

.status-panel {
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 22px;
}

.status-label {
  color: #6d7a89;
  font-size: 13px;
}

.status-panel strong {
  font-size: 20px;
}

button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.state-toggle {
  width: 100%;
  min-height: 42px;
  border-radius: 6px;
  color: #fff;
  background: #176b87;
}

.scenario-switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.scenario-tab {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 82px;
  padding: 16px;
  border: 1px solid rgba(139, 153, 171, 0.28);
  border-radius: 8px;
  color: #243044;
  background: #fff;
  text-align: left;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.scenario-tab:hover,
.scenario-tab.active {
  transform: translateY(-2px);
  border-color: #176b87;
  box-shadow: 0 14px 28px rgba(23, 107, 135, 0.14);
}

.tab-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  color: #fff;
  background: #233f5f;
  font-weight: 800;
}

.scenario-tab small {
  display: block;
  margin-top: 5px;
  color: #6b7786;
}

.workspace {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.left-panel,
.flow-board,
.decision-map,
.endpoint-panel {
  padding: 18px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.section-heading span {
  color: #6d7a89;
  font-size: 13px;
}

.section-heading strong {
  text-align: right;
}

.entry-preview {
  display: grid;
  place-items: center;
  padding: 16px 0 22px;
}

.phone-frame {
  width: min(100%, 230px);
  min-height: 350px;
  padding: 18px;
  border: 8px solid #202b3a;
  border-radius: 28px;
  background: #f9fbfd;
}

.phone-bar {
  width: 72px;
  height: 6px;
  margin: 0 auto 30px;
  border-radius: 999px;
  background: #cfd7e1;
}

.mini-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  color: #172033;
  background: #fff;
  box-shadow: 0 12px 24px rgba(32, 43, 58, 0.12);
}

.mini-card span,
.phone-actions {
  color: #687789;
  font-size: 12px;
}

code {
  white-space: normal;
  word-break: break-word;
  color: #8b3d25;
  font-family: "SFMono-Regular", Consolas, monospace;
}

.phone-actions {
  margin-top: 18px;
  padding: 12px;
  border-radius: 8px;
  background: #eef6f7;
  text-align: center;
}

.facts {
  display: grid;
  gap: 10px;
  margin: 0;
}

.facts div {
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
}

.facts dt {
  margin-bottom: 5px;
  color: #607084;
  font-size: 12px;
}

.facts dd {
  margin: 0;
  line-height: 1.55;
}

.jump-box {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding: 14px;
  border-radius: 8px;
  background: #fff4e8;
}

.jump-box span {
  color: #8a5a2b;
  font-weight: 700;
}

.board-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 12px;
}

.board-toolbar h2 {
  margin-bottom: 0;
  font-size: 22px;
}

.detail-switch {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #536273;
  font-size: 14px;
}

.flow-lanes {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.flow-node {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 92px;
  padding: 12px;
  border: 1px solid rgba(139, 153, 171, 0.26);
  border-radius: 8px;
  background: #fff;
  text-align: left;
}

.flow-node::after {
  position: absolute;
  right: -10px;
  top: 50%;
  width: 8px;
  height: 2px;
  background: #b9c4d1;
  content: "";
}

.flow-node:nth-child(4n)::after,
.flow-node:last-child::after {
  display: none;
}

.flow-node.active {
  border-color: #176b87;
  box-shadow: 0 12px 24px rgba(23, 107, 135, 0.16);
}

.node-index {
  display: grid;
  place-items: center;
  height: 42px;
  border-radius: 8px;
  color: #fff;
  background: #233f5f;
  font-weight: 800;
}

.flow-node.phone .node-index {
  background: #2f7d5c;
}

.flow-node.register .node-index {
  background: #a75f22;
}

.flow-node.guard .node-index {
  background: #943b51;
}

.node-body strong,
.node-body small {
  display: block;
}

.node-body small {
  margin-top: 5px;
  color: #6d7a89;
  line-height: 1.35;
}

.node-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 14px;
  align-items: start;
  padding: 18px;
  border-radius: 8px;
  background: #f5f8fb;
}

.detail-type {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  color: #176b87;
  background: #dff1f4;
  font-size: 12px;
  font-weight: 700;
}

.detail-main h3 {
  margin-bottom: 8px;
}

.detail-main p {
  margin-bottom: 0;
  color: #4f5e6f;
  line-height: 1.7;
}

.endpoint-chip {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
}

.endpoint-chip span,
.endpoint-title span {
  width: fit-content;
  padding: 5px 8px;
  border-radius: 6px;
  color: #fff;
  background: #2f7d5c;
  font-size: 12px;
  font-weight: 800;
}

.field-list {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.field-list li {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  color: #536273;
  line-height: 1.5;
}

.decision-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 16px;
  margin-top: 16px;
}

.decision-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.branch-card {
  display: grid;
  gap: 8px;
  min-height: 148px;
  padding: 14px;
  border: 1px solid rgba(139, 153, 171, 0.28);
  border-radius: 8px;
  background: #fff;
  text-align: left;
}

.branch-card.active {
  border-color: #a75f22;
  box-shadow: 0 12px 24px rgba(167, 95, 34, 0.14);
}

.branch-card span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #fff;
  background: #a75f22;
  font-weight: 800;
}

.branch-card small {
  color: #657386;
  line-height: 1.5;
}

.branch-detail {
  margin-top: 14px;
  padding: 16px;
  border-radius: 8px;
  background: #f7f3ee;
}

.branch-detail ol {
  margin: 0;
  padding-left: 22px;
  color: #4e5c6b;
  line-height: 1.85;
}

.endpoint-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.endpoint-tabs button {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  color: #435267;
  background: #eef2f6;
}

.endpoint-tabs button.active {
  color: #fff;
  background: #176b87;
}

.endpoint-card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f8fb;
}

.endpoint-title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.endpoint-card p {
  color: #4f5e6f;
  line-height: 1.7;
}

.schema-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.schema-grid h4 {
  margin-bottom: 10px;
}

.schema-grid ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.schema-grid li {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
  background: #fff;
}

.schema-grid li span {
  color: #657386;
  font-size: 13px;
  line-height: 1.45;
}

.notes-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.notes-strip article {
  padding: 16px;
}

.notes-strip span {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  color: #fff;
  background: #233f5f;
  font-size: 12px;
  font-weight: 800;
}

.notes-strip strong {
  display: block;
  margin-bottom: 8px;
}

.notes-strip p {
  margin-bottom: 0;
  color: #586779;
  line-height: 1.65;
}

@media (max-width: 1180px) {
  .topbar,
  .workspace,
  .decision-layout {
    grid-template-columns: 1fr;
  }

  .flow-lanes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flow-node:nth-child(4n)::after {
    display: block;
  }

  .flow-node:nth-child(2n)::after,
  .flow-node:last-child::after {
    display: none;
  }
}

@media (max-width: 760px) {
  .flow-page {
    padding: 16px;
  }

  h1 {
    font-size: 28px;
  }

  .scenario-switch,
  .flow-lanes,
  .decision-row,
  .schema-grid,
  .notes-strip,
  .field-list,
  .node-detail {
    grid-template-columns: 1fr;
  }

  .flow-node::after {
    display: none;
  }

  .board-toolbar,
  .section-heading,
  .endpoint-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
