<template>
  <main class="builder-page">
    <section class="header">
      <div>
        <p class="eyebrow">Reusable WeChat Auth Flow</p>
        <h1>启动页注册登录流程配置</h1>
        <p class="intro">
          先搭建正常进入场景的第一步：页面显示时执行 onShow，调用 getCode，再把 wx.login 返回的 code 写入参数池。
        </p>
      </div>

      <el-card class="entry-panel" shadow="never">
        <span class="panel-label">已启用入口</span>
        <strong>{{ enabledEntryModeLabels }}</strong>
        <p>同一个项目可以同时支持正常进入、二维码进入和分享进入；后续登录链路共用同一套配置。</p>
      </el-card>
    </section>

    <el-checkbox-group v-model="enabledEntryModeIds" class="entry-tabs" size="large">
      <el-checkbox-button v-for="entry in entryModes" :key="entry.id" :label="entry.id">
        {{ entry.step }} {{ entry.title }} · {{ entry.status }}
      </el-checkbox-button>
    </el-checkbox-group>

    <section class="workspace">
      <el-card class="flow-board" shadow="never">
        <div class="board-head">
          <div>
            <p class="eyebrow">Flow Graph</p>
            <h2>正常进入的启动页流程</h2>
            <el-tag class="start-path" type="info">默认启动页：{{ startPage.path }}</el-tag>
          </div>
          <div class="flow-progress">
            <span>{{ completedNodeIds.length }} / {{ flowNodes.length }} 已完成</span>
            <el-progress :percentage="flowProgressPercentage" :show-text="false" />
          </div>
          <el-button
            v-if="!nodeNeedsCardAction(currentNode.id)"
            type="primary"
            @click="runCurrentStep"
          >
            {{ currentStepButtonText }}
          </el-button>
        </div>

        <div class="flow-steps">
          <el-card
            v-for="node in flowNodes"
            :key="node.id"
            class="flow-node"
            shadow="never"
            role="button"
            tabindex="0"
            :class="[
              node.kind,
              {
                active: selectedNodeId === node.id,
                done: completedNodeIds.includes(node.id),
                locked: getNodeIndex(node.id) > currentNodeIndex,
              },
            ]"
            @click="selectNode(node.id)"
            @keyup.enter="selectNode(node.id)"
          >
            <div class="node-top">
              <span class="node-index">{{ node.order }}</span>
              <el-tag class="node-kind" effect="plain">{{ node.tag }}</el-tag>
            </div>
            <span>
              <strong>{{ node.title }}</strong>
              <small>{{ node.summary }}</small>
            </span>
            <el-tag class="node-status" :type="getNodeStatusType(node.id)" effect="light">
              {{ getNodeStatusLabel(node.id) }}
            </el-tag>
            <el-button
              v-if="node.id === 'wx-login'"
              class="node-action"
              type="success"
              :disabled="currentNode.id !== 'wx-login' || completedNodeIds.includes('wx-login')"
              @click.stop="runWxLoginStep"
            >
              {{ completedNodeIds.includes('wx-login') ? '已加入字段池' : '获取 code 并放入字段池' }}
            </el-button>
            <el-button
              v-if="node.id === 'login-api'"
              class="node-action"
              type="success"
              :disabled="currentNode.id !== 'login-api' && !completedNodeIds.includes('login-api')"
              @click.stop="focusApiParser"
            >
              {{ completedNodeIds.includes('login-api') ? '接口解析区' : '去解析登录接口' }}
            </el-button>
            <el-button
              v-if="node.id === 'app-public-map'"
              class="node-action"
              type="success"
              :disabled="currentNode.id !== 'app-public-map' && !completedNodeIds.includes('app-public-map')"
              @click.stop="focusAppPublicMapping"
            >
              {{ completedNodeIds.includes('app-public-map') ? '映射配置区' : '配置 app.public' }}
            </el-button>
            <el-button
              v-if="node.id === 'user-info-api'"
              class="node-action"
              type="success"
              :disabled="currentNode.id !== 'user-info-api' && !completedNodeIds.includes('user-info-api')"
              @click.stop="focusUserInfoParser"
            >
              {{ completedNodeIds.includes('user-info-api') ? '用户接口解析区' : '解析用户资料接口' }}
            </el-button>
          </el-card>
        </div>

        <el-card class="node-detail" shadow="never">
          <div>
            <el-tag class="detail-tag" type="success">{{ selectedNode.tag }}</el-tag>
            <h3>{{ selectedNode.title }}</h3>
            <p>{{ selectedNode.detail }}</p>
          </div>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="当前状态">{{ selectedNodeStatus }}</el-descriptions-item>
            <el-descriptions-item label="触发方式">{{ selectedNode.trigger }}</el-descriptions-item>
            <el-descriptions-item label="产出参数">{{ selectedNode.output }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-card>
    </section>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Entry Invite Code</span>
        <strong>入口邀请码配置</strong>
      </div>

      <el-alert
        title="二维码进入和分享进入通常会携带 inviteCode。解析到后先写入 app.public.inviteCode，后续注册接口如需邀请码再从这里取。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-table class="section-table" :data="entryInviteCodeSettings" border>
        <el-table-column prop="entryName" label="入口方式" min-width="140" />
        <el-table-column label="携带 inviteCode" width="150">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="来源字段别名" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.sourceAliasesText" :disabled="!row.enabled" placeholder="例如：t,inviteCode" />
          </template>
        </el-table-column>
        <el-table-column label="标准字段名" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.standardName" disabled />
          </template>
        </el-table-column>
        <el-table-column label="写入位置" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.writeTo" :disabled="!row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="用途" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.usedByText" :disabled="!row.enabled" placeholder="例如：register" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Parameter Pool</span>
        <strong>字段池：自动获取的参数</strong>
      </div>

      <el-table :data="parameterPool" border empty-text="点击第 4 步卡片按钮后，微信小程序获取的 code 会加入这里">
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
        <el-table-column label="来源" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.source" disabled />
          </template>
        </el-table-column>
        <el-table-column label="绑定表达式" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.binding" disabled />
          </template>
        </el-table-column>
        <el-table-column label="示例值" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.example" disabled />
          </template>
        </el-table-column>
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
        <el-collapse-item title="当前可复用配置预览" name="config">
          <pre><code>{{ configPreview }}</code></pre>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card ref="apiParserSection" class="api-parser-section" shadow="never">
      <div class="section-title">
        <span>OpenAPI YAML</span>
        <strong>登录接口文档解析</strong>
      </div>

      <div class="parser-layout">
        <div class="yaml-panel">
          <label class="textarea-label" for="login-api-yaml">粘贴后端给的登录接口 YAML</label>
          <el-input
            id="login-api-yaml"
            v-model="loginApiYaml"
            type="textarea"
            :rows="14"
            :disabled="!canParseApi"
            placeholder="把 /auth/login 的 OpenAPI YAML 粘贴到这里"
          />
          <div class="parser-actions">
            <el-button
              type="primary"
              :disabled="!canParseApi || !loginApiYaml.trim()"
              @click="parseLoginApiYaml"
            >
              解析接口文档
            </el-button>
            <el-tag type="info">{{ parserStatus }}</el-tag>
          </div>
        </div>

        <el-card class="api-summary" shadow="never">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="接口路径">{{ parsedApi.method }} {{ parsedApi.path }}</el-descriptions-item>
            <el-descriptions-item label="接口名称">{{ parsedApi.summary }}</el-descriptions-item>
          </el-descriptions>
          <p>解析成功后，会生成后端请求参数池和后端响应参数池。请求参数的取值可以从自动参数池或响应参数池中选择，也可以手动说明来源。</p>
        </el-card>
      </div>
    </el-card>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Request Pool</span>
        <strong>字段池：提交给后端的请求参数</strong>
      </div>

      <el-empty v-if="apiInterfaces.length === 0" description="解析接口 YAML 后，会按接口分组生成请求参数" />
      <el-collapse v-else class="interface-collapse">
        <el-collapse-item v-for="api in apiInterfaces" :key="api.id" :name="`request-${api.id}`">
          <template #title>
            <span class="interface-title">{{ api.method }} {{ api.path }} · {{ api.summary }}</span>
          </template>
          <el-table :data="api.requestPool" border>
            <el-table-column prop="name" label="参数名" min-width="140" />
            <el-table-column prop="type" label="类型" width="110" />
            <el-table-column label="必填" width="90">
              <template #default="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'">{{ row.required ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="180" />
            <el-table-column label="取值方式" width="150">
              <template #default="{ row }">
                <el-select v-model="row.sourceMode">
                  <el-option label="从字段池选择" value="pool" />
                  <el-option label="手动说明来源" value="custom" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="取值" min-width="260">
              <template #default="{ row }">
                <el-select
                  v-if="row.sourceMode === 'pool'"
                  v-model="row.sourceKey"
                  filterable
                  clearable
                  placeholder="请选择字段"
                >
                  <el-option v-for="option in mergedSourceOptions" :key="option.key" :label="option.label" :value="option.key" />
                </el-select>
                <el-input v-else v-model="row.customSource" placeholder="例如：从 app.public.config.clientId 获取" />
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Response Pool</span>
        <strong>字段池：后端返回的响应参数</strong>
      </div>

      <el-empty v-if="apiInterfaces.length === 0" description="解析接口 YAML 后，会按接口分组生成响应参数" />
      <el-collapse v-else class="interface-collapse">
        <el-collapse-item v-for="api in apiInterfaces" :key="api.id" :name="`response-${api.id}`">
          <template #title>
            <span class="interface-title">{{ api.method }} {{ api.path }} · {{ api.summary }}</span>
          </template>
          <el-table :data="api.responsePool" border>
            <el-table-column prop="path" label="响应路径" min-width="180" />
            <el-table-column prop="name" label="字段名" min-width="140" />
            <el-table-column prop="type" label="类型" width="110" />
            <el-table-column prop="description" label="说明" min-width="220" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-card ref="appPublicSection" class="param-section" shadow="never">
      <div class="section-title">
        <span>App Public Mapping</span>
        <strong>登录返回值写入 app.public</strong>
      </div>

      <el-alert
        title="选择登录接口返回的字段，设置它们写入 app.public 时使用的参数名。若返回 token，则继续 getUserInfo；未返回 token 时不强制注册，直接 linkTo。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-empty v-if="appPublicMappings.length === 0" description="先解析登录接口 YAML，系统会根据响应字段生成可选映射" />
      <el-table v-else class="section-table" :data="appPublicMappings" border>
        <el-table-column label="写入" width="86">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
          </template>
        </el-table-column>
        <el-table-column prop="responsePath" label="响应字段" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="180" />
        <el-table-column label="app.public 参数名" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.publicName" :disabled="!row.enabled" placeholder="例如：token" />
          </template>
        </el-table-column>
        <el-table-column label="写入表达式" min-width="220">
          <template #default="{ row }">
            <el-input :model-value="`app.public.${row.publicName || '未设置'} = res.${row.responsePath}`" disabled />
          </template>
        </el-table-column>
      </el-table>

      <div class="section-actions">
        <el-button
          type="primary"
          :disabled="currentNode.id !== 'app-public-map' || appPublicMappings.length === 0"
          @click="completeAppPublicMapping"
        >
          完成 app.public 映射配置
        </el-button>
      </div>
    </el-card>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Token Branch</span>
        <strong>登录后分支规则</strong>
      </div>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="返回 token">
          保存已勾选的 app.public 字段后，继续调用 getUserInfo 拉取用户资料。
        </el-descriptions-item>
        <el-descriptions-item label="未返回 token">
          不强制注册，先进入目标页，调用 linkTo。
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card ref="userInfoParserSection" class="api-parser-section" shadow="never">
      <div class="section-title">
        <span>UserInfo YAML</span>
        <strong>获取用户信息接口解析</strong>
      </div>

      <div class="parser-layout">
        <div class="yaml-panel">
          <label class="textarea-label" for="user-info-api-yaml">粘贴获取用户信息接口 YAML</label>
          <el-input
            id="user-info-api-yaml"
            v-model="userInfoApiYaml"
            type="textarea"
            :rows="12"
            :disabled="!canParseUserInfoApi"
            placeholder="把 /system/user/profile 等用户信息接口 OpenAPI YAML 粘贴到这里"
          />
          <div class="parser-actions">
            <el-button
              type="primary"
              :disabled="!canParseUserInfoApi || !userInfoApiYaml.trim()"
              @click="parseUserInfoApiYaml"
            >
              解析用户信息接口
            </el-button>
            <el-tag type="info">{{ userInfoParserStatus }}</el-tag>
          </div>
        </div>

        <el-card class="api-summary" shadow="never">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="接口路径">{{ parsedUserInfoApi.method }} {{ parsedUserInfoApi.path }}</el-descriptions-item>
            <el-descriptions-item label="接口名称">{{ parsedUserInfoApi.summary }}</el-descriptions-item>
            <el-descriptions-item label="固定写入">app.public.userInfo = res.data</el-descriptions-item>
            <el-descriptions-item label="完成后">调用 linkTo()</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-card>

    <el-card class="param-section" shadow="never">
      <div class="section-title">
        <span>Prompt Generator</span>
        <strong>生成给 AI Agent 的复用提示词</strong>
      </div>

      <el-alert
        title="配置完成后生成提示词，把它复制到目标项目的 AI Agent 中，并让 Agent 结合 skill 执行 start.js 正常进入自动登录逻辑。"
        type="success"
        :closable="false"
        show-icon
      />

      <div class="section-actions">
        <el-button type="primary" @click="generateAgentPrompt">生成提示词</el-button>
        <el-button :disabled="!agentPrompt" @click="copyAgentPrompt">复制提示词</el-button>
        <el-tag v-if="copyStatus" type="success">{{ copyStatus }}</el-tag>
      </div>

      <el-input
        v-model="agentPrompt"
        type="textarea"
        :rows="18"
        placeholder="点击生成提示词后，这里会出现可复制给 AI Agent 的完整 Prompt。"
      />
    </el-card>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const enabledEntryModeIds = ref(['normal', 'qrcode', 'share'])
const selectedNodeId = ref('enter')
const currentNodeIndex = ref(0)
const completedNodeIds = ref([])
const apiParserSection = ref(null)
const appPublicSection = ref(null)
const userInfoParserSection = ref(null)
const loginApiYaml = ref('')
const userInfoApiYaml = ref('')
const parserStatus = ref('等待粘贴 YAML')
const userInfoParserStatus = ref('等待粘贴 YAML')
const agentPrompt = ref('')
const copyStatus = ref('')

const parsedApi = reactive({
  method: '-',
  path: '-',
  summary: '未解析',
})

const parsedUserInfoApi = reactive({
  method: '-',
  path: '-',
  summary: '未解析',
})

const entryModes = [
  {
    id: 'normal',
    step: '01',
    title: '正常进入',
    status: '当前先做',
    description: '用户从微信搜索、最近使用、桌面入口等方式进入小程序，没有 scene，也没有分享 p 参数。',
  },
  {
    id: 'qrcode',
    step: '02',
    title: '二维码进入',
    status: '后续扩展',
    description: '后续接入 scene 解码和目标页面还原。',
  },
  {
    id: 'share',
    step: '03',
    title: '分享进入',
    status: '后续扩展',
    description: '后续接入 p、t 等分享参数，并跳回分享目标页。',
  },
]

const startPage = reactive({
  path: 'pages/start/start',
})

const flowNodes = [
  {
    id: 'enter',
    order: '1',
    kind: 'entry',
    tag: '入口',
    title: '正常进入小程序',
    summary: '进入 pages/start/start',
    detail: '当前阶段只处理无 scene、无 p 的普通入口，后续二维码和分享入口可以复用同一套节点模型。',
    trigger: '用户打开小程序',
    output: 'entryType = normal',
  },
  {
    id: 'on-show',
    order: '2',
    kind: 'lifecycle',
    tag: '生命周期',
    title: 'onShow()',
    summary: '启动页显示时触发',
    detail: 'start 页面显示后，先进入生命周期节点。这个节点负责发起第一步动作 getCode。',
    trigger: 'Page.onShow',
    output: '调用 getCode()',
  },
  {
    id: 'get-code',
    order: '3',
    kind: 'action',
    tag: '方法',
    title: 'getCode()',
    summary: '调用微信登录能力',
    detail: 'getCode 内部调用 wx.login，等待微信返回一次性登录凭证。',
    trigger: 'onShow 自动调用',
    output: '等待 wx.login success',
  },
  {
    id: 'wx-login',
    order: '4',
    kind: 'output',
    tag: '参数入池',
    title: 'wx.login 返回 code',
    summary: '把 code 加入参数列表池',
    detail: '拿到 res.code 后，将它作为可配置参数写入参数池。不同项目如果字段名不同，可以在参数池里调整变量名和绑定表达式。',
    trigger: 'wx.login success',
    output: 'code / xcxCode',
  },
  {
    id: 'login-api',
    order: '5',
    kind: 'api',
    tag: '接口解析',
    title: '解析后端登录接口',
    summary: '粘贴 YAML 并生成请求/响应参数池',
    detail: '用户把后端给的登录接口 OpenAPI YAML 粘贴到解析区域，点击解析后生成提交给后端的请求参数池和后端响应参数池。',
    trigger: '用户点击解析接口文档',
    output: 'requestPool / responsePool',
  },
  {
    id: 'app-public-map',
    order: '6',
    kind: 'mapping',
    tag: '状态写入',
    title: '配置 app.public 字段',
    summary: '选择登录返回值写入全局状态',
    detail: '拿到登录接口返回值后，选择哪些响应字段需要写入 app.public，并设置每个字段在 app.public 里的参数名。',
    trigger: '登录接口返回 res',
    output: 'app.public.*',
  },
  {
    id: 'token-branch',
    order: '7',
    kind: 'decision',
    tag: '分支判断',
    title: '判断是否返回 token',
    summary: '有 token 拉用户资料，无 token 先 linkTo',
    detail: '如果后端返回 token，则继续调用 getUserInfo 拉取用户资料；如果未返回 token，不强制注册，先进入目标页，调用 linkTo。',
    trigger: 'app.public token 写入后',
    output: 'getUserInfo() / linkTo()',
  },
  {
    id: 'user-info-api',
    order: '8',
    kind: 'api',
    tag: '接口解析',
    title: '解析获取用户信息接口',
    summary: '解析 getUserInfo 使用的接口',
    detail: '粘贴获取用户信息接口 OpenAPI YAML，解析响应字段。接口成功后把 res.data 存到 app.public.userInfo，再调用 linkTo。',
    trigger: 'token 存在时调用 getUserInfo',
    output: 'app.public.userInfo / linkTo()',
  },
]

const parameterPool = reactive([])
const apiInterfaces = reactive([])
const appPublicMappings = reactive([])
const entryInviteCodeSettings = reactive([
  {
    entryType: 'normal',
    entryName: '正常进入',
    enabled: false,
    standardName: 'inviteCode',
    sourceAliasesText: 't,inviteCode',
    writeTo: 'app.public.inviteCode',
    usedByText: 'register',
  },
  {
    entryType: 'qrcode',
    entryName: '二维码进入',
    enabled: true,
    standardName: 'inviteCode',
    sourceAliasesText: 't,inviteCode',
    writeTo: 'app.public.inviteCode',
    usedByText: 'register',
  },
  {
    entryType: 'share',
    entryName: '分享进入',
    enabled: true,
    standardName: 'inviteCode',
    sourceAliasesText: 't,inviteCode',
    writeTo: 'app.public.inviteCode',
    usedByText: 'register',
  },
])

const enabledEntryModeLabels = computed(() => {
  return entryModes
    .filter((entry) => enabledEntryModeIds.value.includes(entry.id))
    .map((entry) => entry.title)
    .join('、') || '未选择'
})

const selectedNode = computed(() => {
  return flowNodes.find((node) => node.id === selectedNodeId.value) || flowNodes[0]
})

const currentNode = computed(() => flowNodes[currentNodeIndex.value] || flowNodes[flowNodes.length - 1])

const flowProgressPercentage = computed(() => {
  return Math.round((completedNodeIds.value.length / flowNodes.length) * 100)
})

const canParseApi = computed(() => {
  return currentNode.value.id === 'login-api' || completedNodeIds.value.includes('login-api')
})

const canParseUserInfoApi = computed(() => {
  return currentNode.value.id === 'user-info-api' || completedNodeIds.value.includes('user-info-api')
})

const mergedSourceOptions = computed(() => {
  const automaticOptions = parameterPool.map((param) => ({
    key: `auto:${param.name}`,
    label: `自动参数 / ${param.label || param.name}`,
  }))

  const responseOptions = apiInterfaces.flatMap((api) => {
    return api.responsePool.map((param) => ({
      key: `response:${api.id}:${param.path}`,
      label: `响应参数 / ${api.method} ${api.path} / ${param.path}`,
    }))
  })

  return [...automaticOptions, ...responseOptions]
})

const currentStepButtonText = computed(() => {
  return `执行：${currentNode.value.title}`
})

const selectedNodeStatus = computed(() => {
  const index = getNodeIndex(selectedNode.value.id)

  if (completedNodeIds.value.includes(selectedNode.value.id)) {
    return '已执行'
  }

  if (index === currentNodeIndex.value) {
    return '等待点击执行'
  }

  return '等待上一步完成'
})

const configPreview = computed(() => {
  return JSON.stringify(
    {
      entryTypes: enabledEntryModeIds.value,
      startPage: {
        path: startPage.path,
      },
      entryParamMappings: entryParamMappings.value,
      firstStep: {
        lifecycle: 'onShow',
        action: 'getCode',
        wxApi: 'wx.login',
      },
      automaticParameterPool: parameterPool,
      apiInterfaces,
      appPublicMappings,
      loginBranchRule: {
        hasToken: '调用 getUserInfo',
        noToken: '调用 linkTo',
      },
      userInfoRule: {
        source: 'getUserInfo res.data',
        target: 'app.public.userInfo',
        next: 'linkTo',
      },
    },
    null,
    2,
  )
})

const entryParamMappings = computed(() => {
  return entryInviteCodeSettings
    .filter((item) => item.enabled)
    .map((item) => ({
      entryTypes: [item.entryType],
      enabled: item.enabled,
      standardName: item.standardName,
      sourceAliases: splitCsvText(item.sourceAliasesText),
      writeTo: item.writeTo,
      usedBy: splitCsvText(item.usedByText),
    }))
})

function getNodeIndex(id) {
  return flowNodes.findIndex((node) => node.id === id)
}

function nodeNeedsCardAction(id) {
  return ['wx-login', 'login-api', 'app-public-map', 'user-info-api'].includes(id)
}

function getNodeStatusLabel(id) {
  const index = getNodeIndex(id)

  if (completedNodeIds.value.includes(id)) {
    return '已完成'
  }

  if (index === currentNodeIndex.value) {
    return '当前步骤'
  }

  return '待执行'
}

function getNodeStatusType(id) {
  const index = getNodeIndex(id)

  if (completedNodeIds.value.includes(id)) {
    return 'success'
  }

  if (index === currentNodeIndex.value) {
    return 'primary'
  }

  return 'info'
}

function splitCsvText(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function selectNode(id) {
  const nodeIndex = getNodeIndex(id)

  if (nodeIndex <= currentNodeIndex.value) {
    selectedNodeId.value = id
  }
}

function runCurrentStep() {
  const node = currentNode.value
  selectedNodeId.value = node.id

  if (completedNodeIds.value.includes(node.id)) {
    return
  }

  if (nodeNeedsCardAction(node.id)) {
    return
  }

  completeCurrentNode(node.id)
}

function runWxLoginStep() {
  if (currentNode.value.id !== 'wx-login' || completedNodeIds.value.includes('wx-login')) {
    return
  }

  selectedNodeId.value = 'wx-login'
  addWxLoginCodeToPool()
  completeCurrentNode('wx-login')
}

function addWxLoginCodeToPool() {
  const existed = parameterPool.some((param) => param.id === 'wx-login-code')

  if (existed) {
    return
  }

  parameterPool.push({
    id: 'wx-login-code',
    label: '微信小程序获取的code',
    name: 'xcxCode',
    source: 'wx.login 返回',
    binding: 'res.code',
    example: `wx_code_${Date.now()}`,
    required: true,
  })
}

function focusApiParser() {
  selectedNodeId.value = 'login-api'
  const parserElement = apiParserSection.value?.$el || apiParserSection.value
  parserElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusAppPublicMapping() {
  selectedNodeId.value = 'app-public-map'
  const sectionElement = appPublicSection.value?.$el || appPublicSection.value
  sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusUserInfoParser() {
  selectedNodeId.value = 'user-info-api'
  const sectionElement = userInfoParserSection.value?.$el || userInfoParserSection.value
  sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function parseLoginApiYaml() {
  if (!canParseApi.value) {
    return
  }

  const result = parseOpenApiYaml(loginApiYaml.value)

  parsedApi.method = result.method
  parsedApi.path = result.path
  parsedApi.summary = result.summary

  const requestPool = result.requestParams.map((param) => ({
      id: `request-${param.name}`,
      name: param.name,
      type: param.type,
      required: param.required,
      description: param.description,
      sourceMode: param.name === 'xcxCode' ? 'pool' : 'custom',
      sourceKey: param.name === 'xcxCode' ? findAutomaticCodeSourceKey() : '',
      customSource: getDefaultCustomSource(param.name),
  }))

  const responsePool = result.responseParams.map((param) => ({
      id: `response-${param.path}`,
      name: param.name,
      path: param.path,
      type: param.type,
      description: param.description,
  }))

  const apiId = `${result.method}-${result.path}`.replace(/[^A-Za-z0-9_-]/g, '-')
  const existedIndex = apiInterfaces.findIndex((api) => api.id === apiId)
  const apiItem = {
    id: apiId,
    method: result.method,
    path: result.path,
    summary: result.summary,
    requestPool,
    responsePool,
  }

  if (existedIndex >= 0) {
    apiInterfaces.splice(existedIndex, 1, apiItem)
  } else {
    apiInterfaces.push(apiItem)
  }

  syncAppPublicMappings(apiItem)
  parserStatus.value = `已解析 ${result.method} ${result.path}：${requestPool.length} 个请求参数、${responsePool.length} 个响应参数`
  completeCurrentNode('login-api')
}

function parseUserInfoApiYaml() {
  if (!canParseUserInfoApi.value) {
    return
  }

  const result = parseOpenApiYaml(userInfoApiYaml.value)

  parsedUserInfoApi.method = result.method
  parsedUserInfoApi.path = result.path
  parsedUserInfoApi.summary = result.summary

  const apiItem = {
    id: `${result.method}-${result.path}`.replace(/[^A-Za-z0-9_-]/g, '-'),
    method: result.method,
    path: result.path,
    summary: result.summary,
    requestPool: result.requestParams.map((param) => ({
      id: `request-${param.name}`,
      name: param.name,
      type: param.type,
      required: param.required,
      description: param.description,
      sourceMode: 'custom',
      sourceKey: '',
      customSource: '',
    })),
    responsePool: result.responseParams.map((param) => ({
      id: `response-${param.path}`,
      name: param.name,
      path: param.path,
      type: param.type,
      description: param.description,
    })),
  }

  const existedIndex = apiInterfaces.findIndex((api) => api.id === apiItem.id)

  if (existedIndex >= 0) {
    apiInterfaces.splice(existedIndex, 1, apiItem)
  } else {
    apiInterfaces.push(apiItem)
  }

  userInfoParserStatus.value = `已解析 ${result.method} ${result.path}，成功后执行 app.public.userInfo = res.data，再 linkTo()`
  completeCurrentNode('user-info-api')
}

function completeAppPublicMapping() {
  if (currentNode.value.id !== 'app-public-map' || appPublicMappings.length === 0) {
    return
  }

  completeCurrentNode('app-public-map')
}

function completeCurrentNode(id = currentNode.value.id) {
  if (!completedNodeIds.value.includes(id)) {
    completedNodeIds.value = [...completedNodeIds.value, id]
  }

  if (currentNodeIndex.value < flowNodes.length - 1) {
    currentNodeIndex.value += 1
    selectedNodeId.value = flowNodes[currentNodeIndex.value].id
  }
}

function syncAppPublicMappings(apiItem) {
  const preferredNames = {
    'data.access_token': 'token',
    'data.bindFlag': 'bindFlag',
    'data.openid': 'openId',
    access_token: 'token',
    bindFlag: 'bindFlag',
    openid: 'openId',
  }

  appPublicMappings.splice(
    0,
    appPublicMappings.length,
    ...apiItem.responsePool.map((param) => {
      const publicName = preferredNames[param.path] || ''

      return {
        id: `app-public-${apiItem.id}-${param.path}`,
        apiId: apiItem.id,
        responsePath: param.path,
        description: param.description,
        enabled: Boolean(publicName),
        publicName,
      }
    }),
  )
}

function generateAgentPrompt() {
  copyStatus.value = ''
  agentPrompt.value = `请使用本项目中的 skill 完成 start.js 正常进入自动登录逻辑。

Skill 路径：
skills/start-normal-auto-login/SKILL.md

目标文件：
pages/start/start.js

开发目标：
1. 支持配置中的多个入口方式，同一个项目可以同时支持正常进入、二维码进入和分享进入。
2. 正常进入小程序时，start 页 onShow 调用 getCode。
3. 二维码进入和分享进入如果配置了 inviteCode，需要在 onLoad(options) 中解析并写入 app.public.inviteCode。
4. inviteCode 解析规则：优先从 options.t 获取；如果不存在，则调用 app.getPagePar(options)，从 link.obj.t 或配置中的 sourceAliases 获取。
5. inviteCode 不默认加入登录接口请求；后续注册接口如果配置了 inviteCode 字段，再从 app.public.inviteCode 取值。
6. getCode 调用 wx.login，并把返回 code 写入登录接口请求参数。
7. 调用后端登录接口。
8. 根据下面 appPublicMappings，把登录接口响应字段写入 app.public。
9. 如果后端返回 token，则继续调用 getUserInfo。
10. 如果后端未返回 token，不要强制注册，直接调用 linkTo 进入目标页。
11. getUserInfo 成功后，将 res.data 存到 app.public.userInfo，然后调用 linkTo。
12. linkTo 方法使用项目 pages/start/start.js 中已有实现，除非必要不要改动。

配置如下：
\`\`\`json
${configPreview.value}
\`\`\`

实现要求：
- 先阅读 pages/start/start.js 当前代码。
- 保留当前项目 app.ajaxWx、app.public、getAppIdentity、APP_IDENTITY 的使用风格。
- 按配置中的 entryParamMappings 解析入口 inviteCode，并在登录/注册前写入 app.public.inviteCode。
- 按配置中的 requestPool 组装登录请求参数。
- 按配置中的 appPublicMappings 写入 app.public。
- 按配置中的 userInfoRule 处理用户信息接口成功后的保存和跳转。
- 完成后说明你改了哪些方法，并检查正常进入链路是否为：onShow -> getCode -> login -> token ? getUserInfo : linkTo -> linkTo。`
}

async function copyAgentPrompt() {
  if (!agentPrompt.value) {
    return
  }

  copyStatus.value = ''

  try {
    await navigator.clipboard.writeText(agentPrompt.value)
    copyStatus.value = '已复制'
  } catch (error) {
    copyStatus.value = '复制失败，请手动复制'
  }
}

function findAutomaticCodeSourceKey() {
  const codeParam = parameterPool.find((param) => param.name === 'xcxCode')
  return codeParam ? `auto:${codeParam.name}` : ''
}

function getDefaultCustomSource(name) {
  const sourceMap = {
    clientId: '从项目全局配置 app.public.config.clientId 获取',
    grantType: '从项目全局配置 app.public.config.grantType 获取',
  }

  return sourceMap[name] || ''
}

function parseOpenApiYaml(yamlText) {
  const lines = yamlText.split(/\r?\n/)
  const requestParams = parseRequestBodyParams(lines)
  const schemas = parseComponentSchemas(lines)
  const responseRef = findFirstResponseRef(lines)
  const responseParams = responseRef ? flattenSchemaFields(responseRef, schemas) : []

  return {
    method: findHttpMethod(lines),
    path: findFirstPath(lines),
    summary: findFirstValue(lines, 'summary') || '登录接口',
    requestParams,
    responseParams,
  }
}

function findFirstPath(lines) {
  const pathLine = lines.find((line) => /^\s{2}\/[^:]+:/.test(line))
  return pathLine ? pathLine.trim().replace(/:$/, '') : '-'
}

function findHttpMethod(lines) {
  const methodLine = lines.find((line) => /^\s{4}(get|post|put|delete|patch):\s*$/.test(line))
  return methodLine ? methodLine.trim().replace(':', '').toUpperCase() : '-'
}

function findFirstValue(lines, key) {
  const line = lines.find((item) => item.trim().startsWith(`${key}:`))
  return line ? cleanYamlValue(line.split(':').slice(1).join(':')) : ''
}

function parseRequestBodyParams(lines) {
  const requestBodyIndex = lines.findIndex((line) => line.trim() === 'requestBody:')
  const propertiesIndex = lines.findIndex((line, index) => index > requestBodyIndex && line.trim() === 'properties:')

  if (requestBodyIndex < 0 || propertiesIndex < 0) {
    return []
  }

  const required = collectRequiredFields(lines, propertiesIndex)
  return collectProperties(lines, propertiesIndex, 16).map((field) => ({
    ...field,
    required: required.includes(field.name),
  }))
}

function collectRequiredFields(lines, fromIndex) {
  const requiredIndex = lines.findIndex((line, index) => index > fromIndex && line.trim() === 'required:')

  if (requiredIndex < 0) {
    return []
  }

  const fields = []

  for (let index = requiredIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (!/^\s+-\s+/.test(line)) {
      break
    }

    fields.push(line.replace(/^\s+-\s+/, '').trim())
  }

  return fields
}

function collectProperties(lines, propertiesIndex, fieldIndent) {
  const fields = []

  for (let index = propertiesIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const indent = getIndent(line)

    if (line.trim() === '' || line.trim().startsWith('x-')) {
      continue
    }

    if (indent <= getIndent(lines[propertiesIndex])) {
      break
    }

    const fieldMatch = line.match(new RegExp(`^\\s{${fieldIndent}}([A-Za-z0-9_.$-]+):\\s*$`))

    if (!fieldMatch) {
      continue
    }

    const field = {
      name: fieldMatch[1],
      type: 'object',
      description: '',
    }

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const childLine = lines[cursor]
      const childIndent = getIndent(childLine)

      if (childLine.trim() && childIndent <= indent) {
        break
      }

      if (childLine.trim().startsWith('type:')) {
        field.type = cleanYamlValue(childLine.split(':').slice(1).join(':'))
      }

      if (childLine.trim().startsWith('description:')) {
        field.description = cleanYamlValue(childLine.split(':').slice(1).join(':'))
      }
    }

    fields.push(field)
  }

  return fields
}

function parseComponentSchemas(lines) {
  const schemas = {}
  let activeSchema = ''
  let activeField = null
  let inProperties = false

  lines.forEach((line) => {
    const schemaMatch = line.match(/^\s{4}([A-Za-z0-9_.$-]+):\s*$/)
    const fieldMatch = line.match(/^\s{8}([A-Za-z0-9_.$-]+):\s*$/)
    const trimLine = line.trim()

    if (schemaMatch) {
      activeSchema = schemaMatch[1]
      schemas[activeSchema] = { fields: {} }
      inProperties = false
      activeField = null
      return
    }

    if (!activeSchema) {
      return
    }

    if (trimLine === 'properties:') {
      inProperties = true
      return
    }

    if (inProperties && fieldMatch) {
      activeField = fieldMatch[1]
      schemas[activeSchema].fields[activeField] = {
        name: activeField,
        type: 'object',
        description: '',
        ref: '',
      }
      return
    }

    if (!activeField) {
      return
    }

    if (trimLine.startsWith('type:')) {
      schemas[activeSchema].fields[activeField].type = cleanYamlValue(trimLine.split(':').slice(1).join(':'))
    }

    if (trimLine.startsWith('description:')) {
      schemas[activeSchema].fields[activeField].description = cleanYamlValue(trimLine.split(':').slice(1).join(':'))
    }

    if (trimLine.startsWith('$ref:')) {
      schemas[activeSchema].fields[activeField].ref = cleanRefName(trimLine.split(':').slice(1).join(':'))
    }
  })

  return schemas
}

function findFirstResponseRef(lines) {
  const refLine = lines.find((line) => line.trim().startsWith('$ref:'))
  return refLine ? cleanRefName(refLine.split(':').slice(1).join(':')) : ''
}

function flattenSchemaFields(schemaName, schemas, prefix = '') {
  const schema = schemas[schemaName]

  if (!schema) {
    return []
  }

  return Object.values(schema.fields).flatMap((field) => {
    const path = prefix ? `${prefix}.${field.name}` : field.name

    if (field.ref) {
      return flattenSchemaFields(field.ref, schemas, path)
    }

    return [
      {
        name: field.name,
        path,
        type: field.type,
        description: field.description,
      },
    ]
  })
}

function cleanRefName(value) {
  return cleanYamlValue(value).split('/').pop()
}

function cleanYamlValue(value) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function getIndent(line) {
  return line.match(/^\s*/)[0].length
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

button,
input,
select {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.builder-page {
  min-height: 100vh;
  padding: 28px;
  background: #f4f6f8;
  color: #17212f;
}

.header,
.workspace,
.param-section,
.api-parser-section {
  max-width: 1440px;
  margin: 0 auto;
}

.header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: stretch;
}

.eyebrow,
.panel-label {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 10px;
  font-size: 40px;
  line-height: 1.15;
}

h2 {
  margin-bottom: 0;
  font-size: 24px;
}

h3 {
  margin-bottom: 10px;
  font-size: 20px;
}

.intro {
  max-width: 760px;
  margin-bottom: 0;
  color: #526173;
  line-height: 1.7;
}

.entry-panel strong {
  display: block;
  margin-bottom: 10px;
  font-size: 20px;
}

.entry-panel p {
  margin-bottom: 0;
  color: #5e6b7d;
  line-height: 1.6;
}

.entry-tabs {
  display: flex;
  flex-wrap: wrap;
  max-width: 1440px;
  margin: 18px auto;
}

.entry-tabs :deep(.el-checkbox-button__inner) {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-weight: 800;
}

.workspace {
  display: block;
}

.flow-board,
.param-section {
  padding: 18px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.section-title.compact {
  margin-top: 18px;
}

.section-title span {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.config-collapse pre {
  overflow: auto;
  margin: 0;
  padding: 14px;
  border-radius: 8px;
  background: #111827;
  color: #dbeafe;
  line-height: 1.6;
}

.board-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.flow-progress {
  display: grid;
  gap: 8px;
  min-width: 220px;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.start-path {
  margin-top: 10px;
  font-weight: 800;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px 28px;
  overflow: hidden;
  padding: 2px;
}

.flow-node {
  position: relative;
  min-height: 150px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  text-align: left;
}

.flow-node::after {
  position: absolute;
  z-index: 0;
  top: 50%;
  right: -24px;
  width: 20px;
  height: 2px;
  background: #cbd5e1;
  content: "";
}

.flow-node::before {
  position: absolute;
  z-index: 1;
  top: calc(50% - 4px);
  right: -28px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid #cbd5e1;
  content: "";
}

.flow-node:nth-child(4n)::after,
.flow-node:nth-child(4n)::before,
.flow-node:last-child::after,
.flow-node:last-child::before {
  display: none;
}

.flow-node :deep(.el-card__body) {
  display: grid;
  position: relative;
  z-index: 2;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 12px;
  min-height: 148px;
}

.flow-node.active {
  border-color: #0f766e;
  box-shadow: 0 14px 30px rgba(15, 118, 110, 0.14);
}

.flow-node.done {
  border-color: #22c55e;
  background: #f0fdf4;
}

.flow-node.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.node-index {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #ecfeff;
  color: #0f766e;
  font-weight: 900;
}

.node-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.node-kind {
  max-width: 110px;
}

.flow-node strong {
  display: block;
  margin-bottom: 8px;
}

.flow-node small {
  color: #64748b;
  line-height: 1.5;
}

.node-status {
  justify-self: start;
}

.node-action {
  width: 100%;
  min-height: 36px;
  border-radius: 6px;
  background: #0f766e;
  color: #fff;
  font-weight: 800;
}

.node-action:disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

.node-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f7f9fb;
}

.node-detail p {
  margin-bottom: 0;
  color: #526173;
  line-height: 1.7;
}

.detail-tag {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #e6f4f1;
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
}

dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

dt {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

dd {
  margin: 4px 0 0;
  color: #1f2937;
  font-weight: 700;
  word-break: break-word;
}

.param-section {
  margin-top: 18px;
}

.api-parser-section {
  margin-top: 18px;
  padding: 18px;
}

.parser-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
}

.yaml-panel {
  display: grid;
  gap: 10px;
}

.textarea-label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 800;
}

.parser-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.api-summary {
  display: grid;
  gap: 14px;
  align-content: start;
  padding: 16px;
  border-radius: 8px;
  background: #f7f9fb;
}

.api-summary p {
  margin-bottom: 0;
  color: #64748b;
  line-height: 1.65;
}

.config-collapse,
.interface-collapse {
  margin-top: 16px;
}

.interface-title {
  color: #17212f;
  font-weight: 800;
  word-break: break-word;
}

@media (max-width: 1100px) {
  .header,
  .workspace,
  .node-detail,
  .parser-layout {
    grid-template-columns: 1fr;
  }

  .flow-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flow-node:nth-child(4n)::after,
  .flow-node:nth-child(4n)::before {
    display: block;
  }

  .flow-node:nth-child(2n)::after,
  .flow-node:nth-child(2n)::before,
  .flow-node:last-child::after,
  .flow-node:last-child::before {
    display: none;
  }
}

@media (max-width: 720px) {
  .builder-page {
    padding: 16px;
  }

  h1 {
    font-size: 30px;
  }

  .flow-steps {
    grid-template-columns: 1fr;
  }

  .entry-tabs,
  .flow-progress {
    width: 100%;
  }

  .entry-tabs :deep(.el-checkbox-button__inner) {
    justify-content: center;
    width: 100%;
  }

  .flow-node::after,
  .flow-node::before {
    display: none;
  }

  .board-head,
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
