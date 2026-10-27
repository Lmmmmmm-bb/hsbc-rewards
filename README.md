# Pulse Rewards

基于 Vite、React、TypeScript、Tailwind CSS 和 shadcn/ui 的项目，使用 shadcn preset `b4hZZS5Uu`。

Pulse Rewards 是面向个人的返现工具：上传 HSBC Pulse 英文 PDF，在同一页查看按现行规则回算的三档返现。只保留本次临时结果，刷新后清空；不提供账单页、设置或保存功能。当前正在分阶段实现，完成情况以验收记录为准。

## 产品与开发文档

- [产品基线与完整功能范围](docs/PRODUCT.md)
- [架构、模块职责和数据不变量](docs/ARCHITECTURE.md)
- [官方规则与参考换算口径](docs/RULES.md)
- [阶段拆分、验收门槛和进度](docs/DEVELOPMENT.md)
- [变更记录](CHANGELOG.md)

每个阶段验收通过并独立提交后，再进入下一阶段。原始结单、密码和真实交易原文不提交到仓库。

## 当前可体验范围

当前界面使用 shadcn `b4hZZS5Uu` preset，始终显示同一套上传、返现总览、逐卡明细和规则说明。卡片直接展示三档奖励、分币种计奖金额、覆盖时间及额度使用。点击“查看示例”体验合成返现；选择 PDF 后清除示例，改为本地读取文件。

真实 PDF 已接入本地读取、密码解锁、结单识别与整批入账；成功文件在本批结束后统一加入返现，取消不影响此前结果。四份正式样本在页面合并为 1 张双币卡、4 份结单、135 笔交易 / 128 笔消费，8 个币种子账户核对一致。全工作区 129 项核心测试通过；已在 <http://localhost:5173/> 验证混合错误、解锁、取消、重复、零消费、核对差异、五种宽度及刷新清空。

返现解释已在 [S4 独立验收](docs/ACCEPTANCE-S4.md)：逐档原因、待计算档中的已知奖励、完整周期额度、来源结欠和疑似重复提示均已接入。全工作区 139 项核心测试通过。参考汇率尚待 S5：目前先展示已确定的 RC，CNY 折算与依赖汇率的封顶奖励明确标为待计算，尚未宣称首版全部完成。

本轮范围已按用户最新要求收敛，旧四页、设置、加密档和历史计划不再继续执行。后续以返现结果解释、参考汇率和真实样本质量验收为主。

本阶段 [单页验收记录](docs/ACCEPTANCE-S3-1b.md) 已通过，原生拖放由用户手动确认。阶段提交后进入真实模板与统一入账，不将文本提取成功视为真实返现完成。

[真实导入与批次验收](docs/ACCEPTANCE-S3-2b.md) 记录了正式文件与合成错误场景，区分文本提取、识别成功和已计入返现。

解析器的 [独立验收记录](docs/ACCEPTANCE-S3-2a.md) 区分合成边界测试与正式样本结果。可用 `node scripts/verify-pulse-samples.mjs /path/to/statement.pdf` 本地复核；该命令只打印匿名计数和核对状态。

## 本地开发

使用 Node.js 24（见 `.nvmrc`）和 pnpm 12.15.0。

```sh
pnpm install
pnpm dev
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动开发服务 |
| `pnpm build` | 类型检查并构建到 `dist/` |
| `pnpm preview` | 预览构建结果 |
| `pnpm lint` | 检查代码规范 |
| `pnpm typecheck` | 检查 TypeScript 类型 |
| `pnpm test` | 执行一次单元测试 |
| `pnpm test:watch` | 监听文件变化并执行单元测试 |

## 项目约定

- 页面入口：`src/App.tsx`。
- 全局样式与主题：`src/index.css`。
- UI 组件：`src/components/ui/`；shadcn 配置：`components.json`。
- 工具函数：`src/lib/`。
- 路径别名：`@/` 指向 `src/`。

添加 shadcn 组件：

```sh
pnpm exec shadcn add <component>
```

## 单元测试

Vitest 只用于单元测试，在 Node 环境运行，不配置浏览器模式、集成测试或端到端测试。
测试文件与被测模块放在一起，命名为 `*.test.ts` 或 `*.test.tsx`，仅收集 `src/` 下的测试文件。
从 `vitest` 显式导入 `describe`、`it`、`expect` 等 API。

配置位于 `vitest.config.ts`，复用 Vite 的插件与路径别名。
`src/lib/utils.test.ts` 提供工具函数单测示例。
