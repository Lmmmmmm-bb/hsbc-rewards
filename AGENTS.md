# Coding agent 协作指南

本文件适用于整个仓库。用户的新指令优先；修改前阅读相关实现，不依据历史提交或旧阶段记录恢复已撤回的功能。

## 产品范围与文档

Reward+ 是面向个人的 HSBC PULSE 银联双币钻石卡返现估算工具，当前只有「本地导入英文 PDF → 查看返现」这一条单页流程。不要自行扩展账户、设置、CSV、持久化历史、备份或导出功能。

- [README.md](README.md) 面向使用者，只介绍使用、隐私、结果口径和限制。开发、部署、目录说明及验收记录不放入 README。
- 本文维护开发约束与验证入口；范围与行为以用户指令、本文及现有实现为准。
- 项目代码采用 [MIT License](LICENSE)。保留 `public/licenses/` 的第三方授权文本和 HSBC SVG 中的来源注释；项目许可证不替代第三方授权或商标权利。

## 开发命令

使用 Node.js 24（`.nvmrc`）和 pnpm 12.15.0（`package.json#packageManager`）。仓库采用 ES modules，`@/` 指向 `src/`。

```sh
pnpm install
pnpm dev
```

开发地址通常为 `http://localhost:5173/`，以实际输出为准。

| 命令 | 用途 |
| --- | --- |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` / `pnpm test:watch` | 单元测试 / 监听测试 |
| `pnpm build` | 类型检查并构建到 `dist/` |
| `pnpm preview` | 预览生产构建 |

依赖变更使用 pnpm 并同步 `pnpm-lock.yaml`，不要顺带升级无关依赖。不要手改 `dist/`、`node_modules/`，也不要提交验收产物或临时脚本。

## 架构与依赖方向

技术栈为 React、TypeScript、Vite、Tailwind CSS、shadcn/ui（Base UI）和 Vitest。

| 位置 | 职责 |
| --- | --- |
| `src/App.tsx`、`src/app/` | 页面入口、Provider、共用弹窗内容加载入口 |
| `src/domain/` | 解析、金额、规范化、分类、核对及返现计算的纯函数 |
| `src/application/` | 导入批次、会话提交、查询和汇率流程编排 |
| `src/ports/`、`src/adapters/` | 外部接口及 PDF.js、结单模板、SHA-256、公开汇率与缓存实现 |
| `src/store/` | 可订阅的内存会话及 React 接入 |
| `src/features/` | 导入与返现业务界面 |
| `src/components/ui/`、`src/components/workspace/` | 通用控件、布局和共用展示组件 |
| `src/i18n/`、`src/index.css` | 中英文消息、格式化及全局主题 |
| `src/tests/` | 单测共用的合成数据与执行辅助函数 |
| `scripts/` | 显式运行的构建与结单解析验证工具 |

领域层不依赖 React、浏览器 API、PDF.js、网络或存储。应用层通过端口调用适配器；UI 通过应用查询和 store 读取结果，不直接导入 PDF 引擎或汇率请求实现。资格、金额、额度和质量统计在领域层或应用查询中计算，组件只展示。错误及原因使用稳定代码，用户文案集中在 i18n。

## 计算与导入不变量

- 账务金额用整数最小货币单位；奖励用整数 microRC，`1 RC = 1,000,000 microRC`。拒绝无效格式和不安全整数，不用浮点数累计金额。
- 奖励保留六位 RC，比例封顶仅截去不足 `0.000001 RC` 的部分。先精确累计再格式化，显示舍入不能回流计算。
- 先对完整会话按交易日和稳定来源顺序计算，再按自然半年汇总。赏世界年度额度跨半年连续，PULSE 额度每半年重置；不能对筛选子集重跑封顶。
- 当前已核实规则回套历史周期，不还原历史活动。仅已导入消费占用额度，期初占用视为零；个人登记生效期不限制历史回算。
- 赏世界登记或分配信息缺失时，按已登记且全额 5X 估算并提示；明确未登记或已有分配倍数时采用识别结果。其他地区、币种及支付资格缺少证据时保守判断。
- 退款、还款、费用等参与账务核对，但不赚取奖励；退款不扣回估算，也不释放额度。
- 每张卡保留独立收益；只有明确确认的归属证据才共享额度池，不能靠姓名或卡尾号猜测。
- 文件按 SHA-256 去重。跨文件交易只有银行唯一凭证与关键字段一致时才合并；疑似重复保留并提示。
- 缺失汇率、未知金额与零值必须区分。能确定的奖励继续展示，其余保持待计算；参考汇率不能作为地区或支付方式的资格证据。
- 赏世界封顶优先采用银行港币等值，缺失时用参考汇率并提示；更新汇率可能改变封顶及附加 RC，不能改写原币或入账金额。
- 批次结束后统一提交成功文件。取消撤销尚未提交的整批，保留此前结果；过期异步回调不能写入新会话或新批次。
- 结欠核对始终针对完整来源结单；差异只提示质量问题，不自动删除已读交易。

## 隐私与资源生命周期

- PDF、密码、交易及返现结果只在本机处理。业务会话仅驻留内存，刷新、关闭或重新开始后清空；不写入 localStorage、IndexedDB、Cookie、服务端、日志或埋点。
- 唯一允许的持久缓存是公开汇率报价、参考日期和获取时间。公开汇率使用固定 Frankfurter / ECB 来源，自成功获取起复用 6 小时，到期更新并自动重试；跨午夜、清空或重新导入不重置有效期，请求不得携带结单字段。示例用合成汇率，不请求或写入公开缓存。
- PDF 使用显式 Worker，字体、CMap 等资源随应用提供。引擎不可用时明确失败，不退回主线程假 Worker，不执行 PDF 脚本或跟随其中链接。
- 密码只传给单次本地解锁调用，不存入 UI 快照、日志或存储；连续错误 5 次暂停 60 秒。
- 提取完成、取消、移除、失败及过期回调都要释放 PDF、Worker 和原文件引用。
- 保持单份 25 MB / 200 页、本页累计 20 份 / 100 MB 的边界，不通过多批导入绕过会话限制。
- 测试只用合成数据。真实样本须明确授权后从仓库外读取，不扫描 Downloads；不提交原件、密码、姓名、卡号、交易原文、文件指纹或真实页面截图。

## UI、文案与加载

- 沿用 shadcn `b4hZZS5Uu` preset、Base UI 和 Remix Icon，优先组合已有控件及 Tailwind 工具类，不新增业务样式表、行内视觉样式或额外主题。
- 新控件通过 `pnpm dlx shadcn@4.22.1 add <component>` 生成并检查差异。项目不常驻安装 shadcn CLI；已有控件需要的状态变体与折叠动画保留在 `src/index.css`，新增控件时核对所需 CSS，不盲目恢复整个 CSS 包。
- 保持主色 `#D90012`、HSBC 六边形、正文 Inter、品牌标题 Roboto 500 和系统字体回退。
- 修改用户文案同步更新 `src/i18n/zh.ts` 和 `src/i18n/en.ts`，不要在组件中硬编码。
- 金额称「预计返现（RewardCash）」，单位 RC；人民币金额称参考价值。消费额度与返现上限要区分，部分待计算时不能暗示结果完整。
- 弹窗外壳同步打开，由 Base UI 管理焦点；规则、隐私和文件明细通过 `src/app/DialogContents.tsx` 共用按需加载入口，清空确认保持同步。
- 内容加载失败在原弹窗内重试，不刷新页面。关闭文件状态弹窗后导入继续，取消仍撤销未提交的整批；迟到的加载不能重开弹窗或改写批次。本批结束后才能补充文件。
- 保持键盘操作、焦点恢复、减少动态效果支持与窄屏可用性。

## 构建与部署

项目使用 Vercel 部署，配置为 `vercel.json`。`/assets/` 下的内容哈希资源缓存一年且不可变；HTML、favicon、分享预览图、robots.txt、sitemap.xml 和授权文本使用 `no-cache`。压缩由平台处理；本地 `vite preview` 不读取 Vercel 配置，实际响应头需部署后验证。

正式站点为 `https://rewards.lmmmmmm.dev/`。`src/app/seo.ts` 只维护规范网址、分享图规格和本地化元信息；`src/i18n/messages.ts` 提供不依赖 React 的语言与翻译逻辑，i18n 不反向依赖应用层或操作 DOM。`src/app/DocumentMetadata.tsx` 负责浏览器文档同步。

`scripts/vite/prerender.ts` 仅负责构建时预渲染与渲染资源释放；浏览器和预渲染共用 `src/app/AppRoot.tsx`，保持组件树一致。预渲染不运行副作用、不读取结单或请求汇率，服务端渲染入口不得进入浏览器包。`scripts/vite/seo.ts` 负责静态元信息、结构化数据、抓取文件及 `vite-plugin-open-graph` 接入，`vite.config.ts` 只组合插件并传入索引策略。仅为实际存在的单页生成站点地图，不为无独立网址的语言添加 hreflang；Vercel 预览构建使用 `noindex`，正式站点保持可索引。

标题、描述和分享元信息采用 i18n 文案。Open Graph 和 Twitter Card 仅由 `vite-plugin-open-graph` 生成，不重复注入。分享图使用 [OG Image Playground](https://og-playground.vercel.app/) 制作，PNG 统一为 1200 × 630，保存到 `public/social-card.png`；只保留最终图片，不提交一次性生成或验收文件。

生产构建仅显式隔离 React 运行时与 PDF.js 引擎。PDF 引擎、Worker、辅助资源及弹窗内容保持按需加载，不合并为首屏 vendor 包。

## 验证与交付

代码或依赖变更完成后运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和 `git diff --check`。仅文档变更检查事实、链接和 diff。

- Vitest 在 Node 环境下仅收集 `src/**/*.test.{ts,tsx}`，显式从 `vitest` 导入 API。测试与模块相邻，按 `<module>.test.ts` 或 `<module>.<scenario>.test.ts` 命名；跨模块用例归到主要验证入口。
- 重点覆盖金额、封顶、去重、缺失数据和异步取消；不写复刻实现的测试或无意义快照。共用合成数据放 `src/tests/fixtures/`，共用辅助函数放 `src/tests/helpers/`；单文件专用准备逻辑留在测试内，不用全局 setup 隐式注入依赖，业务代码不得导入测试支持模块。
- UI 或样式变更实际走查相关流程及 320 / 360 / 768 / 1280 / 1440 宽度，检查错误状态、键盘和减少动态效果。涉及弹窗时覆盖慢速加载、关闭、取消、后台导入、失败重试、Escape、Tab 限制及关闭后的焦点恢复。浏览器产物仅用合成数据并存到仓库外。
- 分包、缓存或 SEO 构建变更运行 `node scripts/audit-build.mjs /tmp/pulse-build-audit`。工具在仓库外构建，通过内存中的文案修改检查稳定资源哈希、PDF 与弹窗的懒加载边界；`scripts/audit-seo.mjs` 独立验证生成的预渲染 HTML、搜索元信息与分享图。验证不修改源码或常规 `dist/`。性能比较使用手机、桌面各至少三轮冷启动的中位数；重复访问和部署更新后的请求另行核验。
- 结单解析验证入口为 `node scripts/verify-pulse-samples.mjs /path/to/statement.pdf`，只输出匿名计数及状态；读取真实样本前须已有明确授权。
- 不保留只服务一次验收的生成器、报告或浏览器脚本；可复用的检查才进入仓库，且不进入应用包。
- 按变更同步用户文档和本文。交付说明实际改动、已执行验证及未验证项；不要把历史样本、浏览器覆盖或性能结果当作本次结论，也不要将类型检查视为浏览器验收。
