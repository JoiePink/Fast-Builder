---
name: weapp
description: 微信原生小程序通用约束。适用于生成或修改微信小程序页面、组件、样式、交互占位、Figma 转 WXML/WXSS、登录页或业务页时；要求只使用原生 WXML/WXSS/JS/JSON，不生成 uni-app、Taro、Vue、React 等跨端或 Web 写法。
---

# 微信原生小程序

在微信小程序项目中生成代码时，先遵守本 skill，再叠加具体页面 skill。

## 通用规则

1. 只生成微信原生小程序代码：WXML、WXSS、JS、JSON。
2. 不要生成 uni-app、Taro、Vue、React 或 Web HTML/CSS 写法。
3. 页面结构使用 WXML 标签和小程序事件，例如 `view`、`text`、`button`、`bindtap`、`wx:if`。
4. 样式使用 WXSS 和 `rpx`，注意移动端宽度、底部安全区和内容不溢出。
5. 需要提示或加载时优先使用小程序原生能力，例如 `wx.showToast`、`wx.showLoading`、`wx.hideLoading`。
6. 不要因为 UI 设计稿主动引入自定义 toast、loading、状态动画或第三方组件；除非目标项目已经存在且用户明确要求复用。
7. 如果目标文件不存在，就新建；如果存在，先读取并保留可复用的命名、结构和事件契约。
