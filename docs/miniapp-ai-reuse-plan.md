# MiniApp AI Reuse Plan

## 目标

面向定制化微信原生小程序开发，把每个项目里重复出现的接口解析、字段整理、页面结构设计、组件选择、提示词编写和 AI 执行约束沉淀为一套可配置工具。

当前仓库已经具备 RuoYi CRUD Prompt Generator 的基础链路：

1. 粘贴 ApiFox JSON / OpenAPI Schema。
2. 解析接口字段为结构化字段池。
3. 通过表单配置业务名称、接口、权限、字段展示、表单控件等参数。
4. 生成分阶段提示词。
5. 让 AI 在目标项目中按当前阶段增量实现代码。

小程序方向建议复用这条链路，但把输出目标从 RuoYi + Element Plus 改为微信原生小程序页面、组件和业务交互。

## 当前项目可复用资产

### 接口解析能力

可复用位置：

- `src/utils/fast-builder.ts` 中的 `parseApiFoxJson`
- OpenAPI Schema 解析、`$ref` 解析、列表响应识别、查询参数识别
- JSON 返回体中的 `rows` / `records` / `list` 自动识别
- 字段类型推断、图片字段推断、时间字段推断、枚举字段推断

迁移到小程序时应保留：

- ApiFox / OpenAPI 作为主要输入源
- 响应字段和查询参数合并
- Object 子字段拍平成点路径，例如 `user.nickName`
- 忽略分页字段、排序字段等技术参数

需要扩展：

- 识别小程序常见接口结构，例如 `data.list`、`data.items`、`data.records`
- 识别上传接口、详情接口、提交接口
- 识别需要登录态的接口
- 识别地理位置、手机号、金额、门店、商品规格、预约时间等行业字段

### 字段配置模型

可复用位置：

- `src/types/fast-builder.ts` 中的 `ParamField`
- `BuilderMeta`
- `BuilderConfig`
- `OperationConfig`

迁移思路：

RuoYi 当前关注 `queryFields`、`tableColumns`、`formFields`、`expandFields`。小程序可以改成：

- `searchFields`：列表页筛选区
- `listCardFields`：列表卡片展示字段
- `detailSections`：详情页分组字段
- `formFields`：新增/编辑/预约/报名表单字段
- `actionButtons`：页面或卡片上的操作按钮
- `submitPayloadFields`：提交接口参数字段

字段本身继续保留：

- `field`
- `label`
- `type`
- `sample`
- `sourcePath`
- `enabled`
- `dictType`
- `enumRemark`
- `selectSource`
- `children`

小程序需要新增：

- `miniapp.displayRole`：字段在小程序中的展示角色，例如标题、副标题、封面图、标签、价格、状态、时间、地址
- `miniapp.component`：目标组件，例如 `text`、`image`、`swiper`、`input`、`textarea`、`picker`、`switch`、`uploader`
- `miniapp.layoutArea`：字段展示区域，例如列表卡片、详情头部、详情分组、底部栏、表单区
- `miniapp.requiredScene`：字段在哪些页面必须出现，例如 list/detail/form
- `miniapp.formatter`：手机号、金额、日期、距离、状态等格式化规则

### 分阶段提示词

可复用位置：

- `generatePromptSteps`
- `generatePrompt`
- `skills/ruoyi-fast-crud/SKILL.md`
- `skills/ruoyi-fast-crud/references/fast-builder-contract.md`

迁移思路：

RuoYi 当前通过步骤边界避免 AI 一次性重写整个页面。小程序也应该保持分阶段执行：

1. `step1_page_skeleton`：创建或补齐页面文件、生命周期、基础状态。
2. `step2_list_fetch`：实现列表请求、分页、下拉刷新、触底加载、loading、empty。
3. `step3_list_render`：实现列表卡片、图片、状态、价格、标签、跳转。
4. `step4_detail_page`：实现详情头部、分组信息、底部操作栏。
5. `step5_form_submit`：实现表单、校验、上传、提交、成功反馈。
6. `step6_business_actions`：实现预约、报名、收藏、取消、审核、支付等业务动作。

每个阶段都要明确：

- 本次只做什么
- 禁止改什么
- 修改前先读哪些目标项目文件
- 使用目标项目已有组件和请求封装
- 完成后运行什么检查

### 操作配置

可复用位置：

- `OperationConfig`
- `generateOperationPrompt`

小程序中的对应能力：

- 列表卡片按钮，例如预约、报名、收藏、取消、联系商家
- 详情页底部按钮，例如立即报名、立即预约、拨打电话、导航到店
- 管理端小程序操作，例如通过、拒绝、确认服务、完成订单

建议把 `OperationConfig` 扩展为 `MiniAppActionConfig`：

```ts
interface MiniAppActionConfig {
  enabled: boolean
  actionName: string
  scene: 'list-card' | 'detail-footer' | 'form-submit' | 'popup'
  trigger: 'tap' | 'submit'
  apiName: string
  apiPath: string
  method: string
  visibleRule: string
  confirmText: string
  successText: string
  fields: MiniAppActionField[]
}
```

## 小程序版配置模型草案

建议新增独立类型，而不是直接污染当前 RuoYi 类型：

```ts
type MiniAppPageType =
  | 'list'
  | 'detail'
  | 'form'
  | 'category'
  | 'profile'
  | 'order'
  | 'custom'

type MiniAppComponentPreset =
  | 'native'
  | 'vant-weapp'
  | 'tdesign-miniprogram'
  | 'custom'

interface MiniAppBuilderMeta {
  appName: string
  industry: string
  businessName: string
  pageName: string
  pagePath: string
  pageType: MiniAppPageType
  componentPreset: MiniAppComponentPreset
  requestWrapper: string
  apiImportPath: string
}

interface MiniAppBuilderConfig {
  target: 'wechat-native-miniapp'
  meta: MiniAppBuilderMeta
  apiNames: {
    list: string
    detail: string
    submit: string
    upload: string
  }
  paramsList: MiniAppField[]
  searchFields: MiniAppField[]
  listCardFields: MiniAppField[]
  detailSections: MiniAppDetailSection[]
  formFields: MiniAppField[]
  actions: MiniAppActionConfig[]
  stylePreset: MiniAppStylePreset
}
```

## 字段到组件映射规则

### 默认映射

| 字段特征 | 小程序展示 / 输入 |
| --- | --- |
| `image`、`avatar`、`cover`、`logo` | `image` / uploader |
| `title`、`name` | 列表标题 / 表单 input |
| `description`、`content`、`remark` | textarea / 详情长文本 |
| `price`、`amount`、`fee` | 金额展示 / number input |
| `phone`、`mobile` | 手机号展示 / phone input / `makePhoneCall` |
| `address`、`location` | 地址展示 / map / chooseLocation |
| `status`、`type`、`flag` | tag / picker |
| `date`、`time` | 时间格式化 / date picker |
| `sort`、`sortOrder` | number input |
| `url`、`link` | 跳转链接或复制 |

### 列表卡片角色

列表卡片建议自动识别这些角色：

- `cover`：封面图
- `title`：主标题
- `subtitle`：副标题
- `status`：状态标签
- `price`：价格或金额
- `time`：时间
- `address`：地点
- `summary`：补充描述

这样可以让 AI 生成的小程序列表页更像业务页面，而不是机械字段表格。

## 行业配置

行业配置不直接生成代码，而是影响字段排序、组件选择、默认页面类型和提示词语气。

建议先内置这些行业：

- 教育培训：课程、老师、学员、报名、课时、学习记录、视频学习。
- 医美健康：项目、医生、门店、案例、预约、咨询。
- 家政维修：服务、师傅、工单、预约时间、服务地址。
- 餐饮零售：商品、规格、购物车、订单、配送、自提。
- 房产装修：楼盘、户型、案例、设计师、预约量房。
- 本地生活：门店、套餐、优惠券、核销、导航、电话。

每个行业配置包含：

- 核心识别字段关键词
- 常见页面类型
- 字段展示优先级
- 常见操作按钮
- 常见状态流转
- 常见表单校验规则

## 工具 MVP

第一阶段只做提示词生成，不直接生成代码。

### MVP 页面

在 `/miniapp/loginStart` 中实现一个新的工作台：

1. ApiFox / OpenAPI 粘贴区
2. 项目基础配置
   - 行业
   - 页面类型
   - 页面路径
   - 组件预设
   - 请求封装说明
   - API import 路径
3. 字段池配置
   - 是否启用
   - 展示角色
   - 所属区域
   - 输入组件
   - 是否必填
   - 是否搜索
4. 操作按钮配置
   - 按钮名称
   - 出现位置
   - API
   - 显示条件
   - 成功提示
5. 分阶段提示词
6. 配置 JSON

### MVP 输出

先输出这些提示词：

- 创建列表页
- 创建详情页
- 创建表单页
- 增加一个业务操作

每个提示词都要求 AI：

- 先搜索目标小程序项目已有页面
- 复用目标项目请求封装、公共组件、样式变量
- 只做当前阶段
- 不改路由、tabBar、全局配置，除非明确要求
- 不引入新依赖
- 完成后运行目标项目已有检查命令

## 后续可升级方向

### 代码片段模板

当提示词稳定后，可以把高频结构沉淀为模板：

- `page.ts`
- `page.wxml`
- `page.wxss`
- `page.json`
- `api.ts`

模板不是为了完全替代 AI，而是给 AI 更稳定的初稿。

### 项目风格学习

小工具可以让用户粘贴或选择目标项目中的参考页面：

- 列表页参考
- 详情页参考
- 表单页参考
- 请求封装参考
- 上传组件参考

提示词中把这些作为强约束，要求 AI 复用已有写法。

### 配置存档

每个项目可以保存一份配置：

- 行业
- 组件库
- 请求封装
- 页面路径规范
- 样式规范
- 常用操作按钮
- 常用字段映射

这样同一个客户项目后续加页面时，不需要重新填写基础配置。

## 推荐实施顺序

1. 抽离当前 `fast-builder.ts` 中的平台无关解析能力。
2. 新增 `src/types/miniapp-builder.ts`。
3. 新增 `src/utils/miniapp-builder.ts`，先实现 `buildMiniAppConfig` 和 `generateMiniAppPromptSteps`。
4. 把 `/miniapp/loginStart` 从 Coming Soon 改成真实工作台。
5. 先支持列表页、详情页、表单页三种页面。
6. 使用一个真实小程序页面做回放测试，检查提示词是否能稳定让 AI 增量实现。
7. 再补行业配置和操作按钮配置。

## 判断是否真正解放双手

这个工具不应以“一次生成完整页面”为第一目标，而应以减少重复沟通为目标。

有效的衡量标准：

- 每次新页面不再手写字段整理。
- 不再反复告诉 AI 项目用什么请求封装。
- 不再反复解释图片、状态、金额、时间、手机号等字段怎么处理。
- 不再反复提醒 AI 不要重写整个页面。
- 一个页面可以拆成 3 到 6 次稳定的增量提示词完成。
- 同行业下一个页面的配置成本明显降低。

## 结论

当前项目最有价值的抽象不是某一份模板代码，而是这条链路：

`接口结构 -> 字段池 -> 业务配置 -> 页面阶段 -> AI 执行契约`

微信原生小程序方向应继续沿用这条链路。先把小程序页面生成做成 Prompt Generator，等提示词和配置模型稳定后，再逐步加入模板、项目风格学习和配置存档。
