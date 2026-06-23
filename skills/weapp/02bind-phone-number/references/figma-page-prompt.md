# Figma 提示词模板

```text
使用 $weapp 和 $02bind-phone-number。

任务：根据 Figma 设计稿，实现微信原生小程序绑定手机号登录页。

Figma：
{粘贴 Figma MCP 内容或链接}

目标文件：
- WXML：{pages/login/login.wxml}
- WXSS：{pages/login/login.wxss}
- JS：{pages/login/login.js，可选}

规则：
- 文件存在就读取并复用合适的命名和结构；不存在就新建页面。
- 只做 UI，不实现登录/注册接口逻辑。
- 保留两个授权按钮：一个 `bindtap="onAuthorizeTap"`，一个 `wx:if="{{agree}}" open-type="getPhoneNumber" bindgetphonenumber="onAuthorizePhone"`。
- “不授权登录”按钮保留 `bindtap="onDeny"`。
- 协议勾选只保留 `bindtap="onToggleAgree"` 和 `agree`。
- 不要生成 `shakeAgree`、`app-toast`、`app-loading`。
```
