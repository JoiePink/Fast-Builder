# 若依页面风格参考

始终优先读取目标项目里的相邻页面。本文件只是兜底约束，不替代项目真实写法。

## 条件查询 + 分页列表

- 使用目标项目已有查询表单布局。
- 如果项目附近页面使用 `queryParams`、`loading`、`total`、列表数据、`getList`、`handleQuery`、`resetQuery`，保持同名或同风格。
- `queryParams` 默认必须包含 `orderByColumn: 'createTime'` 和 `isAsc: 'desc'`；分页查询、重置查询和导出参数都要保留这组默认排序，不要把 `orderByColumn`、`isAsc` 生成成查询表单控件。
- 日期范围查询必须保持 `order/orderList/index.vue` 的公司内部写法：模板使用 `el-date-picker class="serarchInput"`、`type="daterange"`、`value-format="YYYY-MM-DD HH:mm:ss"`，脚本中使用 `dateRange = ref<any>(['', ''])` 这类范围变量，请求前通过 `proxy?.reconstructDateRange(queryParams.value, dateRange.value, 'createTimeBegin', 'createTimeEnd')` 生成真实参数，重置时清空范围变量。
- 使用项目已有分页组件和 `right-toolbar` 写法。
- 字典、图片预览、日期格式化、权限指令优先使用项目已有封装，例如 `dict-tag`、`image-preview`。
- 主表格字段展示形式为 `el-tag` 时，使用配置里的 `table.tagType` 作为 `<el-tag>` 的 `type`；缺省为 `primary`。
- 查询、重置按钮默认不加权限；`exportConfig.enabled = true` 时，导出按钮使用 `permissionConfig.export`。
- 导出保持 `order/orderList/index.vue` 风格：按钮使用 `type="warning"`、`plain`、`icon="Download"`、`@click="handleExport"`；`handleExport` 复制 `queryParams.value`，删除 `pageNum` / `pageSize`，再调用 `proxy?.download(exportConfig.url, { ...subData }, 文件名)`。
- 导出是导出分页表格全部字段，不是只导出当前页；如果查询条件里有日期范围，导出参数也要沿用同样的日期范围参数处理方式。

## 新增 / 修改

- `step3_form` 只添加新增和修改能力。
- 新增按钮使用 `permissionConfig.add`，修改按钮使用 `permissionConfig.edit`。
- 如果附近页面使用同一个弹窗处理新增/修改，保持这个习惯。
- 编辑回显可以使用 `apiNames.detail` 或目标项目相邻页面已有获取详情写法，但不要因此生成查看详情按钮或详情弹窗。
- 复用本地的 form ref、rules、reset、submit、成功提示、刷新列表写法。
- `el-select`、`el-select-multiple`、`el-radio` 的选项来源都使用字段级 `selectSource`、`dictType`、`enumRemark`，不要重复定义第二套字典配置。
- 字段名包含 sort 的排序字段（如 `sort`、`sortOrder`、`sortNo`、`displaySort`）在新增 / 修改表单中使用 `el-input-number`，保持 `controls-position="right"`。
- 图片上传字段使用项目已封装的 `ImageUpload` 组件，按 `ossId` 字段值传入，并遵守 `form.uploadLimit`。
- 提交成功后关闭弹窗并刷新列表。
- 不要在本阶段实现删除，也不要生成查看详情按钮或详情弹窗。

## 单条删除

- `step4_delete` 只添加单条删除。
- 删除按钮使用 `permissionConfig.remove`。
- 使用 `deleteConfig.primaryKey`、`deleteConfig.confirmText` 和 `apiNames.remove`。
- 删除成功后提示成功并刷新列表。
- 不要添加批量删除，除非用户明确要求。

## 表格操作

- `OperationConfig` 只添加一个业务操作按钮和对应弹窗，不补全其他 CRUD 能力。
- 按目标项目已有操作列风格，把按钮加到 `el-table` 的操作列里；按钮文案使用 `operationName`，图标使用 `icon`。
- `permission` 有值时，按相邻页面权限指令风格生成，例如 `v-hasPermi="['权限码']"`。
- `visibleRemark` 有值时生成按钮显示条件；如果是自然语言备注，结合当前行字段推断简单可读的 `v-if`，不要写复杂表达式。
- 点击按钮时记录当前行，打开 `el-dialog`，并把 `id` 等可从当前行取得的字段带入表单。
- 弹窗内使用 `el-form`，字段来自 `fields`；`required = true` 的字段必须生成 rules。
- `widget` 控制控件类型；数字字段使用 `el-input-number`；`el-select` / `el-radio` 优先复用字典或根据 `enumRemark` 生成静态选项。
- 提交时调用 `apiName` 对应接口函数；接口地址 `apiPath` 和 `method` 只作为核对参考。
- 提交成功后关闭弹窗、提示成功并刷新列表。
- 不要重写列表查询、分页、导出、新增、修改、删除或详情逻辑。

## 展开行

- `step5_expand_row` 只添加展开行。
- 展开 / 折叠按钮默认不加权限。
- 工具栏必须添加并保持这个按钮：

```vue
<el-button type="info" plain icon="Sort" @click="toggleExpand">展开/折叠</el-button>
```

- 添加或复用 `tableRef`、`tableExpand`、`toggleExpand`，让当前列表数据逐行调用 `toggleRowExpansion(row, tableExpand.value)`。
- 主表格按项目风格支持 `preserve-expanded-content` 和 `:default-expand-all="tableExpand"`。
- 展开行只使用 `el-descriptions`，不要生成展开子表格或嵌套 `el-table`。
- 按 `expandConfig.groups` 生成一个或多个描述项组合；`group.title` 有值时作为标题，没有值时不传标题。
- `group.fields` 控制每个组合中展示哪些展开字段；字段展示形式继续读取 `expandFields` 中对应字段的 `expand.display`，其中 `el-tag` 使用 `expand.tagType` 作为 `<el-tag>` 的 `type`。
- 每个 `<el-descriptions>` 的列数使用 `expandConfig.descriptionColumn`。
- 描述列表默认保持 `label-width="120"` 和 `style="margin-top: 10px; padding: 0 10px;"`，除非目标项目附近页面有不同风格。
