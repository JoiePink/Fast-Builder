import { parse as parseYaml } from 'yaml'
import type { BuilderConfig, BuilderMeta, ExpandConfig, ExpandGroup, FieldType, FormWidget, OperationConfig, OperationFieldConfig, ParamField, PromptStep, PromptStepKey, QueryWidget, TableDisplay } from '~/types/fast-builder'

export function parseApiFoxJson(rawJson = '') {
  if (!rawJson.trim())
    throw new Error('请先粘贴 ApiFox 分页响应 JSON 或 OpenAPI Schema')

  const parsed = parseInput(rawJson)
  const schemaResult = parseOpenApiSchema(parsed, rawJson)
  if (schemaResult)
    return schemaResult

  const { rows, path } = extractRows(parsed)

  if (!rows.length)
    throw new Error('未找到分页列表数组或 ApiFox OpenAPI Schema，请确认内容中存在 rows、records、list、data.rows、data.records 或 openapi/paths/components。')

  const fields = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
  const paramsList = fields.map((field) => {
    const sample = rows.find(row => row[field] !== undefined)?.[field]
    const fieldConfig = createParamField(field, inferType(field, sample), sample, path)
    fieldConfig.children = createFieldsFromObjectSample(field, sample, `${path}.${field}`)
    return fieldConfig
  })

  return {
    paramsList,
    sourcePath: path,
    mode: 'response-json' as const,
    operationConfig: createDefaultOperationConfig(),
    responseParamCount: paramsList.length,
  }
}

export function getDefaultPrimaryKey(paramsList: ParamField[]) {
  return paramsList.find(item => /^id$/i.test(item.field) || /Id$/.test(item.field))?.field || paramsList[0]?.field || 'id'
}

export function createDefaultExpandConfig(): ExpandConfig {
  return {
    enabled: false,
    descriptionColumn: 4,
    groups: [],
  }
}

export function createDefaultOperationConfig(): OperationConfig {
  return {
    enabled: false,
    operationName: '',
    icon: 'Edit',
    permission: '',
    apiPath: '',
    apiName: '',
    method: 'post',
    visibleRemark: '',
    fields: [],
  }
}

function parseInput(rawJson: string) {
  try {
    return JSON.parse(rawJson)
  }
  catch {
    const yamlSource = extractYamlSource(rawJson)
    if (!yamlSource)
      throw new Error('JSON 解析失败，且未找到 ApiFox OpenAPI YAML 代码块')
    return parseYaml(yamlSource)
  }
}

function extractYamlSource(raw: string) {
  // 提取 YAML 代码块
  /**
   * ```三个反引号,markdown代码块开头
   * (?:ya?ml)? 可选 yaml 或 yml 或 没有
   * \s* 语言标记后面可有可无的空白
   * [\s\S]*? 捕获组：真正要的内容（任意字符，非贪婪）
   * ``` 三个反引号,markdown代码块结尾
   * i 忽略大小写
   */
  const codeBlock = raw.match(/```(?:ya?ml)?\s*([\s\S]*?)```/i)
  if (codeBlock?.[1])
    return codeBlock[1].trim()
  if (/openapi:\s*3\./.test(raw) && /paths:\s*/.test(raw))
    return raw.trim()
  return ''
}

function parseOpenApiSchema(parsed: unknown, raw: string) {
  const doc = isRecord(parsed) ? parsed : parseYaml(extractYamlSource(raw) || raw)
  if (!isRecord(doc) || !isRecord(doc.paths) || !isRecord(doc.components))
    return undefined

  const operationInfo = findListOperation(doc)
  if (!operationInfo)
    return undefined

  const responseSchema = getSuccessResponseSchema(operationInfo.operation)
  const listItemSchema = findListItemSchema(doc, responseSchema)
  const responseFields = listItemSchema ? createFieldsFromSchema(listItemSchema, `schema:${operationInfo.path}.response`, doc) : []
  const queryFields = createQueryFields(operationInfo.operation, `schema:${operationInfo.path}.query`)
  const mergedFields = mergeQueryAndResponseFields(responseFields, queryFields)
  const operationConfig = createOperationConfig(doc, operationInfo.path, operationInfo.method, operationInfo.operation)

  if (!mergedFields.length && !operationConfig.enabled)
    return undefined

  return {
    paramsList: mergedFields,
    sourcePath: `schema:${operationInfo.path}`,
    mode: 'openapi-schema' as const,
    apiPath: operationInfo.path,
    operationConfig,
    queryParamCount: queryFields.length,
    responseParamCount: responseFields.length,
  }
}

function createOperationConfig(doc: Record<string, unknown>, path: string, method: string, operation: Record<string, unknown>): OperationConfig {
  const schema = getRequestBodySchema(operation)
  if (!schema)
    return createDefaultOperationConfig()

  const resolvedSchema = resolveSchema(doc, schema)
  if (!isRecord(resolvedSchema))
    return createDefaultOperationConfig()

  const operationId = readableText(operation.operationId)
  const summary = readableText(operation.summary)

  return {
    ...createDefaultOperationConfig(),
    enabled: true,
    operationName: summary || operationId || '操作',
    apiPath: path,
    apiName: operationId || guessApiName(path),
    method,
    fields: createOperationFieldsFromSchema(resolvedSchema),
  }
}

function getRequestBodySchema(operation: Record<string, unknown>) {
  const requestBody = operation.requestBody
  if (!isRecord(requestBody) || !isRecord(requestBody.content))
    return undefined

  const contentItems = Object.values(requestBody.content)
  const content = contentItems.find((item): item is Record<string, unknown> => isRecord(item) && isRecord(item.schema))
  return content?.schema
}

function createOperationFieldsFromSchema(schema: Record<string, unknown>): OperationFieldConfig[] {
  const properties = schema.properties
  if (!isRecord(properties))
    return []

  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : []
  const orders = Array.isArray(schema['x-apifox-orders']) ? schema['x-apifox-orders'].filter((item): item is string => typeof item === 'string') : []
  const fieldNames = orders.length ? orders.filter(field => field in properties) : Object.keys(properties)

  return fieldNames.map((field) => {
    const property = isRecord(properties[field]) ? properties[field] : {}
    const type = schemaToFieldType(field, property)
    const description = readableText(property.description)
    const dictType = defaultDictType(field)
    return {
      field,
      label: description || guessLabel(field),
      type,
      widget: defaultOperationWidget(type, field),
      required: required.includes(field),
      dictType,
      selectSource: dictType ? 'dict' : 'remark',
      enumRemark: description,
    }
  })
}

function defaultOperationWidget(type: FieldType, field = ''): FormWidget {
  if (type === 'number')
    return 'el-input-number'
  return defaultFormWidget(type, field)
}

function guessApiName(path: string) {
  const segments = path.split('/').filter(Boolean)
  const last = segments.at(-1) || 'operate'
  return last.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

function findListOperation(doc: Record<string, unknown>) {
  const paths = doc.paths as Record<string, unknown>
  const methodNames = ['get', 'post', 'put', 'delete']

  for (const [path, pathConfig] of Object.entries(paths)) {
    if (!isRecord(pathConfig))
      continue
    for (const method of methodNames) {
      const operation = pathConfig[method]
      if (isRecord(operation) && (Array.isArray(operation.parameters) || operation.responses))
        return { path, method, operation }
    }
  }

  return undefined
}

function getSuccessResponseSchema(operation: Record<string, unknown>) {
  const responses = operation.responses
  if (!isRecord(responses))
    return undefined

  const successResponse = responses['200'] || responses.default
  if (!isRecord(successResponse) || !isRecord(successResponse.content))
    return undefined

  const contentSchema = Object.values(successResponse.content).find((item): item is Record<string, unknown> => isRecord(item) && isRecord(item.schema))
  return contentSchema?.schema
}

function findListItemSchema(doc: Record<string, unknown>, schema: unknown) {
  const resolved = resolveSchema(doc, schema)
  if (!isRecord(resolved))
    return undefined

  const listSchema = findListArraySchema(doc, resolved)
  if (!isRecord(listSchema) || !isRecord(listSchema.items))
    return undefined

  return resolveSchema(doc, listSchema.items)
}

function findListArraySchema(doc: Record<string, unknown>, schema: Record<string, unknown>): unknown {
  const properties = schema.properties
  if (!isRecord(properties))
    return undefined

  for (const key of ['rows', 'records', 'list']) {
    const property = properties[key]
    const resolved = resolveSchema(doc, property)
    if (isRecord(resolved) && resolved.type === 'array')
      return resolved
  }

  for (const property of Object.values(properties)) {
    const resolved = resolveSchema(doc, property)
    if (isRecord(resolved) && resolved.type === 'array')
      return resolved
  }

  return undefined
}

function resolveSchema(doc: Record<string, unknown>, schema: unknown): unknown {
  if (!isRecord(schema))
    return schema

  const ref = schema.$ref
  if (typeof ref !== 'string')
    return schema

  const segments = ref.replace(/^#\//, '').split('/')
  let current: unknown = doc
  for (const segment of segments) {
    if (!isRecord(current))
      return schema
    current = current[segment]
  }
  return current
}

function createFieldsFromSchema(schema: unknown, sourcePath: string, doc?: Record<string, unknown>) {
  const resolved = isRecord(schema) ? schema : undefined
  const properties = resolved?.properties
  if (!isRecord(properties))
    return []

  const orders = Array.isArray(resolved?.['x-apifox-orders']) ? resolved['x-apifox-orders'].filter((item): item is string => typeof item === 'string') : []
  const fieldNames = orders.length ? orders.filter(field => field in properties) : Object.keys(properties)

  return fieldNames.map((field) => {
    const property = isRecord(properties[field])
      ? (doc && isRecord(resolveSchema(doc, properties[field])) ? resolveSchema(doc, properties[field]) as Record<string, unknown> : properties[field])
      : {}
    const type = schemaToFieldType(field, property)
    const fieldConfig = createParamField(field, type, schemaExample(property), sourcePath)
    applySchemaLabel(fieldConfig, property)
    fieldConfig.children = createChildFieldsFromSchema(field, property, `${sourcePath}.${field}`, doc)
    return fieldConfig
  })
}

function createChildFieldsFromSchema(parentField: string, schema: Record<string, unknown>, sourcePath: string, doc?: Record<string, unknown>) {
  const properties = schema.properties
  if (!isRecord(properties))
    return []

  const orders = Array.isArray(schema['x-apifox-orders']) ? schema['x-apifox-orders'].filter((item): item is string => typeof item === 'string') : []
  const fieldNames = orders.length ? orders.filter(field => field in properties) : Object.keys(properties)

  return fieldNames.map((field) => {
    const property = isRecord(properties[field])
      ? (doc && isRecord(resolveSchema(doc, properties[field])) ? resolveSchema(doc, properties[field]) as Record<string, unknown> : properties[field])
      : {}
    const type = schemaToFieldType(field, property)
    const fieldConfig = createParamField(`${parentField}.${field}`, type, schemaExample(property), sourcePath, {
      rawField: field,
      parentField,
    })
    applySchemaLabel(fieldConfig, property)
    fieldConfig.children = createChildFieldsFromSchema(fieldConfig.field, property, `${sourcePath}.${field}`, doc)
    return fieldConfig
  })
}

function createQueryFields(operation: Record<string, unknown>, sourcePath: string) {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : []

  return parameters
    .filter((parameter): parameter is Record<string, unknown> => isRecord(parameter) && parameter.in === 'query' && typeof parameter.name === 'string')
    .filter(parameter => !isIgnoredQueryParam(parameter.name as string))
    .map((parameter) => {
      const field = parameter.name as string
      const schema = isRecord(parameter.schema) ? parameter.schema : {}
      const type = schemaToFieldType(field, schema)
      const fieldConfig = createParamField(field, type, parameter.example ?? schemaExample(schema), sourcePath)
      applySchemaLabel(fieldConfig, {
        ...schema,
        description: readableText(parameter.description) || readableText(schema.description),
      })
      fieldConfig.query.enabled = true
      fieldConfig.displayTarget = 'none'
      fieldConfig.form.enabled = false
      return fieldConfig
    })
}

function mergeQueryAndResponseFields(responseFields: ParamField[], queryFields: ParamField[]) {
  const merged = responseFields.map(field => cloneParamField(field))
  const fieldMap = new Map(merged.map(field => [field.field, field]))

  for (const queryField of queryFields) {
    const target = fieldMap.get(queryField.field)
    if (target) {
      target.query = queryField.query
      if (!target.label || target.label === guessLabel(target.field))
        target.label = queryField.label
      if (queryField.enumRemark && !target.enumRemark)
        target.enumRemark = queryField.enumRemark
      if (queryField.dictType && !target.dictType)
        target.dictType = queryField.dictType
    }
    else {
      merged.push(queryField)
    }
  }

  return merged
}

function applySchemaLabel(field: ParamField, schema: Record<string, unknown>) {
  const text = readableText(schema.description) || readableText(schema.title)
  if (!text)
    return

  const parsed = splitDescription(text)
  field.label = parsed.label || field.label
  if (parsed.enumRemark) {
    field.enumRemark = parsed.enumRemark
    field.selectSource = field.dictType ? 'dict' : 'remark'
  }
}

function splitDescription(description: string) {
  const match = description.match(/^([^（(]+)[（(]([^）)]+)[）)]/)
  if (!match)
    return { label: description.trim(), enumRemark: '' }

  return {
    label: match[1].trim(),
    enumRemark: match[2].trim(),
  }
}

function readableText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function schemaToFieldType(field: string, schema: Record<string, unknown>): FieldType {
  const type = String(schema.type || '')
  const format = String(schema.format || '')

  if (type === 'array')
    return 'array'
  if (type === 'object' || isRecord(schema.properties))
    return 'object'
  if (type === 'boolean')
    return 'boolean'
  if (type === 'integer' || type === 'number')
    return 'number'
  if (format === 'date-time')
    return 'datetime'
  if (format === 'date')
    return 'date'
  return inferType(field, schemaExample(schema))
}

function schemaExample(schema: Record<string, unknown>) {
  if ('example' in schema)
    return schema.example
  if (schema.type === 'integer' || schema.type === 'number')
    return 0
  if (schema.type === 'boolean')
    return false
  if (schema.type === 'array')
    return []
  if (schema.type === 'object' || isRecord(schema.properties))
    return {}
  if (schema.format === 'date-time')
    return '2026-06-06 00:00:00'
  if (schema.format === 'date')
    return '2026-06-06'
  return ''
}

function isIgnoredQueryParam(field: string) {
  return ['pageNum', 'pageSize', 'orderByColumn', 'isAsc', 'params'].includes(field)
}

function cloneParamField(field: ParamField): ParamField {
  return JSON.parse(JSON.stringify(field))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function buildConfig(meta: BuilderMeta, paramsList: ParamField[], expandConfig = createDefaultExpandConfig()): BuilderConfig {
  const flatParamsList = flattenParamFields(paramsList)
  const enabledFields = flatParamsList.filter(item => item.enabled)
  const expandFields = enabledFields.filter(item => item.displayTarget === 'expand')
  const expandGroups = normalizeExpandGroups(expandConfig, expandFields)

  return {
    businessName: meta.businessName || '业务',
    pageName: meta.pageName || '业务管理',
    apiNames: {
      list: meta.listApi || 'listData',
      detail: meta.detailApi || 'getData',
      add: meta.addApi || 'addData',
      update: meta.updateApi || 'updateData',
      remove: meta.removeApi || 'delData',
    },
    apiPaths: {
      list: meta.listPath,
    },
    permissionConfig: {
      add: meta.permissionConfig.add,
      edit: meta.permissionConfig.edit,
      remove: meta.permissionConfig.remove,
      export: meta.permissionConfig.export,
    },
    exportConfig: {
      enabled: meta.exportConfig.enabled,
      url: meta.exportConfig.url,
      fileName: meta.exportConfig.fileName || meta.businessName || '业务',
    },
    paramsList: enabledFields,
    ignoredFields: flatParamsList.filter(item => !item.enabled),
    queryFields: enabledFields.filter(item => item.query.enabled),
    tableColumns: enabledFields.filter(item => item.displayTarget === 'table'),
    expandFields,
    formFields: enabledFields.filter(item => item.form.enabled),
    deleteConfig: {
      primaryKey: meta.primaryKey || 'id',
      confirmText: `是否确认删除选中的${meta.businessName || '业务'}数据项？`,
      refreshAfterDelete: true,
    },
    expandConfig: {
      ...expandConfig,
      enabled: expandFields.length > 0,
      groups: expandGroups,
    },
  }
}

function flattenParamFields(paramsList: ParamField[]): ParamField[] {
  return paramsList.flatMap((field) => {
    const children = flattenParamFields(field.children || [])
    return field.type === 'object' && children.length ? children : [field, ...children]
  })
}

function normalizeExpandGroups(expandConfig: ExpandConfig, expandFields: ParamField[]): ExpandGroup[] {
  if (!expandFields.length)
    return []

  const fieldSet = new Set(expandFields.map(item => item.field))
  const groups = (expandConfig.groups || [])
    .map(group => ({
      title: group.title || '',
      fields: group.fields.filter(field => fieldSet.has(field)),
    }))
    .filter(group => group.fields.length > 0)

  if (groups.length)
    return groups

  return [{
    title: '',
    fields: expandFields.map(item => item.field),
  }]
}

export function generatePromptSteps(config: BuilderConfig): PromptStep[] {
  return [
    {
      key: 'step1_query_page',
      title: '第一次：条件 + 分页查询 + 导出',
      description: '只生成查询表单、列表表格、分页、重置、列表请求与可选导出逻辑。',
      prompt: generatePrompt('step1_query_page', config),
    },
    {
      key: 'step3_form',
      title: '第二次：新增 / 修改弹窗',
      description: '只在已有页面基础上新增和修改弹窗表单能力。',
      prompt: generatePrompt('step3_form', config),
    },
    {
      key: 'step4_delete',
      title: '第三次：单条删除',
      description: '只在已有页面基础上新增单条删除能力。',
      prompt: generatePrompt('step4_delete', config),
    },
    {
      key: 'step5_expand_row',
      title: '第四次：展开行',
      description: '只在已有列表页基础上新增展开/折叠与展开行展示。',
      prompt: generatePrompt('step5_expand_row', config),
    },
  ]
}

export function generateOperationPrompt(config: OperationConfig) {
  return `请使用 ruoyi-fast-crud skill，在已有分页列表页面中增量添加一个表格操作。

【本次只做】
只在 el-table 操作列中添加“${config.operationName || '操作'}”按钮，并使用 el-dialog + el-form 完成操作提交。

【实现要求】
1. 不要重写列表查询、分页、导出、新增、修改、删除、详情等既有逻辑。
2. 在 el-table 操作列中添加按钮；按钮文案使用 operationName，图标使用 ElementPlus 图标 ${config.icon || 'Edit'}。
3. 如果 permission 有值，按钮按目标项目相邻页面的权限指令风格添加权限控制。
4. 按 visibleRemark 判断按钮显示条件；如果备注只是自然语言，请结合当前行字段推断最贴近的 v-if 条件，并在实现中保持简单可读。
5. 点击按钮打开 el-dialog，弹窗内使用 el-form，字段来自 fields。
6. 表单提交调用 ${config.apiName || 'operationApi'}，接口地址参考 ${config.method.toUpperCase()} ${config.apiPath}。
7. 提交参数包含配置中的所有字段；通常 id 从当前行带入，其余字段由弹窗填写。
8. fields 中 required 为 true 的字段必须加入表单校验。
9. widget 为 el-select / el-radio 时，优先按 enumRemark 生成静态选项；如果 dictType 有值，复用项目字典写法。
10. 提交成功后关闭弹窗，提示成功，并刷新列表。

【操作配置 JSON】
\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`
`
}

function extractRows(input: unknown): { rows: Record<string, unknown>[], path: string } {
  const paths = [
    ['data', 'rows'],
    ['data', 'records'],
    ['data', 'list'],
    ['rows'],
    ['records'],
    ['list'],
  ]

  for (const path of paths) {
    let current: unknown = input
    for (const segment of path) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        current = undefined
        break
      }
      current = (current as Record<string, unknown>)[segment]
    }

    if (Array.isArray(current)) {
      return {
        rows: current.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item)),
        path: path.join('.'),
      }
    }
  }

  if (Array.isArray(input)) {
    return {
      rows: input.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item)),
      path: 'root',
    }
  }

  return { rows: [], path: '' }
}

function createParamField(
  field: string,
  type: FieldType,
  sample: unknown,
  sourcePath: string,
  options: { rawField?: string, parentField?: string } = {},
): ParamField {
  const rawField = options.rawField || field
  const dictType = defaultDictType(rawField)

  return {
    enabled: true,
    field,
    rawField,
    parentField: options.parentField || '',
    label: guessLabel(rawField),
    type,
    sample,
    sourcePath,
    dictType,
    selectSource: dictType ? 'dict' : 'remark',
    enumRemark: /(status|flag)/i.test(rawField) ? '0是，1否' : '',
    displayTarget: 'table',
    query: {
      enabled: defaultQueryEnabled(rawField, type),
      widget: defaultWidget(type),
      operator: type === 'string' ? 'like' : 'eq',
      dateRange: defaultDateRangeConfig(field, type),
    },
    table: {
      enabled: true,
      display: defaultDisplay(type, rawField),
    },
    form: {
      enabled: !isReadonlyField(rawField),
      widget: defaultFormWidget(type, rawField),
      required: false,
      uploadLimit: type === 'image' ? 1 : 0,
    },
    expand: {
      display: defaultDisplay(type, rawField),
    },
    children: [],
  }
}

function createFieldsFromObjectSample(parentField: string, sample: unknown, sourcePath: string): ParamField[] {
  if (!isRecord(sample))
    return []

  return Object.entries(sample).map(([field, value]) => {
    const type = inferType(field, value)
    const fieldConfig = createParamField(`${parentField}.${field}`, type, value, sourcePath, {
      rawField: field,
      parentField,
    })
    fieldConfig.children = createFieldsFromObjectSample(fieldConfig.field, value, `${sourcePath}.${field}`)
    return fieldConfig
  })
}

function inferType(field: string, value: unknown): FieldType {
  if (value === null || value === undefined)
    return 'unknown'
  if (Array.isArray(value))
    return 'array'
  if (typeof value === 'boolean')
    return 'boolean'
  if (typeof value === 'number')
    return 'number'
  if (typeof value === 'object')
    return 'object'
  if (typeof value !== 'string')
    return 'unknown'

  const lowerField = field.toLowerCase()
  const lowerValue = value.toLowerCase()

  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/.test(lowerValue) || /(avatar|image|img|photo|pic|logo|cover)/.test(lowerField))
    return 'image'
  if (/^https?:\/\//.test(lowerValue))
    return 'url'
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(value) || /(time|datetime)/.test(lowerField))
    return 'datetime'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /date/.test(lowerField))
    return 'date'

  return 'string'
}

function defaultWidget(type: FieldType): QueryWidget {
  if (type === 'boolean')
    return 'el-switch'
  if (type === 'date' || type === 'datetime')
    return 'el-date-picker'
  return 'el-input'
}

function defaultDateRangeConfig(field: string, type: FieldType) {
  const enabled = type === 'date' || type === 'datetime'
  return {
    enabled,
    model: defaultDateRangeModel(field),
    paramCount: 2 as const,
    beginParam: `${field}Begin`,
    endParam: `${field}End`,
  }
}

function defaultDateRangeModel(field: string) {
  if (/^createTime$/i.test(field))
    return 'dateRange'
  return `${field}Range`
}

function defaultFormWidget(type: FieldType, field = ''): FormWidget {
  if (type === 'image')
    return 'image-upload'
  if (isSortField(field))
    return 'el-input-number'
  return defaultWidget(type)
}

function defaultDisplay(type: FieldType, field: string): TableDisplay {
  if (type === 'image')
    return 'image-preview'
  if (type === 'date' || type === 'datetime')
    return 'date-format'
  if (/(status|type|sex|flag)/i.test(field))
    return 'dict-tag'
  return 'text'
}

function isSortField(field: string) {
  return /sort/i.test(field)
}

function defaultQueryEnabled(field: string, type: FieldType) {
  if (type === 'date' || type === 'datetime')
    return true
  if (isReadonlyField(field) || ['object', 'array', 'image', 'url'].includes(type))
    return false
  return /(name|title|code|status|type|date|time|phone|mobile|email|no|number)/i.test(field)
}

function isReadonlyField(field: string) {
  return /(^id$|Id$|_id$|createBy|createTime|updateBy|updateTime|remark)$/i.test(field)
}

function defaultDictType(field: string) {
  return /(status|type|sex|flag)/i.test(field) ? `sys_${field.replace(/([A-Z])/g, '_$1').toLowerCase()}` : ''
}

function guessLabel(field: string) {
  const dictionary: Record<string, string> = {
    id: 'ID',
    name: '名称',
    title: '标题',
    status: '状态',
    type: '类型',
    createBy: '创建人',
    createTime: '创建时间',
    updateBy: '更新人',
    updateTime: '更新时间',
    remark: '备注',
  }

  return dictionary[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase()).trim()
}

function generatePrompt(step: PromptStepKey, config: BuilderConfig) {
  const instructionMap: Record<PromptStepKey, { only: string, details: string[] }> = {
    step1_query_page: {
      only: '只生成“条件查询 + 分页列表 + 可选导出”代码。',
      details: [
        '实现 queryParams、loading、total、列表数据、getList、handleQuery、resetQuery。',
        'queryParams 默认必须包含排序参数：orderByColumn: \'createTime\'、isAsc: \'desc\'；分页查询、重置查询和导出参数都要保留这组默认排序，不要把 orderByColumn、isAsc 生成成查询表单控件。',
        '如果 apiPaths.list 有值，它来自 ApiFox/OpenAPI Schema 的列表接口地址，可作为核对接口来源的参考；页面代码仍优先使用 apiNames.list 对应的接口函数。',
        '按 queryFields 生成查询表单控件；el-select 字段统一读取字段级 selectSource、dictType、enumRemark。',
        'query.dateRange.enabled 为 true 时，查询表单按 tiansenrun-admin/src/views/order/orderList/index.vue 的创建时间风格生成日期范围：使用 query.dateRange.model 作为 ref<any>([\'\', \'\'])，el-date-picker 保持 class="serarchInput"、value-format="YYYY-MM-DD HH:mm:ss"、type="daterange"、range-separator="-"、start-placeholder="开始日期"、end-placeholder="结束日期"，不要把原字段直接放进 queryParams。',
        '调用列表接口时，按项目既有写法使用 proxy?.reconstructDateRange(queryParams.value, 日期范围变量.value, beginParam, endParam)。如果 paramCount 为 1，只传配置的 beginParam；如果 paramCount 为 2，同时传 beginParam 和 endParam；如果存在多个日期范围字段，先按相同规则构造请求参数后再调用 apiNames.list。',
        'resetQuery 中除了 queryFormRef.value?.resetFields()，还要把所有日期范围变量重置为 [\'\', \'\']。',
        '按 tableColumns 生成 el-table 列；dict-tag 字段统一使用字段级 dictType。',
        '处理 text、image-preview、dict-tag、el-tag、date-format 展示类型。',
        '加入若依分页组件，并确保分页变化会重新调用列表接口。',
        'ignoredFields 是用户关闭“是否需要”的字段，不要生成到页面中。',
        '查询、重置按钮默认不加权限。',
        'exportConfig.enabled 为 true 时，在本步骤按目标项目相邻页面风格实现导出按钮和 handleExport；导出按钮使用 permissionConfig.export。',
        '导出按钮优先参考 orderList/index.vue 风格：<el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>。',
        'handleExport 按 orderList/index.vue 风格实现：复制 queryParams.value 为 subData，删除 subData.pageNum 和 subData.pageSize，再调用 proxy?.download(exportConfig.url, { ...subData }, `${exportConfig.fileName}_${new Date().getTime()}.xlsx`)。',
        '导出范围是分页表格全部字段，不是只导出当前页；如果存在日期范围查询，导出参数也要沿用列表查询的日期范围参数处理方式。',
        'exportConfig.enabled 为 false 时，不生成导出按钮和 handleExport。',
        '表格操作列只预留本步骤需要的结构，不实现查看详情、新增修改、删除逻辑。',
      ],
    },
    step3_form: {
      only: '只生成“新增 / 修改弹窗”代码。',
      details: [
        '在已有页面基础上增加新增按钮、修改按钮、表单弹窗、表单校验、提交逻辑。',
        '新增按钮使用 permissionConfig.add；修改按钮使用 permissionConfig.edit；权限指令写法必须参考目标项目相邻页面。',
        '新增使用 apiNames.add，修改使用 apiNames.update；编辑回显使用 apiNames.detail 或相邻页面已有获取详情写法，但不要生成查看详情按钮或详情弹窗。',
        '按 formFields 生成表单项，并遵守字段 required 配置；ignoredFields 不生成。',
        '表单控件支持 el-input、el-textarea、el-input-number、el-select、el-select-multiple、el-radio、el-date-picker、el-switch、image-upload。',
        'form.widget 为 el-input-number 时，生成 ElementPlus 数字输入框 <el-input-number v-model="form.field" controls-position="right" />；字段名包含 sort 的排序字段（如 sort、sortOrder、sortNo、displaySort）必须使用 el-input-number，不要使用普通 el-input。',
        'form.widget 为 el-select、el-select-multiple、el-radio 时，统一读取字段级 selectSource、dictType、enumRemark。',
        'el-select-multiple 使用多选下拉写法，el-radio 使用单选 radio 组写法；选项来源规则和 el-select 完全一致。',
        'form.widget 为 image-upload 时，使用若依项目已封装的 ImageUpload 组件；字段值按 ossId 处理，直接传入即可；上传数量上限使用 form.uploadLimit。',
        'selectSource 为 dict 时使用 dictType 关联若依字典；为 remark 时根据 enumRemark 生成静态选项或保留映射说明。',
        '提交成功后关闭弹窗、提示成功并刷新列表。',
        '不要实现删除，不要生成查看详情按钮或详情弹窗。',
      ],
    },
    step4_delete: {
      only: '只生成“单条删除”代码。',
      details: [
        '在已有页面表格操作列中增加单条删除按钮。',
        '删除按钮使用 permissionConfig.remove，并按目标项目相邻页面的权限指令风格生成。',
        '删除主键使用 deleteConfig.primaryKey。',
        '使用 deleteConfig.confirmText 作为确认文案。',
        '调用 apiNames.remove 完成删除。',
        '删除成功后按 deleteConfig.refreshAfterDelete 刷新列表并提示成功。',
        '不要新增批量删除，不要改动新增修改逻辑，不要生成查看详情按钮或详情弹窗。',
      ],
    },
    step5_expand_row: {
      only: '只生成“展开行”代码。',
      details: [
        '在已有分页列表页基础上增加 <el-table-column type="expand"> 展开行。',
        '展开行字段来自 expandFields；tableColumns 和 expandFields 是二选一关系，同一字段不要同时出现在主表格和展开行中。',
        '必须原样具备工具栏按钮：<el-button type="info" plain icon="Sort" @click="toggleExpand">展开/折叠</el-button>。',
        '展开/折叠按钮默认不加权限，保持 orderList/index.vue 风格。',
        '必须按项目示例实现 tableRef、tableExpand、toggleExpand，并对当前列表数据逐行 toggleRowExpansion。',
        '主表格需要支持 preserve-expanded-content、:default-expand-all="tableExpand"，并保留已有 loading、data、分页逻辑。',
        '展开行只使用 el-descriptions，不要生成展开子表格或嵌套 el-table。',
        '按 expandConfig.groups 生成一个或多个 el-descriptions；group.title 有值时作为 title，没有值时不传 title。',
        '每个 group.fields 是该描述项组合包含的字段名列表；字段标题、展示形式、dictType 等仍然读取 expandFields 中对应字段的配置。',
        '所有 el-descriptions 的 column 使用 expandConfig.descriptionColumn。',
        'el-descriptions 保持 label-width="120"，样式保持 margin-top: 10px; padding: 0 10px;。',
        '如果 expandFields 为空，本步骤不要生成展开行。',
        '不要实现新增、修改、删除、查看详情弹窗，不要重写已有列表查询逻辑。',
      ],
    },
  }

  const instruction = instructionMap[step]

  return `请使用 ruoyi-fast-crud skill，并严格按当前步骤增量实现。

你现在在一个 RuoYi-Vue-Plus / 若依前后端分离后台管理前端项目中工作。请严格按项目已有页面风格实现本次任务。

【本次只做】
${instruction.only}

【禁止事项】
1. 不要一次性补全其他 CRUD 模块。
2. 不要重写整个页面，除非当前页面还不存在。
3. 不要引入新依赖。
4. 不要改变项目已有路由、菜单、权限体系，除非用户明确要求。
5. 不要使用和相邻若依页面明显不同的组件组织方式。
6. ignoredFields 是用户关闭“是否需要”的字段，不要生成到页面中。

【执行要求】
1. 修改前先搜索并阅读同目录或相近业务模块的若依页面，复用它们的布局、命名、hook、分页组件、按钮权限和接口调用风格。
2. 如果页面已存在，请基于当前页面增量补充本步骤能力。
3. API 文件和接口函数默认已存在；如果缺少引用，只补齐页面内 import，占位函数名使用配置里的 apiNames。
4. 每个字段的字典/枚举配置只读取一次：dict-tag 和 el-select 都复用字段级 dictType、selectSource、enumRemark。
5. tableColumns 与 expandFields 是展示位置二选一结果，同一字段不要同时生成到主表格和展开行。
6. field 中包含点路径（例如 user.nickName）的字段来自 Object 子字段，已在配置中与一级字段并列；生成页面时按普通同级字段处理，但读取表格行数据时保留点路径取值。
7. 权限写法必须参考目标项目相邻页面，不要自创权限指令；如果相邻页面使用 v-hasPermi，就按 v-hasPermi="['权限码']" 生成。
8. 完成后运行项目已有的类型检查、lint 或构建命令；如果无法运行，请说明原因。

【本步骤实现细节】
${instruction.details.join('\n')}

【Fast-Builder 配置 JSON】
\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`
`
}
