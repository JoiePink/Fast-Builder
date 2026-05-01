<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { skillList } from '../utils/const'

const queryFormRef = ref<FormInstance>()
const queryParams = ref({
  name: '',
})
const activeSkillId = ref('')

const fileRootParams = ref({
  apiFileRoot: '',
  viewFileRoot: '',
})

function handleQuery() {
  activeSkillId.value = queryParams.value.name
}

function handleReset() {
  queryFormRef.value?.resetFields()
  activeSkillId.value = ''
}
</script>

<template>
  <div class="p-2">
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
    <el-form
      class="mt-4"
      :model="fileRootParams"
      :inline="true"
      label-width="150px"
    >
      <el-form-item label="Api File Root">
        <el-input
          v-model="fileRootParams.apiFileRoot"
          placeholder="Please input api file root"
          style="width: 500px"
        />
      </el-form-item>
      <el-form-item label="View File Root">
        <el-input
          v-model="fileRootParams.viewFileRoot"
          placeholder="Please input view file root"
          style="width: 500px"
        />
      </el-form-item>
    </el-form>
    <list-page-pagination-query v-if="activeSkillId === '02'" />
    <list-page-add-edit v-if="activeSkillId === '03'" />
    <list-page-delete-action v-if="activeSkillId === '04'" />
    <expand-row-detail v-if="activeSkillId === '05'" />
    <div v-else>
      <el-empty description="Please select a skill" />
    </div>
  </div>
</template>
