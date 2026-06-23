<script setup lang="ts">
import { CopyDocument, MagicStick, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

const defaultFigmaMcpText = `Implement this design from Figma.
@https://www.figma.com/design/iqDtxgOfQMsodBHA9QFQso/%E5%BE%8B%E5%B8%88%E5%B0%8F%E7%A8%8B%E5%BA%8F?node-id=140-3451&m=dev`

const figmaMcpText = ref(defaultFigmaMcpText)
const wxmlPath = ref('pages/login/login.wxml')
const wxssPath = ref('pages/login/login.wxss')
const jsPath = ref('pages/login/login.js')
const generatedPrompt = ref('')

const canGenerate = computed(() => figmaMcpText.value.trim().length > 0)

function generatePrompt() {
  if (!canGenerate.value) {
    ElMessage.warning('请先粘贴 Figma MCP 内容')
    return
  }

  generatedPrompt.value = `使用 $weapp 和 $02bind-phone-number。

任务：根据下面的 Figma 设计稿，实现微信原生小程序“绑定手机号登录”页面。

Figma：
${figmaMcpText.value.trim()}

目标文件：
- WXML：${wxmlPath.value.trim() || 'pages/login/login.wxml'}
- WXSS：${wxssPath.value.trim() || 'pages/login/login.wxss'}
- JS：${jsPath.value.trim() || 'pages/login/login.js'}（可选；本阶段不要实现登录接口逻辑）

执行规则：
- 先读取 Figma 节点。目标文件存在就保留可复用的 class 命名和结构；不存在就新建页面。
- 只做 UI，不实现登录、注册、请求、token 等业务逻辑。
- 保持这些事件和状态名不变：onAuthorizeTap、onAuthorizePhone、onDeny、onToggleAgree、agree。
- 不要新增 shakeAgree、app-toast、app-loading 或自定义 toast/loading 依赖。

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
}

function resetForm() {
  figmaMcpText.value = defaultFigmaMcpText
  wxmlPath.value = 'pages/login/login.wxml'
  wxssPath.value = 'pages/login/login.wxss'
  jsPath.value = 'pages/login/login.js'
  generatedPrompt.value = ''
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
        <el-button :icon="RefreshLeft" plain @click="resetForm">
          恢复示例
        </el-button>
        <el-button :icon="MagicStick" type="primary" :disabled="!canGenerate" @click="generatePrompt">
          生成提示词
        </el-button>
      </div>
    </section>

    <section class="step-strip">
      <div class="step-item active">
        <span>01</span>
        <strong>粘贴 Figma MCP</strong>
      </div>
      <div class="step-item">
        <span>02</span>
        <strong>生成 Skill 提示词</strong>
      </div>
      <div class="step-item">
        <span>03</span>
        <strong>带到小程序项目执行</strong>
      </div>
    </section>

    <section class="workspace">
      <el-card class="input-panel" shadow="never">
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
      </el-card>

      <el-card class="output-panel" shadow="never">
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
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

.step-item.active {
  border-color: #0f766e;
  background: #ecfdf5;
}

.step-item.active span {
  background: #0f766e;
  color: #fff;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(480px, 1.15fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
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
  .step-strip {
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
  .contract-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
