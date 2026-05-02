<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { skillList } from '../utils/const'

const queryFormRef = ref<FormInstance>()
const fileRootFormRef = ref<FormInstance>()
const queryParams = ref({
  name: '',
})
const activeSkillId = ref('')

const fileRootParams = ref({
  apiFileRoot: '',
  viewFileRoot: '',
})

const fileRootRules = {
  apiFileRoot: [
    { required: true, message: 'Please input api file root', trigger: 'blur' },
  ],
  viewFileRoot: [
    { required: true, message: 'Please input view file root', trigger: 'blur' },
  ],
}

interface SkillModuleFormExpose {
  getFormData: () => Record<string, unknown>
}

const listPagePaginationQueryRef = ref<SkillModuleFormExpose>()
const expandRowDetailRef = ref<SkillModuleFormExpose>()
const generatedJsCode = ref('// 点击「生成数据」后，这里会显示格式化后的对象代码')

function handleQuery() {
  activeSkillId.value = queryParams.value.name
}

function handleReset() {
  queryFormRef.value?.resetFields()
  activeSkillId.value = ''
}

async function handleGenerateData() {
  const valid = await fileRootFormRef.value?.validate().catch(() => false)
  if (!valid)
    return

  let moduleData: Record<string, unknown> = {}
  if (activeSkillId.value === '02' && listPagePaginationQueryRef.value)
    moduleData = listPagePaginationQueryRef.value.getFormData()
  else if (activeSkillId.value === '05' && expandRowDetailRef.value)
    moduleData = expandRowDetailRef.value.getFormData()

  const payload = {
    ...fileRootParams.value,
    ...moduleData,
  }

  generatedJsCode.value = `const payload = ${JSON.stringify(payload, null, 2)}`
}

async function handleCopyGeneratedCode() {
  await navigator.clipboard.writeText(generatedJsCode.value)
  ElMessage({
    type: 'success',
    message: '复制成功',
  })
}
</script>

<template>
  <div class="p-6">
    <el-card shadow="hover">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="150px"
      >
        <el-form-item label="Skill Markdown Name" prop="name">
          <el-select
            v-model="queryParams.name"
            placeholder="Please select a skill"
            clearable
            style="width: 300px"
          >
            <el-option
              v-for="item in skillList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="10">
      <el-col :span="18">
        <el-form
          ref="fileRootFormRef"
          class="mt-4"
          :model="fileRootParams"
          :rules="fileRootRules"
          label-width="120px"
        >
          <div class="flex items-start gap-3">
            <el-form-item
              label="Api File Root"
              prop="apiFileRoot"
              class="min-w-0 flex-1"
            >
              <el-input
                v-model="fileRootParams.apiFileRoot"
                placeholder="Please input"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item
              label="View File Root"
              prop="viewFileRoot"
              class="min-w-0 flex-1"
            >
              <el-input
                v-model="fileRootParams.viewFileRoot"
                placeholder="Please input"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item class="shrink-0">
              <el-button type="success" @click="handleGenerateData">
                生成数据
              </el-button>
            </el-form-item>
          </div>
        </el-form>

        <list-page-pagination-query
          v-if="activeSkillId === '02'"
          ref="listPagePaginationQueryRef"
        />
        <list-page-add-edit v-else-if="activeSkillId === '03'" />
        <list-page-delete-action v-else-if="activeSkillId === '04'" />
        <expand-row-detail
          v-else-if="activeSkillId === '05'"
          ref="expandRowDetailRef"
        />
        <div v-else>
          <el-empty description="Please select a skill" />
        </div>
      </el-col>

      <el-col :span="6">
        <el-card shadow="never" class="mt-4">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">生成结果（JS）</span>
              <el-button type="primary" link @click="handleCopyGeneratedCode">
                复制
              </el-button>
            </div>
          </template>
          <pre class="m-0 overflow-auto text-xs leading-6">{{
            generatedJsCode
          }}</pre>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
