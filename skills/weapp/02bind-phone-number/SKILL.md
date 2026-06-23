---
name: 02bind-phone-number
description: 根据 Figma 设计稿在微信原生小程序中生成或重构绑定手机号登录页。适用于用户要求用 MCP/Figma 生成 WXML/WXSS，并且必须保留授权手机号登录、不授权登录、协议勾选、getPhoneNumber 授权按钮等事件契约，方便后续接入登录逻辑。
---

# 02 绑定手机号

使用本 skill 把 Figma 设计稿转成微信原生小程序绑定手机号登录页。

## 工作流程

1. 先遵守 `$weapp` 的微信原生小程序通用约束。
2. 确认目标路径，通常是 `pages/login/login.wxml`、`pages/login/login.wxss`，以及可选的 `pages/login/login.js`。
3. 先读 Figma MCP/设计稿节点。目标文件存在就读取并复用已有命名和结构；不存在就新建，不要假设有参考页。
4. 只生成 UI 结构和样式，不实现登录、注册、请求、token 等业务逻辑。

## 硬性规则

- 必须保留两个“授权手机号登录”按钮：
  - 第一个普通按钮使用 `bindtap="onAuthorizeTap"`，用于未勾选协议时触发小程序原生提示，例如 `wx.showToast`。
  - 第二个真实手机号授权按钮使用 `wx:if="{{agree}}"`、`open-type="getPhoneNumber"`、`bindgetphonenumber="onAuthorizePhone"`。
- 必须保留“不授权登录”按钮，并使用 `bindtap="onDeny"`。
- 必须保留协议勾选区域，外层点击使用 `bindtap="onToggleAgree"`，状态类名只需要绑定 `agree`。
- 不要新增或要求 `shakeAgree`、`app-toast`、`app-loading` 等自定义提示/加载依赖。
- 按 Figma 设计稿调整布局、间距、颜色、字体、图片和装饰，但不要改按钮事件名、授权属性、协议状态变量名。

## 必须保留的 WXML 契约

生成或修改页面时，按钮区域必须保持下面的交互契约，可只调整 class 名和外层布局，但事件与授权属性不要变：

```xml
<view class="btn-primary-wrap">
  <button class="btn primary" hover-class="none" bindtap="onAuthorizeTap">
    授权手机号登录
  </button>
  <button
    wx:if="{{agree}}"
    class="btn primary btn-phone-auth"
    hover-class="none"
    open-type="getPhoneNumber"
    bindgetphonenumber="onAuthorizePhone"
  >
    授权手机号登录
  </button>
</view>
<button class="btn secondary" hover-class="none" bindtap="onDeny">
  不授权登录
</button>
```

协议区域必须保留这个状态契约：

```xml
<view class="agree-row" bindtap="onToggleAgree">
  <view class="checkbox {{agree ? 'checked' : ''}}">
    <view class="tick"></view>
  </view>
</view>
```

## 输出检查

- 说明使用了哪个 Figma 节点或设计稿来源。
- 说明生成/修改了哪些文件；如果目标文件原本不存在，明确说明是新建。
- 明确确认两个授权按钮和“不授权登录”按钮的事件写法仍与契约一致。
- 如未能访问 Figma MCP，说明原因。
