---
name: fast-builder-project
description: Fast-Builder 项目级约束。适用于在本仓库新增或修改页面、生成器、提示词、skill、工作台和方法论工具时；要求产出可重复使用的方法论资产，页面使用 Element Plus 风格，skill 和提示词使用中文，并且不要自动提交到 GitHub。
---

# Fast-Builder 项目规范

在 `D:\project\Fast-Builder` 中工作时使用本 skill。这个项目不是一次性代码片段集合，而是可重复使用的方法论工具库。

## 项目原则

1. 把高频流程沉淀为可复用工具：页面、配置、提示词、skill、文档或生成器。
2. 优先在项目内做成可操作页面，而不是只在对话里给一次性答案。
3. 页面使用当前项目已有的 Vue + Element Plus 风格；复用现有导航、卡片、表单、表格、按钮、标签和提示样式。
4. skill、页面生成的提示词、说明文案默认使用中文。
5. 不要自动提交、推送或创建 GitHub PR；只有用户明确要求时才执行 git commit、push、PR。

## 实现习惯

- 新工具优先放在 `src/pages` 对应业务分组下，并同步检查 `src/config/tool-navigation.ts` 是否需要入口。
- 生成器页面要让用户能粘贴输入、生成提示词、复制输出，并保留关键业务契约。
- 提示词要短、明确、可执行；避免把同一规则在页面、skill、reference 中长篇重复。
- 修改 skill 时保持轻量：`SKILL.md` 放核心规则，reference 只放必要模板。
- 验证优先使用 targeted lint、页面浏览器检查或与改动范围匹配的命令；不要把已知无关的全仓库噪音当成本次回归。
