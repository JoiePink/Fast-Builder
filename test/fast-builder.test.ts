import { describe, expect, it } from 'vitest'
import { buildConfig, createDefaultExpandConfig, generatePromptSteps, parseApiFoxJson } from '../src/utils/fast-builder'
import type { BuilderMeta } from '../src/types/fast-builder'

function createMeta(): BuilderMeta {
  return {
    businessName: '菜单',
    pageName: '菜单管理',
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
  }
}

describe('fast-builder sort fields', () => {
  it('uses number input for sort fields parsed from response json', () => {
    const result = parseApiFoxJson(JSON.stringify({
      rows: [
        {
          id: 1,
          menuName: '系统管理',
          sortOrder: 10,
        },
      ],
    }))

    const sortField = result.paramsList.find(item => item.field === 'sortOrder')

    expect(sortField?.type).toBe('number')
    expect(sortField?.form.widget).toBe('el-input-number')
  })

  it('includes number input guidance in generated form prompt', () => {
    const result = parseApiFoxJson(JSON.stringify({
      rows: [
        {
          id: 1,
          name: '分类',
          orderNum: 1,
        },
      ],
    }))
    const config = buildConfig(createMeta(), result.paramsList, createDefaultExpandConfig())
    const formPrompt = generatePromptSteps(config).find(item => item.key === 'step3_form')?.prompt

    expect(formPrompt).toContain('el-input-number')
    expect(formPrompt).toContain('orderNum')
  })
})
