export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'image' | 'url' | 'array' | 'object' | 'unknown'
export type QueryWidget = 'el-input' | 'el-select' | 'el-date-picker' | 'el-switch'
export type FormWidget = QueryWidget | 'el-textarea' | 'el-select-multiple' | 'el-radio' | 'image-upload'
export type TableDisplay = 'text' | 'image-preview' | 'dict-tag' | 'el-tag' | 'date-format'
export type SelectSource = 'dict' | 'remark'
export type PromptStepKey = 'step1_query_page' | 'step2_detail' | 'step3_form' | 'step4_delete' | 'step5_expand_row'
export type DisplayTarget = 'table' | 'expand' | 'none'
export type ExpandMode = 'description' | 'table'

export interface PermissionConfig {
  detail: string
  add: string
  edit: string
  remove: string
  export: string
}

export interface ExportConfig {
  enabled: boolean
  url: string
  fileName: string
}

export interface ParamField {
  enabled: boolean
  field: string
  label: string
  type: FieldType
  sample: unknown
  sourcePath: string
  dictType: string
  selectSource: SelectSource
  enumRemark: string
  displayTarget: DisplayTarget
  query: {
    enabled: boolean
    widget: QueryWidget
    operator: 'like' | 'eq' | 'between'
    dateRange: {
      enabled: boolean
      model: string
      paramCount: 1 | 2
      beginParam: string
      endParam: string
    }
  }
  table: {
    enabled: boolean
    display: TableDisplay
  }
  detail: {
    enabled: boolean
  }
  form: {
    enabled: boolean
    widget: FormWidget
    required: boolean
    uploadLimit: number
  }
  expand: {
    mode: ExpandMode
    display: TableDisplay
    tableColumns: ExpandTableColumn[]
  }
}

export interface BuilderMeta {
  businessName: string
  pageName: string
  listPath: string
  listApi: string
  detailApi: string
  addApi: string
  updateApi: string
  removeApi: string
  primaryKey: string
  permissionConfig: PermissionConfig
  exportConfig: ExportConfig
}

export interface BuilderConfig {
  businessName: string
  pageName: string
  apiNames: {
    list: string
    detail: string
    add: string
    update: string
    remove: string
  }
  apiPaths: {
    list: string
  }
  permissionConfig: PermissionConfig
  exportConfig: ExportConfig
  paramsList: ParamField[]
  ignoredFields: ParamField[]
  queryFields: ParamField[]
  tableColumns: ParamField[]
  expandFields: ParamField[]
  detailFields: ParamField[]
  formFields: ParamField[]
  deleteConfig: {
    primaryKey: string
    confirmText: string
    refreshAfterDelete: boolean
  }
  expandConfig: ExpandConfig
}

export interface PromptStep {
  key: PromptStepKey
  title: string
  description: string
  prompt: string
}

export interface ParseResult {
  paramsList: ParamField[]
  sourcePath: string
  mode: 'response-json' | 'openapi-schema'
  apiPath?: string
  queryParamCount?: number
  responseParamCount?: number
}

export interface ExpandTableColumn {
  label: string
  prop: string
  display: TableDisplay
}

export interface ExpandDescriptionField {
  label: string
  prop: string
  display: TableDisplay
}

export interface ExpandConfig {
  enabled: boolean
  tableEnabled: boolean
  descriptionEnabled: boolean
  tableColumnCount: number
  descriptionColumn: number
}
