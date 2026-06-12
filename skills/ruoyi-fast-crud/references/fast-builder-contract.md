# Fast-Builder 配置契约

Fast-Builder 会输出一份共享的 `BuilderConfig`、四份分阶段提示词，或一份独立的 `OperationConfig` 表格操作提示词。即使配置里包含完整信息，也必须只实现当前步骤或当前表格操作。

## BuilderConfig

- `businessName`：业务对象名称，用于标题和确认文案。
- `pageName`：页面或模块名称。
- `apiNames`：目标项目中预期使用的接口函数名。
  - `list`：分页查询。
  - `detail`：单条详情，用于新增 / 修改阶段的编辑回显，不代表生成查看详情模块。
  - `add`：新增。
  - `update`：修改。
  - `remove`：删除。
- `apiPaths`：从 ApiFox/OpenAPI Schema 中解析出的接口地址。
  - `list`：列表接口地址，例如 `/api/store/list`。页面代码仍优先使用 `apiNames.list` 对应接口函数，本字段只作为接口来源参考。
- `permissionConfig`：按钮权限码配置，按目标项目相邻页面的权限指令风格使用。
  - `add`：新增按钮权限。
  - `edit`：修改按钮权限。
  - `remove`：删除按钮权限。
  - `export`：导出按钮权限。`exportConfig.enabled = true` 时在 `step1_query_page` 使用。
- `exportConfig`：分页列表导出配置，只在 `step1_query_page` 使用。
  - `enabled`：是否生成导出按钮和 `handleExport`。
  - `url`：传给 `proxy?.download` 的导出接口地址。
  - `fileName`：导出文件名前缀，最终文件名按项目风格追加时间戳。
- `paramsList`：用户启用的字段。
  - Object 字段的子字段会用点路径（例如 `user.nickName`）拍平成与一级字段同级的配置项。
- `ignoredFields`：用户关闭“是否需要”的字段，绝对不要生成到页面中。
- `queryFields`：查询表单字段。
  - `step1_query_page` 生成的 `queryParams` 默认必须包含 `orderByColumn: 'createTime'` 和 `isAsc: 'desc'`；这两个字段只作为默认排序请求参数，不生成成查询表单控件。
  - `query.dateRange.enabled = true` 时，该字段是日期范围查询，不要把原字段直接放入 `queryParams`。
  - `query.dateRange.model` 是页面里的范围变量名，例如 `dateRange`。
  - `query.dateRange.paramCount` 表示真实接口参数数量，支持 `1` 或 `2`。
  - `query.dateRange.beginParam` / `query.dateRange.endParam` 是接口真实参数，例如 `createTimeBegin`、`createTimeEnd`。
  - 日期范围请求参数必须按项目内部方法 `proxy?.reconstructDateRange(...)` 生成。
- `tableColumns`：主表格字段。
- `expandFields`：展开行字段。
- `formFields`：新增 / 修改表单字段。
  - `form.widget` 支持 `el-input`、`el-textarea`、`el-input-number`、`el-select`、`el-select-multiple`、`el-radio`、`el-date-picker`、`el-switch`、`image-upload`。
  - `form.widget = el-input-number` 时，生成 ElementPlus 数字输入框；字段名包含 sort 的排序字段（如 `sort`、`sortOrder`、`sortNo`、`displaySort`）必须使用 `el-input-number`，不要使用普通 `el-input`。
  - `el-select`、`el-select-multiple`、`el-radio` 都读取字段级 `selectSource`、`dictType`、`enumRemark`。
  - `form.widget = image-upload` 时，使用若依项目封装好的 `ImageUpload` 组件。
  - `form.uploadLimit` 表示最多上传张数。
  - 图片上传字段按 `ossId` 处理，直接传入 `ImageUpload` 组件即可。
- `deleteConfig`：单条删除配置。
- `expandConfig`：展开行全局布局配置。
  - `descriptionColumn`：每个 `el-descriptions` 的列数。
  - `groups`：展开行描述项组合数组。每个组合包含可选 `title` 和 `fields` 字段名列表。
  - 展开行只使用 `el-descriptions`，不要生成展开子表格或嵌套 `el-table`。

## OperationConfig

`OperationConfig` 用于给已有分页列表的 `el-table` 操作列追加一个业务操作，不属于新增 / 修改 / 删除 / 详情阶段。

- `enabled`：是否启用该操作。
- `operationName`：按钮文案和弹窗标题，例如 `审核认证`。
- `icon`：ElementPlus 图标名，例如 `Check`、`Edit`、`View`。
- `permission`：该操作按钮的权限字符；有值时按目标项目相邻页面权限指令风格生成。
- `apiPath`：接口地址，仅作为接口来源参考。
- `apiName`：页面中要调用的接口函数名，例如 `audit`。
- `method`：请求方法，例如 `post`。
- `visibleRemark`：按钮显示条件备注，例如 `status === '待审核' 时显示`。如果是自然语言，结合当前行字段推断最贴近的 `v-if` 条件。
- `fields`：操作弹窗表单字段。
  - `field`：提交参数名。
  - `label`：表单项标题。
  - `type`：字段类型。
  - `widget`：填写控件，支持 `el-input`、`el-textarea`、`el-input-number`、`el-select`、`el-select-multiple`、`el-radio`、`el-date-picker`、`el-switch`、`image-upload`。
  - `required`：是否必填；为 `true` 时必须生成表单校验。
  - `dictType` / `selectSource` / `enumRemark`：选项来源。优先复用项目字典写法；没有字典时，可根据 `enumRemark` 生成静态选项。

实现 `OperationConfig` 时：

- 只添加当前操作按钮、弹窗、表单状态、校验和提交方法。
- 不要重写列表查询、分页、导出、新增、修改、删除、详情等已有逻辑。
- 通常从当前行带入 `id` 等主键字段，其余字段由弹窗填写。
- 提交成功后关闭弹窗、提示成功并刷新列表。

## 字段规则

每个字段包含：

- `field`：后端属性名。
- `rawField`：当前层级的原始字段名；Object 子字段的 `field` 是点路径，`rawField` 是子字段本名。
- `parentField`：Object 子字段所属的父级点路径；一级字段为空。
- `label`：页面展示标题。
- `type`：推断类型。
- `dictType`：若依字典类型，用于 `dict-tag` 和字典型 `el-select`。
- `selectSource`：`dict` 或 `remark`。
- `enumRemark`：静态枚举备注，例如 `0是，1否`。
- `displayTarget`：`table`、`expand` 或 `none`。
- `query`：查询表单配置。
- `table`：主表格展示配置。
- `expand`：展开行展示配置，只包含该字段在 `el-descriptions` 中的展示形式；字段属于哪个描述项组合由 `expandConfig.groups` 决定。
- `form`：新增 / 修改表单配置。

`displayTarget` 控制列表展示位置：

- `table`：生成到主表格。
- `expand`：生成到 `<el-table-column type="expand">` 内。
- `none`：不作为列表展示字段。

`tableColumns` 和 `expandFields` 是互斥结果。同一个字段不要同时生成到两个位置。

## 四阶段边界

- `step1_query_page`：只实现查询表单、主表格、分页、loading、重置、列表请求；如果 `exportConfig.enabled = true`，同时实现导出按钮和导出逻辑。
- `step3_form`：只实现新增 / 修改弹窗。
- `step4_delete`：只实现单条删除。
- `step5_expand_row`：只实现展开行。
- `OperationConfig`：只实现单个表格操作按钮和操作弹窗。

Fast-Builder 不再生成单独的详情阶段，不生成查看详情按钮、详情弹窗或 `detailFields`。
