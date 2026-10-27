# 仓库协作指南

本文件适用于整个仓库，供编码代理及维护者使用。用户的新指令优先于本文；修改前先阅读相关实现与文档，不依据旧阶段记录恢复已撤回的功能。

## 项目定位与文档入口

Rewards 是面向个人的 HSBC PULSE 银联双币钻石卡返现估算工具。当前产品只有“本地导入英文 PDF → 查看返现”这一条单页流程。

按任务需要阅读以下文档：

| 文档 | 用途 |
| --- | --- |
| [README.md](README.md) | 面向用户的介绍、操作步骤、隐私和限制 |
| [public/licenses/shadcn-ui.txt](public/licenses/shadcn-ui.txt) | shadcn/ui 版权与授权声明 |
| [public/licenses/roboto-OFL.txt](public/licenses/roboto-OFL.txt) | Roboto 字体授权声明 |

当前范围以本文、README 和现有实现为准。四页工作台、设置、CSV、加密档、vault、备份和跨会话历史均不属于当前实现目标；未经新的范围确认，不创建对应模块。

## 本地运行

使用 Node.js 24（见 `.nvmrc`）和 pnpm 12.15.0（见 `package.json` 的 `packageManager`）。仓库使用 ES modules，依赖锁文件为 `pnpm-lock.yaml`。

```sh
pnpm install
pnpm dev
```

开发服务通常位于 `http://localhost:5173/`，以实际启动输出为准。

| 命令 | 用途 |
| --- | --- |
| `pnpm typecheck` | 检查 TypeScript 类型 |
| `pnpm lint` | 检查代码规范 |
| `pnpm test` | 执行一次核心单元测试 |
| `pnpm test:watch` | 监听并运行单元测试 |
| `pnpm build` | 类型检查并生成 `dist/` |
| `pnpm preview` | 预览构建结果 |

不要直接修改生成的 `dist/` 或 `node_modules/`。依赖变更使用 pnpm 并同步锁文件；不要为无关任务升级依赖。

## 模块与依赖方向

技术栈为 React、TypeScript、Vite、Tailwind CSS、shadcn/ui 和 Vitest。`@/` 指向 `src/`。

| 位置 | 职责 |
| --- | --- |
| `src/App.tsx`、`src/app/` | 页面入口与应用 Provider |
| `src/domain/` | 纯函数：解析、金额、规范化、分类、核对及返现计算 |
| `src/application/` | 导入批次、会话提交、查询及汇率流程编排 |
| `src/ports/` | PDF、结单解析及汇率接口 |
| `src/adapters/` | PDF.js、模板接入、SHA-256、公开汇率及其缓存实现 |
| `src/store/` | 可订阅的内存会话和 React 接入 |
| `src/features/` | 导入与返现业务界面 |
| `src/components/ui/` | shadcn 通用控件 |
| `src/components/workspace/` | 工作区布局与共用展示组件 |
| `src/i18n/` | 中英文消息与格式化 |
| `src/index.css` | 全局主题、字体及既有样式入口 |
| `src/test-support/fixtures/` | 单测共用的合成交易、结单及导入文件数据 |
| `src/test-support/helpers/` | 单测共用的异步控制及奖励计算上下文 |
| `scripts/` | 显式运行的本地验收工具，不进入应用包 |

- 领域层不依赖 React、浏览器 API、PDF.js、网络或存储。
- 应用层通过端口调用适配器；UI 通过应用查询和 store 读取结果，不直接导入 PDF 引擎或汇率请求实现。
- 资格、金额、额度和质量统计在领域层或应用查询中计算，组件只展示结果。
- 错误与原因使用稳定代码，面向用户的句子在 i18n 中维护。

## 必须保持的业务不变量

- 账务金额使用整数最小货币单位；奖励使用整数 microRC，`1 RC = 1,000,000 microRC`。拒绝无效格式及不安全整数，不用浮点数累计金额。
- 普通奖励保留六位 RC，比例封顶仅截去不足 `0.000001 RC` 的部分。先精确累计再格式化；显示舍入不能回流计算。
- 先对完整会话按交易日和稳定来源顺序计算，再按自然半年汇总。赏世界年度额度跨半年连续，PULSE 额度每半年重置；不能对筛选子集重跑封顶。
- 当前已核实规则回套历史周期，不还原历史活动。仅已导入消费占用额度，期初占用视为零；个人登记生效期不限制历史回算。
- 赏世界登记或分配信息缺失时，按已登记且全额 5X 估算并提示；明确未登记或已有分配倍数时采用识别结果。其他地区、币种及支付资格缺少证据时保守判断。
- 退款、还款、费用等参与账务核对，但不赚取奖励；退款不扣回估算，也不释放额度。
- 每张卡保留独立收益；只有明确确认的归属证据才共享额度池，不能靠姓名或卡尾号猜测。
- 文件按 SHA-256 去重。跨文件交易只有银行唯一凭证与关键字段一致时才合并；疑似重复保留并提示。
- 缺失汇率、未知金额与零值必须区分。能确定的奖励继续展示，其余保持待计算；参考汇率不能作为地区或支付方式的资格证据。
- 赏世界封顶优先采用银行港币等值，缺失时使用参考汇率并提示；更新汇率可能改变封顶与附加 RC，不能改写原币或入账金额。
- 批次结束后统一提交成功文件。取消撤销尚未提交的整批，保留此前结果；过期异步回调不能写入新会话或新批次。
- 结欠核对始终针对完整来源结单；核对差异提示质量问题，不自动删除已读交易。

## 隐私与资源生命周期

- PDF、密码、交易及返现结果只在本机处理。业务会话仅驻留内存，刷新、关闭或重新开始后清空。
- 不把业务数据写入 localStorage、IndexedDB、Cookie、服务端、日志或埋点。唯一允许的持久缓存是公开汇率报价、参考日期与获取时间。
- 公开汇率使用固定 Frankfurter / ECB 来源，按香港自然日复用、跨天更新并自动重试；请求不得携带任何结单字段。示例使用合成汇率，不请求或写入公开缓存。
- PDF 使用显式 Worker，静态字体、CMap 等资源随应用提供；引擎不可用时明确失败，不退回主线程假 Worker，不执行 PDF 脚本或跟随其中的链接。
- 密码仅传给单次本地解锁调用，不存入 UI 快照、日志或存储。连续错误 5 次暂停 60 秒。
- 提取完成后及时释放 PDF、Worker 和原文件引用；取消、移除、失败及过期回调同样清理资源。
- 保持单份 25 MB / 200 页、本页累计 20 份 / 100 MB 的输入边界，不通过多批导入绕过会话限制。
- 测试使用合成数据。真实样本仅在明确授权后从仓库外读取，不主动扫描 Downloads；不提交原件、密码、姓名、卡号、交易原文、文件指纹或真实页面截图。

## 界面与文案

- 沿用 shadcn `b4hZZS5Uu` preset、Base UI 控件及 Remix Icon。优先组合已有 `components/ui` 组件与 Tailwind 工具类，不新增业务样式表、行内视觉样式或额外主题。
- 需要新 shadcn 控件时使用 `pnpm exec shadcn add <component>`，检查生成差异并保留授权文本。
- 保持当前品牌规范：主色 `#D90012`、HSBC 六边形、正文 Inter、标题 Roboto 500 及系统字体回退。六边形来源记录在 `src/assets/hsbc/hsbc-hexagon.svg` 注释中；第三方授权声明保留在 `public/licenses/`。
- 新增和修改文案同步更新 `src/i18n/zh.ts` 与 `src/i18n/en.ts`，避免组件内硬编码用户文案。
- 金额称“预计返现（RewardCash）”，单位 RC；人民币金额称参考价值。消费额度与返现上限要区分，部分待计算时不能暗示结果完整。
- 保持键盘焦点、弹窗关闭行为、减少动态效果支持和窄屏可用性。文件状态弹窗关闭后继续处理；本批结束后才能补充文件。
- README 始终面向使用者。开发命令、目录说明和验证要求放在本文，不要把技术栈和阶段报告放回用户指南。

## 验证与交付

- 代码变更完成后运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`，并检查 `git diff --check`。仅文档变更检查事实、链接和 diff 即可。
- Vitest 仅收集 `src/**/*.test.{ts,tsx}`，在 Node 环境运行；测试与被测模块相邻，显式从 `vitest` 导入 API。重点测试金额、封顶、去重、缺失数据及异步取消等业务边界，不写复刻实现的测试或无意义快照。
- 单测按被测模块命名为 `<module>.test.ts`；同一入口的独立场景可使用 `<module>.<scenario>.test.ts`（如 `controller.pipeline.test.ts`、`calculate.precision.test.ts`）。跨模块用例按主要验证的入口归属，避免集中到泛称的测试文件。
- 共用合成数据放在 `src/test-support/fixtures/`，共用执行辅助函数放在 `src/test-support/helpers/`；只供一个测试文件使用的准备逻辑留在本文件。测试支持模块仅供单测导入，不进入业务代码；不要通过全局 setup 隐式注入数据或依赖。
- UI 变更实际走查相关流程及 320 / 360 / 768 / 1280 / 1440 宽度，检查键盘与错误状态；不能把类型检查当作浏览器验收。
- 涉及性能、无障碍或导入资源生命周期时，使用 `scripts/audit-workspace.mjs`、`scripts/benchmark-import.mjs` 或 `scripts/audit-reward-interactions.mjs` 验收，先检查对应脚本的入口参数。输出截图或页面快照的流程只使用合成数据。
- 真实样本验证可使用 `node scripts/verify-pulse-samples.mjs /path/to/statement.pdf`；仅在已获授权时运行，只记录匿名计数与状态。
- 按变更同步 README 和本文中的相关说明；多阶段工作每个阶段完成验证并记录证据后再推进。
- 当前已验收范围为 4 份真实样本与 Chromium；扩展样本、Safari / Firefox、OCR 仍待补齐。不要把历史测试数量、性能分数或样本结果当作本次验证结论。
- 交付时说明实际改动、已执行验证与尚未验证项，不编造测试结果或提前标记验收通过。
