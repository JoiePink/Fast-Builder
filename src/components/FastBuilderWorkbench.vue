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
const fieldDialogOpen = ref(false)
const editingFieldIndex = ref<number>()
const editingField = ref<ParamField>()
const sourcePanelCollapsed = ref(true)

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
    detail: '',
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
const builderConfig = computed(() => buildConfig(meta, paramsList.value, expandConfig))
const configJson = computed(() => JSON.stringify(builderConfig.value, null, 2))
const promptSteps = computed(() => generatePromptSteps(builderConfig.value))

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
    ElMessage.success('已生成五阶段提示词')
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

function openFieldDialog(index = 0) {
  if (!paramsList.value.length) {
    ElMessage.warning('请先解析 paramsList')
    return
  }

  fieldDialogOpen.value = true
  selectEditingField(index)
}

function selectEditingField(index: number) {
  const source = paramsList.value[index]
  if (!source)
    return

  editingFieldIndex.value = index
  editingField.value = normalizeField(cloneField(source))
}

function confirmFieldConfig() {
  if (editingFieldIndex.value === undefined || !editingField.value)
    return

  paramsList.value.splice(editingFieldIndex.value, 1, normalizeField(cloneField(editingField.value)))
  fieldDialogOpen.value = false
  ElMessage.success('字段配置已同步')
}

function cloneField(field: ParamField): ParamField {
  const cloned = JSON.parse(JSON.stringify(field)) as ParamField
  if (cloned.form.widget === 'image-upload' && (!cloned.form.uploadLimit || cloned.form.uploadLimit < 1))
    cloned.form.uploadLimit = 1
  return cloned
}

function normalizeField(field: ParamField): ParamField {
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
</script>

<template>
  <main class="min-h-screen bg-#f5f7fb p-4 text-slate-800 md:p-6">
    <section class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="mb-1 text-sm text-teal-700 font-bold">
          Fast-Builder
        </div>
        <h1 class="m-0 text-2xl font-800 md:text-3xl">
          RuoYi CRUD 五阶段提示词生成器
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
          <el-form-item label="展开子表列数">
            <el-input-number v-model="expandConfig.tableColumnCount" :min="1" :max="8" class="w-full" />
          </el-form-item>
        </el-form>

        <el-divider content-position="left">
          按钮权限配置
        </el-divider>

        <el-form label-position="top" class="grid grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-5">
          <el-form-item label="详情权限">
            <el-input v-model="meta.permissionConfig.detail" placeholder="如 system:customer:query" />
          </el-form-item>
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
              <span class="text-sm text-slate-500">横向表格保留完整总览，也可以在弹窗中集中配置单个字段。</span>
              <div class="flex flex-wrap items-center gap-2">
                <el-switch v-model="meta.exportConfig.enabled" active-text="支持导出" inactive-text="不导出" />
                <el-button type="primary" plain :icon="Setting" @click="openFieldDialog()">
                  字段配置弹窗
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
            <el-table :data="paramsList" border>
              <el-table-column label="是否需要" width="92" align="center" fixed>
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="字段" prop="field" min-width="140" fixed />
              <el-table-column label="标题" min-width="150" fixed>
                <template #default="{ row }">
                  <el-input v-model="row.label" size="small" :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="类型" prop="type" width="110" />
              <el-table-column label="展示位置" min-width="150">
                <template #default="{ row }">
                  <el-select v-model="row.displayTarget" size="small" :disabled="!row.enabled">
                    <el-option label="主表格" value="table" />
                    <el-option label="展开行" value="expand" />
                    <el-option label="不展示" value="none" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="字典类型" min-width="180">
                <template #default="{ row }">
                  <el-input v-model="row.dictType" size="small" :disabled="!row.enabled"
                    placeholder="如 sys_normal_disable" />
                </template>
              </el-table-column>
              <el-table-column label="选项来源" min-width="130">
                <template #default="{ row }">
                  <el-select v-model="row.selectSource" size="small" :disabled="!row.enabled">
                    <el-option label="关联字典" value="dict" />
                    <el-option label="备注映射" value="remark" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="备注映射" min-width="180">
                <template #default="{ row }">
                  <el-input v-model="row.enumRemark" size="small"
                    :disabled="!row.enabled || row.selectSource !== 'remark'" placeholder="如 0是，1否" />
                </template>
              </el-table-column>
              <el-table-column label="查询" width="76" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.query.enabled" :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="查询控件" min-width="150">
                <template #default="{ row }">
                  <el-select v-model="row.query.widget" size="small" :disabled="!row.enabled"
                    @change="ensureDateRangeConfig(row)">
                    <el-option label="el-input" value="el-input" />
                    <el-option label="el-select" value="el-select" />
                    <el-option label="el-date-picker" value="el-date-picker" />
                    <el-option label="el-switch" value="el-switch" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="范围查询" width="92" align="center">
                <template #default="{ row }">
                  <el-switch v-model="normalizeField(row).query.dateRange.enabled"
                    :disabled="!row.enabled || !row.query.enabled || row.query.widget !== 'el-date-picker'"
                    @change="ensureDateRangeConfig(row)" />
                </template>
              </el-table-column>
              <el-table-column label="范围参数" min-width="210">
                <template #default="{ row }">
                  <span v-if="normalizeField(row).query.dateRange.enabled" class="text-xs text-slate-600">
                    {{ row.query.dateRange.paramCount === 1 ? row.query.dateRange.beginParam
                      : `${row.query.dateRange.beginParam} / ${row.query.dateRange.endParam}` }}
                  </span>
                  <span v-else class="text-xs text-slate-400">-</span>
                </template>
              </el-table-column>
              <el-table-column label="主表展示" min-width="160">
                <template #default="{ row }">
                  <el-select v-model="row.table.display" size="small"
                    :disabled="!row.enabled || row.displayTarget !== 'table'">
                    <el-option label="text" value="text" />
                    <el-option label="image-preview" value="image-preview" />
                    <el-option label="dict-tag" value="dict-tag" />
                    <el-option label="el-tag" value="el-tag" />
                    <el-option label="date-format" value="date-format" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="展开模式" min-width="140">
                <template #default="{ row }">
                  <el-select v-model="row.expand.mode" size="small"
                    :disabled="!row.enabled || row.displayTarget !== 'expand'">
                    <el-option label="描述项" value="description" />
                    <el-option label="子表格" value="table" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="展开展示" min-width="160">
                <template #default="{ row }">
                  <el-select v-model="row.expand.display" size="small"
                    :disabled="!row.enabled || row.displayTarget !== 'expand' || row.expand.mode !== 'description'">
                    <el-option label="text" value="text" />
                    <el-option label="image-preview" value="image-preview" />
                    <el-option label="dict-tag" value="dict-tag" />
                    <el-option label="el-tag" value="el-tag" />
                    <el-option label="date-format" value="date-format" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="详情" width="76" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.detail.enabled" :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="表单" width="76" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.form.enabled" :disabled="!row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="表单控件" min-width="150">
                <template #default="{ row }">
                  <el-select v-model="row.form.widget" size="small" :disabled="!row.enabled"
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
                </template>
              </el-table-column>
              <el-table-column label="上传张数" width="110" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.form.uploadLimit" size="small" :min="1" :max="20"
                    controls-position="right"
                    :disabled="!row.enabled || !row.form.enabled || row.form.widget !== 'image-upload'"
                    class="w-full" />
                </template>
              </el-table-column>
              <el-table-column label="必填" width="76" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.form.required" :disabled="!row.enabled" />
                </template>
              </el-table-column>
            </el-table>
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
                <el-input :model-value="step.prompt" type="textarea" :rows="22" resize="none" readonly />
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <el-tab-pane label="结构化 JSON" name="json">
            <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span class="text-sm text-slate-500">五份提示词共用的 BuilderConfig 数据</span>
              <el-button type="primary" plain :icon="CopyDocument" @click="copyText(configJson)">
                复制 JSON
              </el-button>
            </div>
            <el-input :model-value="configJson" type="textarea" :rows="24" resize="none" readonly />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </section>

    <el-dialog v-model="fieldDialogOpen" title="字段配置" width="min(920px, calc(100vw - 32px))" append-to-body
      destroy-on-close>
      <el-form v-if="editingField" label-position="top" class="field-config-form">
        <section class="field-config-section">
          <div class="field-config-title">
            <span>字段选择</span>
            <el-switch v-model="editingField.enabled" active-text="需要" inactive-text="不需要" />
          </div>
          <div class="field-config-grid field-config-grid--three">
            <el-form-item label="选择字段">
              <el-select :model-value="editingFieldIndex" class="w-full" @update:model-value="selectEditingField">
                <el-option v-for="(item, index) in paramsList" :key="item.field"
                  :label="`${item.field} - ${item.label}`" :value="index" />
              </el-select>
            </el-form-item>

            <el-form-item label="字段名">
              <el-input v-model="editingField.field" disabled />
            </el-form-item>

            <el-form-item label="字段类型">
              <el-input v-model="editingField.type" disabled />
            </el-form-item>

            <el-form-item label="标题">
              <el-input v-model="editingField.label" :disabled="!editingField.enabled" />
            </el-form-item>

            <el-form-item label="展示位置">
              <el-select v-model="editingField.displayTarget" :disabled="!editingField.enabled" class="w-full">
                <el-option label="主表格" value="table" />
                <el-option label="展开行" value="expand" />
                <el-option label="不展示" value="none" />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="field-config-section">
          <div class="field-config-title">
            <span>字典与枚举</span>
          </div>
          <div class="field-config-grid field-config-grid--three">
            <el-form-item label="选项来源">
              <el-select v-model="editingField.selectSource" :disabled="!editingField.enabled" class="w-full">
                <el-option label="关联字典" value="dict" />
                <el-option label="备注映射" value="remark" />
              </el-select>
            </el-form-item>

            <el-form-item label="字典类型">
              <el-input v-model="editingField.dictType" :disabled="!editingField.enabled"
                placeholder="如 sys_normal_disable" />
            </el-form-item>

            <el-form-item label="备注映射">
              <el-input v-model="editingField.enumRemark"
                :disabled="!editingField.enabled || editingField.selectSource !== 'remark'" placeholder="如 0是，1否" />
            </el-form-item>
          </div>
        </section>

        <section class="field-config-section">
          <div class="field-config-title">
            <span>条件查询</span>
            <el-switch v-model="editingField.query.enabled" :disabled="!editingField.enabled" active-text="启用"
              inactive-text="关闭" />
          </div>
          <div class="field-config-grid field-config-grid--two">
            <el-form-item label="查询控件">
              <el-select v-model="editingField.query.widget"
                :disabled="!editingField.enabled || !editingField.query.enabled" class="w-full"
                @change="ensureDateRangeConfig(editingField)">
                <el-option label="el-input" value="el-input" />
                <el-option label="el-select" value="el-select" />
                <el-option label="el-date-picker" value="el-date-picker" />
                <el-option label="el-switch" value="el-switch" />
              </el-select>
            </el-form-item>

            <el-form-item label="日期范围查询">
              <el-switch v-model="editingField.query.dateRange.enabled"
                :disabled="!editingField.enabled || !editingField.query.enabled || editingField.query.widget !== 'el-date-picker'"
                active-text="启用" inactive-text="关闭" @change="ensureDateRangeConfig(editingField)" />
            </el-form-item>

            <template v-if="editingField.query.dateRange.enabled">
              <el-form-item label="范围变量名">
                <el-input v-model="editingField.query.dateRange.model"
                  :disabled="!editingField.enabled || !editingField.query.enabled" placeholder="如 dateRange" />
              </el-form-item>

              <el-form-item label="真实参数数量">
                <el-radio-group v-model="editingField.query.dateRange.paramCount"
                  :disabled="!editingField.enabled || !editingField.query.enabled">
                  <el-radio-button :value="1">
                    1个
                  </el-radio-button>
                  <el-radio-button :value="2">
                    2个
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item :label="editingField.query.dateRange.paramCount === 1 ? '接口参数名' : '开始参数名'">
                <el-input v-model="editingField.query.dateRange.beginParam"
                  :disabled="!editingField.enabled || !editingField.query.enabled" placeholder="如 createTimeBegin" />
              </el-form-item>

              <el-form-item v-if="editingField.query.dateRange.paramCount === 2" label="结束参数名">
                <el-input v-model="editingField.query.dateRange.endParam"
                  :disabled="!editingField.enabled || !editingField.query.enabled" placeholder="如 createTimeEnd" />
              </el-form-item>
            </template>
          </div>
        </section>

        <section class="field-config-section">
          <div class="field-config-title">
            <span>列表与展开</span>
          </div>
          <div class="field-config-grid field-config-grid--two">
            <el-form-item label="主表展示">
              <el-select v-model="editingField.table.display"
                :disabled="!editingField.enabled || editingField.displayTarget !== 'table'" class="w-full">
                <el-option label="text" value="text" />
                <el-option label="image-preview" value="image-preview" />
                <el-option label="dict-tag" value="dict-tag" />
                <el-option label="el-tag" value="el-tag" />
                <el-option label="date-format" value="date-format" />
              </el-select>
            </el-form-item>

            <el-form-item label="展开模式">
              <el-select v-model="editingField.expand.mode"
                :disabled="!editingField.enabled || editingField.displayTarget !== 'expand'" class="w-full">
                <el-option label="描述项" value="description" />
                <el-option label="子表格" value="table" />
              </el-select>
            </el-form-item>

            <el-form-item label="展开展示">
              <el-select v-model="editingField.expand.display"
                :disabled="!editingField.enabled || editingField.displayTarget !== 'expand' || editingField.expand.mode !== 'description'"
                class="w-full">
                <el-option label="text" value="text" />
                <el-option label="image-preview" value="image-preview" />
                <el-option label="dict-tag" value="dict-tag" />
                <el-option label="el-tag" value="el-tag" />
                <el-option label="date-format" value="date-format" />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="field-config-section">
          <div class="field-config-title">
            <span>详情展示</span>
            <el-switch v-model="editingField.detail.enabled" :disabled="!editingField.enabled" active-text="启用"
              inactive-text="关闭" />
          </div>
        </section>

        <section class="field-config-section">
          <div class="field-config-title">
            <span>新增 / 修改表单</span>
            <el-switch v-model="editingField.form.enabled" :disabled="!editingField.enabled" active-text="启用"
              inactive-text="关闭" />
          </div>
          <div class="field-config-grid field-config-grid--two">
            <el-form-item label="表单控件">
              <el-select v-model="editingField.form.widget"
                :disabled="!editingField.enabled || !editingField.form.enabled" class="w-full"
                @change="ensureFormWidgetConfig(editingField)">
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
            </el-form-item>

            <el-form-item v-if="editingField.form.widget === 'image-upload'" label="最多上传张数">
              <el-input-number v-model="editingField.form.uploadLimit" :min="1" :max="20" controls-position="right"
                :disabled="!editingField.enabled || !editingField.form.enabled" class="w-full" />
            </el-form-item>

            <el-form-item label="是否必填">
              <el-switch v-model="editingField.form.required"
                :disabled="!editingField.enabled || !editingField.form.enabled" />
            </el-form-item>
          </div>
        </section>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="fieldDialogOpen = false">
            取消
          </el-button>
          <el-button type="primary" @click="confirmFieldConfig">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped>
:deep(.el-textarea__inner) {
  font-family: 'DM Mono', Consolas, monospace;
  line-height: 1.55;
}

.field-config-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-config-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px 14px 2px;
}

.field-config-title {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.field-config-grid {
  display: grid;
  gap: 0 14px;
}

.field-config-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-config-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 768px) {

  .field-config-grid,
  .field-config-grid--two,
  .field-config-grid--three {
    grid-template-columns: 1fr;
  }
}
</style>
