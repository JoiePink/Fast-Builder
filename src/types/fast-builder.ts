export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'image' | 'url' | 'array' | 'object' | 'unknown'
export type QueryWidget = 'el-input' | 'el-select' | 'el-date-picker' | 'el-switch'
export type FormWidget = QueryWidget | 'el-textarea' | 'el-input-number' | 'el-select-multiple' | 'el-radio' | 'image-upload'
export type TableDisplay = 'text' | 'image-preview' | 'dict-tag' | 'el-tag' | 'el-rate' | 'date-format'
export type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'
export type SelectSource = 'dict' | 'remark'
export type PromptStepKey = 'step1_query_page' | 'step3_form' | 'step4_delete' | 'step5_expand_row'
export type DisplayTarget = 'table' | 'expand' | 'none'
export type OperationFieldWidget = FormWidget

export interface PermissionConfig {
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
  rawField: string
  parentField: string
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
    tagType: TagType
  }
  form: {
    enabled: boolean
    widget: FormWidget
    required: boolean
    uploadLimit: number
  }
  expand: {
    display: TableDisplay
    tagType: TagType
  }
  children: ParamField[]
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
  formFields: ParamField[]
  deleteConfig: {
    primaryKey: string
    confirmText: string
    refreshAfterDelete: boolean
  }
  expandConfig: ExpandConfig
}

export interface OperationFieldConfig {
  field: string
  label: string
  type: FieldType
  widget: OperationFieldWidget
  required: boolean
  dictType: string
  selectSource: SelectSource
  enumRemark: string
}

export interface OperationConfig {
  enabled: boolean
  operationName: string
  icon: string
  permission: string
  apiPath: string
  apiName: string
  method: string
  visibleRemark: string
  fields: OperationFieldConfig[]
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
  operationConfig?: OperationConfig
  queryParamCount?: number
  responseParamCount?: number
}

export interface ExpandGroup {
  title: string
  fields: string[]
}

export interface ExpandConfig {
  enabled: boolean
  descriptionColumn: number
  groups: ExpandGroup[]
}

export type WechatMiniAuthFlowMode = 'method1SeparateRegister'
export type WechatMiniAuthPromptStepKey = 'global_app' | 'start_page' | 'bind_page' | 'share_pages' | 'acceptance'
export type WechatMiniAuthParamSource = 'phoneAuthCode' | 'wxLoginCode' | 'getPhoneResult' | 'appConfig' | 'inviteCode' | 'fixed' | 'manual' | 'previousResponse'

export interface WechatMiniAuthParamConfig {
  field: string
  source: WechatMiniAuthParamSource
  value: string
  remark: string
}

export interface WechatMiniAuthConfig {
  flowMode: WechatMiniAuthFlowMode
  projectName: string
  apis: {
    login: string
    getPhone: string
    register: string
    profile: string
  }
  fields: {
    appid: string
    loginCode: string
    phoneCode: string
    phoneNumber: string
    source: string
    token: string
    bindFlag: string
    openId: string
    inviteCode: string
    shareId: string
    userInfo: string
  }
  pages: {
    startPage: string
    bindPage: string
    defaultHome: string
    sharePages: string[]
  }
  entry: {
    enableQrCode: boolean
    enableShare: boolean
    sceneParam: string
    pageParam: string
  }
  method1: {
    getPhoneParams: WechatMiniAuthParamConfig[]
    registerParams: WechatMiniAuthParamConfig[]
    loginParams: WechatMiniAuthParamConfig[]
  }
}

export interface WechatMiniAuthPromptStep {
  key: WechatMiniAuthPromptStepKey
  title: string
  description: string
  prompt: string
}
