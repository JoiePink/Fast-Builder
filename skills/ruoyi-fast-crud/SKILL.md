---
name: ruoyi-fast-crud
description: 根据 Fast-Builder 生成的五阶段提示词，在 RuoYi-Vue-Plus / 若依前后端分离后台管理项目中增量实现 CRUD 页面。适用于用户粘贴 BuilderConfig 或 step1_query_page、step2_detail、step3_form、step4_delete、step5_expand_row 任一步提示词，并要求 Codex 严格按若依 + ElementPlus 项目风格只实现当前步骤。
---

# RuoYi Fast CRUD

当用户粘贴 Fast-Builder 输出，并要求在若依前端项目中生成或补充 CRUD 页面代码时，使用本 skill。

## 工作流程

1. 先识别当前 Fast-Builder 步骤：
   - `step1_query_page`：只实现条件查询、列表表格、loading、分页、重置、列表请求。
   - `step2_detail`：只实现表格行查看详情。
   - `step3_form`：只实现新增 / 修改弹窗表单。
   - `step4_delete`：只实现单条删除。
   - `step5_expand_row`：只实现展开行和展开/折叠逻辑。
2. 修改代码前先读取目标项目页面：
   - 优先读取当前页面所在业务模块附近的页面。
   - 如果附近没有类似写法，再读取同项目中功能形态相似的 CRUD 页面。
   - 如果仍找不到合适参考，才使用 `references/ruoyi-crud-template.md` 作为兜底模板。
3. 每次只实现当前步骤。保留前面步骤已有代码，不主动补全后续步骤。
4. 复用目标项目已有写法，包括布局、接口 import、`queryParams`、`loading`、`total`、分页、`right-toolbar`、权限按钮、弹窗、`dict-tag`、`image-preview`、日期格式化。
5. 修改后运行项目中最接近的检查命令，例如 typecheck、lint 或 build；如果无法运行，说明原因。

## 参考文件

- `references/fast-builder-contract.md`：不清楚 BuilderConfig 字段含义时读取。
- `references/ruoyi-page-style.md`：实现若依页面结构和交互前读取。
- `references/ruoyi-crud-template.md`：仅当目标项目缺少可参考页面时作为兜底；如果文件暂不存在，就继续使用目标项目页面和 Fast-Builder 配置。

## 硬性规则

- 不要引入新依赖。
- 不要修改路由、菜单、权限配置或后端接口契约，除非用户明确要求。
- `permissionConfig` 只用于当前步骤已生成或已存在的按钮，不要因为配置里有其他权限码就主动补全其他 CRUD 按钮。
- 按钮权限指令必须参考目标项目相邻页面；如果相邻页面使用 `v-hasPermi`，就按 `v-hasPermi="['权限码']"` 生成。
- 目标项目已有若依封装组件时，不要替换成普通 ElementPlus 写法。
- 新增 / 修改表单中，字段名包含 sort 的排序字段（如 `sort`、`sortOrder`、`sortNo`、`displaySort`）必须使用 ElementPlus 数字输入框 `el-input-number`，不要使用普通 `el-input`。
- `tableColumns` 和 `expandFields` 是互斥的展示结果，同一个字段不要同时生成到主表格和展开行。
- 实现 `step5_expand_row` 时，工具栏按钮必须保持这个形态：

```vue
<el-button type="info" plain icon="Sort" @click="toggleExpand">展开/折叠</el-button>
```
