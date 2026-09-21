# Token Center · Signal 视觉方案

基于当前提交 `1d6e89ee8`（`chore: rebrand to Token Center`）。已阅读根目录 `AGENTS.md`、`README.md`、`web/AGENTS.md`，参考当前首页、仪表盘、导航与主题变量，保留 Token Center 品牌，并以原生 SVG 重新设计标志。

本目录的 HTML/CSS 保留为设计原稿；红色方案已落到 `web/` 的正式 React 前端。下述静态原稿不调用业务接口。指标、费用、趋势、模型分布和日志全部是示例数据。控制台中的侧栏、标签、日期、创建密钥等仅为视觉示意；首页与控制台之间的导航、文档及项目链接可用。

## 查看效果

| 页面   | 桌面 1440px                     | 手机 390px                     | 原稿                   |
| ------ | ------------------------------- | ------------------------------ | ---------------------- |
| 首页   | [效果图](home-desktop.png)      | [效果图](home-mobile.png)      | [HTML](index.html)     |
| 控制台 | [效果图](dashboard-desktop.png) | [效果图](dashboard-mobile.png) | [HTML](dashboard.html) |

浏览器直接打开 HTML 即可查看，无需构建或启动后端。标志使用本目录独立的 [`icon.svg`](icon.svg)，首页和控制台共用，可无损缩放。字体使用本机系统字体，无远程字体或图片请求。

## 视觉方向

Signal 采用暖炭黑背景、珊瑚红强调、紧凑的技术标识与大字号中文标题。首页用线框模型网络建立统一网关的视觉意象，控制台用连续指标、折线趋势和环形分布组织信息。相较改版前的蓝紫渐变首页和此前 Atelier 的暖白衬线方案，本方案采用统一深色界面与更明确的工程工具气质。

| 用途                 | 色值      |
| -------------------- | --------- |
| 页面背景             | `#191516` |
| 面板背景             | `#231D1E` |
| 主要操作、选中、图表 | `#FF6B62` |
| 主文字               | `#F5EFED` |
| 辅助文字             | `#BCAEAE` |
| 分隔线               | `#443537` |

手机端首页与分析面板改为纵向排列，指标保留两列，日志在自身容器内横向滚动。手机导航抽屉、弹窗、加载/空/错误状态和明亮主题不在此轮静态预览范围。

## 国产模型与品牌图标

首页节点、模型生态、控制台分布与调用日志使用 DeepSeek、通义千问、智谱 GLM、豆包等国产模型示例。请求量和价格仅为排版示例，不代表实际模型报价。

SVG 图标采用红色切角方形、T 形通路和白色中心节点，表达多个连接汇聚到统一入口；在 30–36px 导航尺寸和独立图标尺寸下均可使用。按钮、标题和图表采用品牌红，调用成功状态保留独立的薄荷绿色，避免把品牌强调混同为错误提示。

## 正式实现映射

- 首页：`web/src/features/home/`。
- 仪表盘：`web/src/features/dashboard/`。
- 导航与权限入口：`web/src/components/layout/`、`web/src/hooks/use-sidebar-data.ts`。
- 视觉变量：`web/src/styles/`。

正式实现复用现有路由、权限、请求和 Base UI 组件，保留全部业务导航、接入引导、账户详情与可配置的状态面板。总览调用 `/api/data/self` 与 `/api/log/self`，展示当前账户的今日用量、模型分布和最近消费记录，不将静态示例写入运行时数据。新增文案覆盖七种语言。默认主题为深色红系，保留已保存的主题选择，另提供浅色对应配色。默认图标使用 `web/public/logo.svg`，管理员自定义 Logo 继续有效。

## 静态原稿验证

已用本机 Chrome 无头浏览器渲染四张 PNG，并逐张目视检查。1440px 与 390px 下均无整页横向溢出，品牌图片均成功加载。效果图由 HTML/CSS/SVG 实际渲染，没有调用图像生成 API。此轮仅新增设计文档与原稿，未改动 React/TypeScript/locale，未运行业务构建或单元测试。

## 正式页面验证

已通过前端类型检查、生产构建、修改文件的 lint（0 error；自定义页脚原有 HTML 注入提示为 warning），以及 15 项聚焦回归测试。测试覆盖数据范围与聚合、真实模型名称、加载/空/失败状态、重试、访客/登录首页跳转、保存的主题偏好和自定义 Logo。

浏览器回归脚本：[verify-layout.mjs](verify-layout.mjs)。它在独立无痕上下文中拦截 API 响应作为固定测试数据，不连接实际业务账户。验证 320、390、768、1440px 的布局，移动端菜单开合与 Escape、小时数据键盘展开、日志容器横向滚动、SVG 加载、浅色模式与运行时异常。

正式页面截图（接口测试数据，仅用于视觉验收）：

- [首页 · 桌面](implemented/home-desktop.png) / [手机](implemented/home-mobile.png)
- [控制台 · 桌面](implemented/dashboard-desktop.png) / [手机首屏](implemented/dashboard-mobile.png)

重跑方法：从 `web/` 构建并启动 `bun run preview --host 127.0.0.1 --port 4173`，启动独立的 Chrome 无头调试实例（端口 43485），再从仓库根目录执行 `bun docs/design/signal/verify-layout.mjs`。可用 `SIGNAL_PREVIEW_URL`、`SIGNAL_BROWSER_URL` 覆盖对应地址。运行时截图保存到 `implemented/`。
