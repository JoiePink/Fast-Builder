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
  it('generates four prompt steps without detail step', () => {
    const result = parseApiFoxJson(JSON.stringify({
      rows: [
        {
          id: 1,
          name: '分类',
        },
      ],
    }))
    const config = buildConfig(createMeta(), result.paramsList, createDefaultExpandConfig())
    const steps = generatePromptSteps(config)

    expect(steps.map(item => item.key)).toEqual([
      'step1_query_page',
      'step3_form',
      'step4_delete',
      'step5_expand_row',
    ])
    expect(config.apiNames.detail).toBe('getData')
  })

  it('includes default create time sorting guidance in generated query prompt', () => {
    const result = parseApiFoxJson(JSON.stringify({
      rows: [
        {
          id: 1,
          name: '分类',
          createTime: '2026-06-06 00:00:00',
        },
      ],
    }))
    const config = buildConfig(createMeta(), result.paramsList, createDefaultExpandConfig())
    const queryPrompt = generatePromptSteps(config).find(item => item.key === 'step1_query_page')?.prompt

    expect(queryPrompt).toContain("orderByColumn: 'createTime'")
    expect(queryPrompt).toContain("isAsc: 'desc'")
    expect(queryPrompt).toContain('不要把 orderByColumn、isAsc 生成成查询表单控件')
  })

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

  it('builds description-only expand groups', () => {
    const result = parseApiFoxJson(JSON.stringify({
      rows: [
        {
          id: 1,
          name: '分类',
          remark: '备注',
        },
      ],
    }))
    const nameField = result.paramsList.find(item => item.field === 'name')
    const remarkField = result.paramsList.find(item => item.field === 'remark')

    if (nameField)
      nameField.displayTarget = 'expand'
    if (remarkField)
      remarkField.displayTarget = 'expand'

    const expandConfig = createDefaultExpandConfig()
    expandConfig.groups.push({
      title: '基础信息',
      fields: ['name', 'remark', 'missingField'],
    })

    const config = buildConfig(createMeta(), result.paramsList, expandConfig)
    const expandPrompt = generatePromptSteps(config).find(item => item.key === 'step5_expand_row')?.prompt

    expect(config.expandConfig).toMatchObject({
      enabled: true,
      descriptionColumn: 4,
      groups: [
        {
          title: '基础信息',
          fields: ['name', 'remark'],
        },
      ],
    })
    expect(config.expandFields[0].expand).not.toHaveProperty('mode')
    expect(config.expandFields[0].expand).not.toHaveProperty('tableColumns')
    expect(config.expandConfig).not.toHaveProperty('tableEnabled')
    expect(expandPrompt).toContain('expandConfig.groups')
    expect(expandPrompt).not.toContain('expand.mode')
    expect(expandPrompt).not.toContain('expand.tableColumns')
  })

  it('parses object response fields and flattens children in generated config', () => {
    const result = parseApiFoxJson(JSON.stringify({
      openapi: '3.0.1',
      paths: {
        '/system/user/list': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        rows: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer', description: 'ID' },
                              profile: {
                                type: 'object',
                                description: '用户资料',
                                properties: {
                                  nickName: { type: 'string', description: '昵称' },
                                  avatar: { type: 'string', description: '头像' },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {},
      },
    }))

    const profileField = result.paramsList.find(item => item.field === 'profile')
    const nickNameField = profileField?.children.find(item => item.field === 'profile.nickName')

    if (nickNameField)
      nickNameField.displayTarget = 'expand'

    const config = buildConfig(createMeta(), result.paramsList, createDefaultExpandConfig())

    expect(profileField?.type).toBe('object')
    expect(profileField?.children.map(item => item.field)).toEqual(['profile.nickName', 'profile.avatar'])
    expect(config.paramsList.map(item => item.field)).toEqual(['id', 'profile.nickName', 'profile.avatar'])
    expect(config.paramsList.some(item => item.field === 'profile')).toBe(false)
    expect(config.expandFields.map(item => item.field)).toEqual(['profile.nickName'])
    expect(generatePromptSteps(config).find(item => item.key === 'step5_expand_row')?.prompt).toContain('"field": "profile.nickName"')
  })

  it('parses request body schema as table operation config', () => {
    const result = parseApiFoxJson(`
\`\`\`yaml
openapi: 3.0.1
paths:
  /admin/lawyerAuthentication/process/audit:
    post:
      summary: 审核认证
      operationId: audit
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProcessAuditCommand'
      responses:
        '200':
          description: OK
components:
  schemas:
    ProcessAuditCommand:
      required:
        - action
        - id
      type: object
      properties:
        id:
          type: integer
          description: 主键
        action:
          type: integer
          description: 10通过 20拒绝
        auditOpinion:
          type: string
          description: 批注
      x-apifox-orders:
        - id
        - action
        - auditOpinion
\`\`\`
`)

    expect(result.paramsList).toEqual([])
    expect(result.operationConfig).toMatchObject({
      enabled: true,
      operationName: '审核认证',
      apiName: 'audit',
      apiPath: '/admin/lawyerAuthentication/process/audit',
      method: 'post',
    })
    expect(result.operationConfig?.fields.map(item => ({
      field: item.field,
      required: item.required,
      widget: item.widget,
    }))).toEqual([
      { field: 'id', required: true, widget: 'el-input-number' },
      { field: 'action', required: true, widget: 'el-input-number' },
      { field: 'auditOpinion', required: false, widget: 'el-input' },
    ])
  })
})
