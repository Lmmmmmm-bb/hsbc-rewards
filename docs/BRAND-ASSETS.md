# 品牌素材与标题字体

当前外观以 2026-10-27 用户指定素材和主题色为准。

## 六边形与 favicon

- 用户指定源文件：`/Users/bytedance/.codex/visualizations/2026/10/27/01a17d75-cf90-7b13-b275-c87689b19c4d/hsbc/hsbc-hexagon.svg`。
- 页面素材：`src/assets/hsbc/hsbc-hexagon.svg`；favicon：`public/favicon.svg`。
- 两份文件及构建后的 favicon 与用户源文件逐字节一致：692 bytes，SHA-256 `fd986f1f731e114ef501a1f2af41fbc1c8a3e041fe44529829df28675fb876cc`。
- 源 SVG 注释记录的来源：[HSBC 官网 Logo](https://www.hsbc.com/-/files/hsbc/header/hsbc-logo-200x25.svg)。本轮按用户指定的提取版使用，保持几何和颜色；替换此前的完整字标 SVG。
- 保留 `170.1 × 85.1` 视框比例，页面、官方来源和 favicon 均使用同一六边形。本地提供，不新增外部图片请求。检查无脚本、事件属性或外部引用。

## 标题字体

HSBC 的公开[品牌介绍](https://create.hsbc/content/dam/brandhub/newsfeed-public/brand-identity/HSBC_Brand_identity_video_transcript.pdf)说明字体设计以 Univers 为基础。本轮采用用户允许的相近替代：**Roboto，500 字重，仅 Latin 子集**，用于页首 Rewards 标题，正文继续使用原 shadcn preset 的 Inter。

- 来源：[Fontsource Roboto](https://fontsource.org/fonts/roboto)，依赖版本 `@fontsource/roboto@5.3.0`。
- 使用其原始 `latin-500.css`，字体随应用提供；字体授权为 SIL OFL 1.1，授权文本同时提供于 `public/licenses/roboto-OFL.txt`。
- 字体文件由网站同源加载，不要求设备预装。`font-display: swap` 在加载期间先显示回退字体；WOFF2 不可用时尝试 WOFF。下载失败时依次回退到随应用提供的 Inter Variable、系统 UI 字体、平台常见字体及 `sans-serif`，标题保持 500 字重。
- Roboto 是替代选择，不把它标注为 HSBC 官方字体。

界面主色、主要按钮与焦点环统一为用户要求的 `#D90012`；六边形素材使用用户文件原色。HSBC 名称和标识用于识别支持的卡片与规则来源，页尾及隐私保留独立产品声明。
