<script setup lang="ts">
import type { WechatMiniAuthParamSource, WechatMiniAuthPromptStepKey } from '~/types/fast-builder'
import { CopyDocument, Delete, MagicStick, Plus, Share, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { createDefaultWechatMiniAuthConfig, generateWechatMiniAuthPromptSteps } from '~/utils/wechat-mini-auth'

type Method1ParamGroup = 'getPhoneParams' | 'registerParams' | 'loginParams'

const authConfig = reactive(createDefaultWechatMiniAuthConfig())
const activeTab = ref('flow')
const activeStep = ref<WechatMiniAuthPromptStepKey>('global_app')

const promptSteps = computed(() => generateWechatMiniAuthPromptSteps(authConfig))
const configJson = computed(() => JSON.stringify(authConfig, null, 2))

const sourceOptions: Array<{ label: string, value: WechatMiniAuthParamSource }> = [
  { label: '手机号授权 code', value: 'phoneAuthCode' },
  { label: 'wx.login code', value: 'wxLoginCode' },
  { label: 'get-phone 返回结果', value: 'getPhoneResult' },
  { label: 'app.public.config', value: 'appConfig' },
  { label: '邀请码', value: 'inviteCode' },
  { label: '固定值', value: 'fixed' },
  { label: '手动/项目变量', value: 'manual' },
  { label: '上一步接口返回', value: 'previousResponse' },
]

const startFlow = computed(() => [
  'onLoad 解析入口参数',
  'wx.login 获取 xcxCode',
  `${authConfig.apis.login} 静默登录`,
  '保存 token / openid',
  '拉用户信息',
  'linkTo 目标页',
])

const loginFlow = computed(() => [
  '点击授权手机号登录',
  'getPhoneNumber 拿到 code',
  `${authConfig.apis.getPhone} 换手机号`,
  'wx.login 拿新 xcxCode',
  `${authConfig.apis.register} 注册`,
  '保存登录态并回跳',
])

function generatePrompts() {
  activeTab.value = 'prompts'
  ElMessage.success('已生成 method1 登录注册提示词')
}

function applyMethod1Preset() {
  const nextConfig = createDefaultWechatMiniAuthConfig()
  Object.assign(authConfig, nextConfig)
  activeTab.value = 'flow'
  ElMessage.success('已恢复 method1 律师版默认配置')
}

function addMethod1Param(group: Method1ParamGroup) {
  authConfig.method1[group].push({
    field: '',
    source: 'manual',
    value: '',
    remark: '',
  })
}

function removeMethod1Param(group: Method1ParamGroup, index: number) {
  authConfig.method1[group].splice(index, 1)
}

function addSharePage() {
  authConfig.pages.sharePages.push('')
}

function removeSharePage(index: number) {
  authConfig.pages.sharePages.splice(index, 1)
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  }
  catch {
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <main class="min-h-screen bg-#f5f7fb p-4 text-slate-800 md:p-6">
    <section class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="mb-1 text-sm text-teal-700 font-bold">
          WeChat Mini Program
        </div>
        <h1 class="m-0 text-2xl font-800 md:text-3xl">
          微信小程序 method1 登录注册
        </h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <el-button plain @click="applyMethod1Preset">
          恢复 method1 默认
        </el-button>
        <el-button type="primary" :icon="MagicStick" @click="generatePrompts">
          生成提示词
        </el-button>
      </div>
    </section>

    <section class="flex flex-col gap-4">
      <el-card shadow="never">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="流程图" name="flow">
            <el-alert
              class="mb-4"
              title="先只跑 method1：注册和登录分开。start 页面只做静默登录，login 页面负责授权手机号、get-phone、xcx-register。"
              type="info"
              show-icon
              :closable="false"
            />

            <div class="flow-section">
              <div class="flow-heading">
                <div>
                  <div class="flow-kicker">
                    start 页面
                  </div>
                  <h2>空白启动页静默登录</h2>
                </div>
                <span class="flow-badge">{{ authConfig.pages.startPage }}</span>
              </div>
              <div class="flow-chain">
                <template v-for="(node, index) in startFlow" :key="node">
                  <div class="flow-node">
                    <span>{{ index + 1 }}</span>
                    <strong>{{ node }}</strong>
                  </div>
                  <div v-if="index < startFlow.length - 1" class="flow-arrow">
                    →
                  </div>
                </template>
              </div>
              <div class="param-card">
                <div class="param-card-head">
                  <div>
                    <h3>start 调 /auth/login 参数</h3>
                    <p>这里的 code 只能来自 wx.login，不是手机号授权 code。</p>
                  </div>
                  <el-button type="primary" plain :icon="Plus" @click="addMethod1Param('loginParams')">
                    添加参数
                  </el-button>
                </div>
                <div class="param-table">
                  <div class="param-row param-head">
                    <span>参数字段</span>
                    <span>值来源</span>
                    <span>获取方式/固定值</span>
                    <span>备注</span>
                    <span />
                  </div>
                  <div v-for="(param, index) in authConfig.method1.loginParams" :key="`login-${index}`" class="param-row">
                    <el-input v-model="param.field" placeholder="例如 xcxCode" />
                    <el-select v-model="param.source" class="w-full">
                      <el-option v-for="option in sourceOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                    <el-input v-model="param.value" placeholder="例如 wx.login 返回的 code" />
                    <el-input v-model="param.remark" placeholder="说明" />
                    <el-button type="danger" plain :icon="Delete" @click="removeMethod1Param('loginParams', index)" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flow-section">
              <div class="flow-heading">
                <div>
                  <div class="flow-kicker">
                    login 页面
                  </div>
                  <h2>授权手机号注册绑定</h2>
                </div>
                <span class="flow-badge">{{ authConfig.pages.bindPage }}</span>
              </div>
              <div class="flow-chain">
                <template v-for="(node, index) in loginFlow" :key="node">
                  <div class="flow-node">
                    <span>{{ index + 1 }}</span>
                    <strong>{{ node }}</strong>
                  </div>
                  <div v-if="index < loginFlow.length - 1" class="flow-arrow">
                    →
                  </div>
                </template>
              </div>

              <div class="param-grid">
                <div class="param-card">
                  <div class="param-card-head">
                    <div>
                      <h3>点击授权后调 /auth/get-phone</h3>
                      <p>先解析 get-phone 的 OpenAPI/Swagger，把 e.detail.code 放进后端要求的字段。</p>
                    </div>
                    <el-button type="primary" plain :icon="Plus" @click="addMethod1Param('getPhoneParams')">
                      添加参数
                    </el-button>
                  </div>
                  <div class="param-table">
                    <div class="param-row param-head">
                      <span>参数字段</span>
                      <span>值来源</span>
                      <span>获取方式/固定值</span>
                      <span>备注</span>
                      <span />
                    </div>
                    <div v-for="(param, index) in authConfig.method1.getPhoneParams" :key="`phone-${index}`" class="param-row">
                      <el-input v-model="param.field" placeholder="例如 code" />
                      <el-select v-model="param.source" class="w-full">
                        <el-option v-for="option in sourceOptions" :key="option.value" :label="option.label" :value="option.value" />
                      </el-select>
                      <el-input v-model="param.value" placeholder="例如 e.detail.code" />
                      <el-input v-model="param.remark" placeholder="说明" />
                      <el-button type="danger" plain :icon="Delete" @click="removeMethod1Param('getPhoneParams', index)" />
                    </div>
                  </div>
                </div>
                <div class="param-card">
                  <div class="param-card-head">
                    <div>
                      <h3>拿到手机号后调 /auth/xcx-register</h3>
                      <p>注册接口需要的 xcxCode 来自重新 wx.login，手机号来自 get-phone 返回结果。</p>
                    </div>
                    <el-button type="primary" plain :icon="Plus" @click="addMethod1Param('registerParams')">
                      添加参数
                    </el-button>
                  </div>
                  <div class="param-table">
                    <div class="param-row param-head">
                      <span>参数字段</span>
                      <span>值来源</span>
                      <span>获取方式/固定值</span>
                      <span>备注</span>
                      <span />
                    </div>
                    <div v-for="(param, index) in authConfig.method1.registerParams" :key="`register-${index}`" class="param-row">
                      <el-input v-model="param.field" placeholder="例如 phonenumber" />
                      <el-select v-model="param.source" class="w-full">
                        <el-option v-for="option in sourceOptions" :key="option.value" :label="option.label" :value="option.value" />
                      </el-select>
                      <el-input v-model="param.value" placeholder="例如 getPhoneRes.data.phonenumber" />
                      <el-input v-model="param.remark" placeholder="说明" />
                      <el-button type="danger" plain :icon="Delete" @click="removeMethod1Param('registerParams', index)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="基础配置" name="config">
            <el-divider content-position="left">
              项目与接口
            </el-divider>
            <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-4">
              <el-form-item label="项目名称">
                <el-input v-model="authConfig.projectName" />
              </el-form-item>
              <el-form-item label="启动页静默登录接口">
                <el-input v-model="authConfig.apis.login" />
              </el-form-item>
              <el-form-item label="获取手机号接口">
                <el-input v-model="authConfig.apis.getPhone" />
              </el-form-item>
              <el-form-item label="小程序注册接口">
                <el-input v-model="authConfig.apis.register" />
              </el-form-item>
              <el-form-item label="用户信息接口">
                <el-input v-model="authConfig.apis.profile" />
              </el-form-item>
            </el-form>

            <el-divider content-position="left">
              响应字段映射
            </el-divider>
            <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-4">
              <el-form-item label="token 字段">
                <el-input v-model="authConfig.fields.token" />
              </el-form-item>
              <el-form-item label="绑定状态字段">
                <el-input v-model="authConfig.fields.bindFlag" />
              </el-form-item>
              <el-form-item label="openId 字段">
                <el-input v-model="authConfig.fields.openId" />
              </el-form-item>
              <el-form-item label="邀请码字段">
                <el-input v-model="authConfig.fields.inviteCode" />
              </el-form-item>
              <el-form-item label="用户信息字段">
                <el-input v-model="authConfig.fields.userInfo" />
              </el-form-item>
            </el-form>

            <el-divider content-position="left">
              页面与入口
            </el-divider>
            <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-4">
              <el-form-item label="启动页">
                <el-input v-model="authConfig.pages.startPage" />
              </el-form-item>
              <el-form-item label="绑定注册页">
                <el-input v-model="authConfig.pages.bindPage" />
              </el-form-item>
              <el-form-item label="默认首页">
                <el-input v-model="authConfig.pages.defaultHome" />
              </el-form-item>
              <el-form-item label="页面参数名">
                <el-input v-model="authConfig.entry.pageParam" />
              </el-form-item>
              <el-form-item label="二维码参数名">
                <el-input v-model="authConfig.entry.sceneParam" />
              </el-form-item>
              <el-form-item label="二维码入口">
                <el-switch v-model="authConfig.entry.enableQrCode" active-text="默认开启" />
              </el-form-item>
              <el-form-item label="分享入口">
                <el-switch v-model="authConfig.entry.enableShare" active-text="默认开启" />
              </el-form-item>
            </el-form>

            <el-divider content-position="left">
              需要分享的页面
            </el-divider>
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-500">填写页面标识，例如 index、goods/detail。提示词会逐页要求补 onShareAppMessage。</span>
              <el-button type="primary" plain :icon="Plus" @click="addSharePage">
                添加页面
              </el-button>
            </div>
            <div class="share-page-list">
              <div v-for="(_page, index) in authConfig.pages.sharePages" :key="index" class="share-page-row">
                <el-input v-model="authConfig.pages.sharePages[index]" placeholder="例如 index" />
                <el-button type="danger" plain :icon="Delete" @click="removeSharePage(index)">
                  删除
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="五阶段提示词" name="prompts">
            <el-tabs v-model="activeStep" tab-position="left" class="min-h-130">
              <el-tab-pane v-for="step in promptSteps" :key="step.key" :label="step.title" :name="step.key">
                <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <span class="text-sm text-slate-500">{{ step.description }}</span>
                  <el-button type="primary" plain :icon="CopyDocument" @click="copyText(step.prompt)">
                    复制提示词
                  </el-button>
                </div>
                <el-input :model-value="step.prompt" type="textarea" :rows="24" resize="none" readonly />
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <el-tab-pane label="结构化 JSON" name="json">
            <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span class="text-sm text-slate-500">当前 method1 登录注册提示词配置。</span>
              <el-button type="primary" plain :icon="CopyDocument" @click="copyText(configJson)">
                复制 JSON
              </el-button>
            </div>
            <el-input :model-value="configJson" type="textarea" :rows="24" resize="none" readonly />
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="flex items-center gap-2 font-bold">
            <el-icon>
              <Tickets />
            </el-icon>
            <span>method1 默认接口</span>
          </div>
        </template>
        <div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div class="api-tile">
            <div class="api-method">
              POST
            </div>
            <div class="api-path">
              /auth/login
            </div>
            <div class="api-desc">
              start 页面 wx.login 后静默登录
            </div>
          </div>
          <div class="api-tile">
            <div class="api-method">
              GET
            </div>
            <div class="api-path">
              /auth/get-phone
            </div>
            <div class="api-desc">
              手机号授权 code 换真实手机号
            </div>
          </div>
          <div class="api-tile">
            <div class="api-method">
              POST
            </div>
            <div class="api-path">
              /auth/xcx-register
            </div>
            <div class="api-desc">
              真实手机号 + xcxCode 注册绑定
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="flex items-center gap-2 font-bold">
            <el-icon>
              <Share />
            </el-icon>
            <span>分享路径约定</span>
          </div>
        </template>
        <el-input
          :model-value="`${authConfig.pages.startPage}?t=邀请码&${authConfig.entry.pageParam}=页面标识`"
          readonly
        />
      </el-card>
    </section>
  </main>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  font-family: 'DM Mono', Consolas, monospace;
  line-height: 1.55;
}

.flow-section {
  margin-bottom: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.flow-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.flow-heading h2 {
  margin: 3px 0 0;
  color: #0f172a;
  font-size: 18px;
}

.flow-kicker {
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
}

.flow-badge {
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-family: 'DM Mono', Consolas, monospace;
  font-size: 12px;
  padding: 5px 10px;
}

.flow-chain {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.flow-node {
  display: grid;
  grid-template-columns: 24px minmax(120px, 1fr);
  align-items: center;
  min-width: 166px;
  border: 1px solid #dbe3ea;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px;
}

.flow-node span {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.flow-node strong {
  color: #1e293b;
  font-size: 13px;
}

.flow-arrow {
  display: grid;
  place-items: center;
  color: #64748b;
  font-weight: 800;
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.param-card {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}

.param-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.param-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
}

.param-card p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.param-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.9fr) minmax(150px, 1fr) minmax(180px, 1.4fr) minmax(150px, 1.2fr) 44px;
  gap: 8px;
  align-items: center;
}

.param-head {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.share-page-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-page-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.api-tile {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.api-method {
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
}

.api-path {
  margin-top: 6px;
  color: #0f172a;
  font-family: 'DM Mono', Consolas, monospace;
  font-weight: 700;
}

.api-desc {
  margin-top: 6px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .param-grid {
    grid-template-columns: 1fr;
  }

  .param-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .share-page-row {
    grid-template-columns: 1fr;
  }

  .flow-heading {
    flex-direction: column;
  }
}
</style>
