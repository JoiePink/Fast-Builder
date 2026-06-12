<script setup lang="ts">
import type { BuilderMeta, ExpandConfig, ParamField, PromptStepKey } from '~/types/fast-builder'
import { CopyDocument, MagicStick, Setting, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { buildConfig, createDefaultExpandConfig, generatePromptSteps, getDefaultPrimaryKey, parseApiFoxJson } from '~/utils/fast-builder'

const rawJson = ref('')
const paramsList = ref<ParamField[]>([])
const activeTab = ref('fields')
const activeStep = ref<PromptStepKey>('step1_query_page')
const parseMessage = ref('')
const parseError = ref('')
const sourcePanelCollapsed = ref(true)
const expandedFieldKeys = ref<string[]>([])

const meta = reactive<BuilderMeta>({
  businessName: '',
  pageName: '',
  listPath: '',
  listApi: '',
  detailApi: '',
  addApi: '',
  updateApi: '',
  removeApi: '',
  primaryKey: 'id',
  permissionConfig: {
    add: '',
    edit: '',
    remove: '',
    export: '',
  },
  exportConfig: {
    enabled: false,
    url: '',
    fileName: '',
  },
})
const expandConfig = reactive<ExpandConfig>(createDefaultExpandConfig())

const enabledFields = computed(() => paramsList.value.filter(item => item.enabled))
const expandCandidateFields = computed(() => paramsList.value.filter(item => item.enabled && item.displayTarget === 'expand'))
const builderConfig = computed(() => buildConfig(meta, paramsList.value, expandConfig))
const configJson = computed(() => JSON.stringify(builderConfig.value, null, 2))
const promptSteps = computed(() => generatePromptSteps(builderConfig.value))
const allFieldRowsExpanded = computed(() => paramsList.value.length > 0 && expandedFieldKeys.value.length === paramsList.value.length)

function handleParse() {
  if (!rawJson.value.trim()) {
    parseError.value = '请先粘贴 ApiFox 分页响应 JSON 或 OpenAPI Schema'
    parseMessage.value = ''
    sourcePanelCollapsed.value = false
    return false
  }

  try {
    const result = parseApiFoxJson(rawJson.value)
    paramsList.value = result.paramsList
    meta.primaryKey = getDefaultPrimaryKey(paramsList.value)
    if ('apiPath' in result && result.apiPath)
      meta.listPath = result.apiPath
    expandedFieldKeys.value = []
    parseMessage.value = result.mode === 'openapi-schema'
      ? `已从 ${result.sourcePath} 解析出 ${result.responseParamCount || 0} 个响应字段、${result.queryParamCount || 0} 个查询参数`
      : `已从 ${result.sourcePath} 解析出 ${paramsList.value.length} 个字段`
    parseError.value = ''
    activeTab.value = 'fields'
    sourcePanelCollapsed.value = true
    return true
  }
  catch (error) {
    parseError.value = error instanceof Error ? error.message : 'JSON 解析失败'
    parseMessage.value = ''
    sourcePanelCollapsed.value = false
    return false
  }
}

function generatePrompts() {
  if (!paramsList.value.length && !handleParse())
    return

  if (paramsList.value.length) {
    activeTab.value = 'prompts'
    ElMessage.success('已生成四阶段提示词')
  }
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

function normalizeField(field: ParamField): ParamField {
  if (!field.expand) {
    field.expand = {
      display: field.table.display,
    }
  }
  if (!field.expand.display)
    field.expand.display = field.table.display
  if (!field.query.dateRange) {
    field.query.dateRange = {
      enabled: field.query.widget === 'el-date-picker',
      model: field.field === 'createTime' ? 'dateRange' : `${field.field}Range`,
      paramCount: 2,
      beginParam: `${field.field}Begin`,
      endParam: `${field.field}End`,
    }
  }
  if (!field.query.dateRange.model)
    field.query.dateRange.model = field.field === 'createTime' ? 'dateRange' : `${field.field}Range`
  if (!field.query.dateRange.beginParam)
    field.query.dateRange.beginParam = `${field.field}Begin`
  if (field.query.dateRange.paramCount === 2 && !field.query.dateRange.endParam)
    field.query.dateRange.endParam = `${field.field}End`
  return field
}

function ensureFormWidgetConfig(field: ParamField) {
  if (field.form.widget === 'image-upload' && (!field.form.uploadLimit || field.form.uploadLimit < 1))
    field.form.uploadLimit = 1
}

function ensureDateRangeConfig(field: ParamField) {
  normalizeField(field)
  if (field.query.widget === 'el-date-picker')
    field.query.operator = 'between'
}

function getFieldRowKey(row: ParamField) {
  return row.field
}

function handleFieldExpandChange(_row: ParamField, expandedRows: ParamField[]) {
  expandedFieldKeys.value = expandedRows.map(item => item.field)
}

function toggleAllFieldRows() {
  expandedFieldKeys.value = allFieldRowsExpanded.value
    ? []
    : paramsList.value.map(item => item.field)
}

function addExpandGroup() {
  expandConfig.groups.push({
    title: '',
    fields: [],
  })
}

function removeExpandGroup(index: number) {
  expandConfig.groups.splice(index, 1)
}

</script>

<template>
  <main class="min-h-screen bg-#f5f7fb p-4 text-slate-800 md:p-6">
    <section class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="mb-1 text-sm text-teal-700 font-bold">
          Fast-Builder
        </div>
        <h1 class="m-0 text-2xl font-800 md:text-3xl">
          RuoYi CRUD 四阶段提示词生成器
        </h1>
      </div>
      <el-button type="primary" :icon="MagicStick" @click="generatePrompts">
        生成提示词
      </el-button>
    </section>

    <section class="flex flex-col gap-4">
      <el-card shadow="never" class="source-card">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 font-bold">
              <el-icon>
                <Tickets />
              </el-icon>
              <span>ApiFox 分页响应 JSON / Schema</span>
            </div>
            <el-button text type="primary" @click="sourcePanelCollapsed = !sourcePanelCollapsed">
              {{ sourcePanelCollapsed ? '展开解析区' : '收起解析区' }}
            </el-button>
          </div>
        </template>

        <el-collapse-transition>
          <div v-show="!sourcePanelCollapsed">
            <el-input v-model="rawJson" type="textarea" :rows="12" resize="vertical" spellcheck="false"
              placeholder="粘贴 ApiFox 分页列表接口响应 JSON，或 ApiFox 导出的 OpenAPI Schema" />

            <div class="my-3 flex flex-wrap gap-2">
              <el-button type="primary" plain :icon="MagicStick" @click="handleParse">
                解析 paramsList
              </el-button>
            </div>
          </div>
        </el-collapse-transition>

        <el-alert v-if="parseMessage" :title="parseMessage" type="success" show-icon :closable="false" />
        <el-alert v-if="parseError" :title="parseError" type="error" show-icon :closable="false" />
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="flex items-center gap-2 font-bold">
            <el-icon>
              <Setting />
            </el-icon>
            <span>生成配置</span>
          </div>
        </template>

        <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-4">
          <el-form-item label="业务名称">
            <el-input v-model="meta.businessName" />
          </el-form-item>
          <el-form-item label="页面名称">
            <el-input v-model="meta.pageName" />
          </el-form-item>
          <el-form-item label="列表接口地址">
            <el-input v-model="meta.listPath" />
          </el-form-item>
          <el-form-item label="列表接口">
            <el-input v-model="meta.listApi" />
          </el-form-item>
          <el-form-item label="详情接口">
            <el-input v-model="meta.detailApi" />
          </el-form-item>
          <el-form-item label="新增接口">
            <el-input v-model="meta.addApi" />
          </el-form-item>
          <el-form-item label="修改接口">
            <el-input v-model="meta.updateApi" />
          </el-form-item>
          <el-form-item label="删除接口">
            <el-input v-model="meta.removeApi" />
          </el-form-item>
          <el-form-item label="删除主键">
            <el-select v-model="meta.primaryKey" class="w-full">
              <el-option v-for="item in enabledFields" :key="item.field" :label="item.field" :value="item.field" />
            </el-select>
          </el-form-item>
          <el-form-item label="展开描述列数">
            <el-input-number v-model="expandConfig.descriptionColumn" :min="1" :max="6" class="w-full" />
          </el-form-item>
        </el-form>

        <el-divider content-position="left">
          展开行描述项组合
        </el-divider>

        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm text-slate-500">每个组合生成一个 el-descriptions，标题可不填。</span>
          <el-button type="primary" plain :disabled="!expandCandidateFields.length" @click="addExpandGroup">
            添加组合
          </el-button>
        </div>
        <div v-if="expandConfig.groups.length" class="expand-group-list">
          <div v-for="(group, index) in expandConfig.groups" :key="index" class="expand-group-row">
            <el-input v-model="group.title" placeholder="组合标题（可选）" />
            <el-select v-model="group.fields" multiple collapse-tags collapse-tags-tooltip filterable class="w-full"
              placeholder="选择该组合中的字段">
              <el-option v-for="item in expandCandidateFields" :key="item.field" :label="`${item.field} - ${item.label}`"
                :value="item.field" />
            </el-select>
            <el-button type="danger" plain @click="removeExpandGroup(index)">
              删除
            </el-button>
          </div>
        </div>
        <el-alert v-else-if="expandCandidateFields.length" title="未配置组合时，生成配置会默认把所有展开字段放入一个无标题描述项组合。" type="info"
          :closable="false" />
        <el-alert v-else title="把字段展示位置改为展开行后，即可配置描述项组合。" type="info" :closable="false" />

        <el-divider content-position="left">
          按钮权限配置
        </el-divider>

        <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-4">
          <el-form-item label="新增权限">
            <el-input v-model="meta.permissionConfig.add" placeholder="如 system:customer:add" />
          </el-form-item>
          <el-form-item label="修改权限">
            <el-input v-model="meta.permissionConfig.edit" placeholder="如 system:customer:edit" />
          </el-form-item>
          <el-form-item label="删除权限">
            <el-input v-model="meta.permissionConfig.remove" placeholder="如 system:customer:remove" />
          </el-form-item>
          <el-form-item label="导出权限">
            <el-input v-model="meta.permissionConfig.export" placeholder="如 system:customer:export" />
          </el-form-item>
        </el-form>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="字段池 paramsList" name="fields">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span class="text-sm text-slate-500">主表保留核心字段，展开行中按配置类别填写更多内容。</span>
              <div class="flex flex-wrap items-center gap-2">
                <el-switch v-model="meta.exportConfig.enabled" active-text="支持导出" inactive-text="不导出" />
                <el-button plain :disabled="!paramsList.length" @click="toggleAllFieldRows">
                  {{ allFieldRowsExpanded ? '折叠全部' : '展开全部' }}
                </el-button>
              </div>
            </div>
            <el-form v-if="meta.exportConfig.enabled" label-position="top"
              class="grid grid-cols-1 mb-3 gap-x-3 md:grid-cols-2">
              <el-form-item label="导出接口地址">
                <el-input v-model="meta.exportConfig.url" placeholder="如 admin/customer/export" />
              </el-form-item>
              <el-form-item label="导出文件名前缀">
                <el-input v-model="meta.exportConfig.fileName" placeholder="如 客户" />
              </el-form-item>
            </el-form>
            <el-table :data="paramsList" border :row-key="getFieldRowKey" :expand-row-keys="expandedFieldKeys"
              @expand-change="handleFieldExpandChange">
              <el-table-column type="expand" align="center">
                <template #default="{ row }">
                  <div class="field-expand-panel">
                    <el-descriptions title="公共字段内容" :column="3" border>
                      <el-descriptions-item label="是否关联字典">
                        <el-switch v-model="row.selectSource" :disabled="!row.enabled" active-value="dict"
                          inactive-value="remark" active-text="是" inactive-text="否" />
                      </el-descriptions-item>
                      <el-descriptions-item v-if="row.selectSource === 'dict'" label="字典类型">
                        <el-input v-model="row.dictType" :disabled="!row.enabled"
                          placeholder="如 sys_normal_disable" />
                      </el-descriptions-item>
                      <el-descriptions-item label="备注">
                        <el-input v-model="row.enumRemark" :disabled="!row.enabled"
                          placeholder="如 0是，1否" />
                      </el-descriptions-item>
                    </el-descriptions>

                    <el-descriptions v-if="row.query.enabled" title="展示、查询设置" :column="3" border>
                      <el-descriptions-item label="展示位置">
                        <el-select v-model="row.displayTarget" :disabled="!row.enabled" class="w-full">
                          <el-option label="主表格" value="table" />
                          <el-option label="展开行" value="expand" />
                          <el-option label="不展示" value="none" />
                        </el-select>
                      </el-descriptions-item>
                      <el-descriptions-item label="查询控件">
                        <el-select v-model="row.query.widget" :disabled="!row.enabled" class="w-full"
                          @change="ensureDateRangeConfig(row)">
                          <el-option label="el-input" value="el-input" />
                          <el-option label="el-select" value="el-select" />
                          <el-option label="el-date-picker" value="el-date-picker" />
                          <el-option label="el-switch" value="el-switch" />
                        </el-select>
                      </el-descriptions-item>
                      <el-descriptions-item label="范围查询开关">
                        <el-switch v-model="normalizeField(row).query.dateRange.enabled"
                          :disabled="!row.enabled || row.query.widget !== 'el-date-picker'" active-text="开启"
                          inactive-text="关闭" @change="ensureDateRangeConfig(row)" />
                      </el-descriptions-item>
                      <el-descriptions-item v-if="normalizeField(row).query.dateRange.enabled" label="范围参数">
                        <span class="text-xs text-slate-600">
                          {{ row.query.dateRange.paramCount === 1 ? row.query.dateRange.beginParam
                            : `${row.query.dateRange.beginParam} / ${row.query.dateRange.endParam}` }}
                        </span>
                      </el-descriptions-item>
                      <el-descriptions-item label="展示形式">
                        <el-select v-if="row.displayTarget === 'table'" v-model="row.table.display"
                          :disabled="!row.enabled" class="w-full">
                          <el-option label="text" value="text" />
                          <el-option label="image-preview" value="image-preview" />
                          <el-option label="dict-tag" value="dict-tag" />
                          <el-option label="el-tag" value="el-tag" />
                          <el-option label="date-format" value="date-format" />
                        </el-select>
                        <el-select v-else-if="row.displayTarget === 'expand'" v-model="row.expand.display"
                          :disabled="!row.enabled" class="w-full">
                          <el-option label="text" value="text" />
                          <el-option label="image-preview" value="image-preview" />
                          <el-option label="dict-tag" value="dict-tag" />
                          <el-option label="el-tag" value="el-tag" />
                          <el-option label="date-format" value="date-format" />
                        </el-select>
                        <span v-else class="text-xs text-slate-400">-</span>
                      </el-descriptions-item>
                    </el-descriptions>

                    <el-descriptions v-if="row.form.enabled" title="添加/编辑弹窗设置" :column="3" border>
                      <el-descriptions-item label="表单控件">
                        <el-select v-model="row.form.widget" :disabled="!row.enabled" class="w-full"
                          @change="ensureFormWidgetConfig(row)">
                          <el-option label="el-input" value="el-input" />
                          <el-option label="el-textarea" value="el-textarea" />
                          <el-option label="el-input-number" value="el-input-number" />
                          <el-option label="el-select" value="el-select" />
                          <el-option label="el-select 多选" value="el-select-multiple" />
                          <el-option label="el-radio" value="el-radio" />
                          <el-option label="el-date-picker" value="el-date-picker" />
                          <el-option label="el-switch" value="el-switch" />
                          <el-option label="ImageUpload" value="image-upload" />
                        </el-select>
                      </el-descriptions-item>
                      <el-descriptions-item v-if="row.form.widget === 'image-upload'" label="上传张数">
                        <el-input-number v-model="row.form.uploadLimit" :min="1" :max="20"
                          controls-position="right" :disabled="!row.enabled" class="w-full" />
                      </el-descriptions-item>
                      <el-descriptions-item label="必填">
                        <el-switch v-model="row.form.required" :disabled="!row.enabled" />
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="是否需要" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="字段" prop="field"  align="center"/>
              <el-table-column label="标题" align="center">
                <template #default="{ row }">
                  <el-input v-model="row.label"  :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="类型" prop="type" align="center"/>
              <el-table-column label="展示位置" align="center">
                <template #default="{ row }">
                  <el-select v-model="row.displayTarget"  :disabled="!row.enabled" class="w-full">
                    <el-option label="主表格" value="table" />
                    <el-option label="展开行" value="expand" />
                    <el-option label="不展示" value="none" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="查询" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.query.enabled" :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="表单" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.form.enabled" :disabled="!row.enabled" />
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="四阶段提示词" name="prompts">
            <el-tabs v-model="activeStep" tab-position="left" class="min-h-130">
              <el-tab-pane v-for="step in promptSteps" :key="step.key" :label="step.title" :name="step.key">
                <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <span class="text-sm text-slate-500">{{ step.description }}</span>
                  <el-button type="primary" plain :icon="CopyDocument" @click="copyText(step.prompt)">
                    复制提示词
                  </el-button>
                </div>
                <el-input :model-value="step.prompt" type="textarea" :rows="22" resize="none" readonly />
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <el-tab-pane label="结构化 JSON" name="json">
            <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span class="text-sm text-slate-500">四份提示词共用的 BuilderConfig 数据</span>
              <el-button type="primary" plain :icon="CopyDocument" @click="copyText(configJson)">
                复制 JSON
              </el-button>
            </div>
            <el-input :model-value="configJson" type="textarea" :rows="24" resize="none" readonly />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </section>

  </main>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  font-family: 'DM Mono', Consolas, monospace;
  line-height: 1.55;
}

.field-expand-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 12px 10px;
}

.expand-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.expand-group-row {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(260px, 1.4fr) auto;
  gap: 10px;
  align-items: center;
}

@media (max-width: 768px) {

  .expand-group-row {
    grid-template-columns: 1fr;
  }
}
</style>
