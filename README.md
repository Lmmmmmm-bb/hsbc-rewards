# Pulse Rewards

基于 Vite、React、TypeScript、Tailwind CSS 和 shadcn/ui 的项目，使用 shadcn preset `b4hZZS5Uu`。

Pulse Rewards 在浏览器本地分析 HSBC Pulse 英文 PDF 结单，提供交易明细、子账户结欠核对和按现行规则回算的返现估算。当前正在分阶段实现，完成情况以验收记录为准。

## 产品与开发文档

- [产品基线与完整功能范围](docs/PRODUCT.md)
- [架构、模块职责和数据不变量](docs/ARCHITECTURE.md)
- [官方规则与参考换算口径](docs/RULES.md)
- [阶段拆分、验收门槛和进度](docs/DEVELOPMENT.md)
- [变更记录](CHANGELOG.md)

每个阶段验收通过并独立提交后，再进入下一阶段。原始结单、密码和真实交易原文不提交到仓库。

## 当前可体验范围

S0–S2 已验收：四页工作台、中英文、主题、密度和内存会话。点击“查看演示”可查看经过真实领域计算的合成交易、子账户核对、按卡三档返现及额度池。演示不读取真实结单；刷新或关闭后数据清空。

真实 PDF 导入将在 S3 接入，筛选 / 来源定位 / CSV 在 S4，在线参考汇率和完整设置在 S5。首版尚未完成，不将演示页面视为真实结单解析验收。

S3.1a 已完成可独立测试的本地 PDF 提取与批次底座；文件入口和个人界面重写在 S3.1b 接入，真实交易模板在 S3.2 用授权样本校准。

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
