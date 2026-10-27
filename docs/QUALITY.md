# 本地质量验收工具

应用使用 Vitest 覆盖核心函数，浏览器走查和 Lighthouse 是独立的显式验收流程，不改变单元测试配置，也不自动读取 Downloads。

## 日常检查

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

正式样本仅在获得授权后，通过 `node scripts/verify-pulse-samples.mjs /path/to/statement.pdf` 本地验证。只输出匿名计数 / 状态，不落盘原文。该命令不代替浏览器文件输入和返现验收。

## Lighthouse

需要本地 Chrome 和 Node.js。测试工具可单独装在临时目录，避免加入应用运行依赖：

```sh
npm install --prefix /tmp/pulse-audit-tools lighthouse@13.5.0 puppeteer-core@25.16.0
pnpm exec vite preview --host 127.0.0.1 --port 5173 --strictPort
```

在另一终端运行：

```sh
node scripts/audit-workspace.mjs /tmp/pulse-audit-tools/node_modules /tmp/pulse-quality mobile
node scripts/audit-workspace.mjs /tmp/pulse-audit-tools/node_modules /tmp/pulse-quality desktop
```

仅访问固定 localhost，并点击内置合成示例。导航测性能和无障碍；结果、展开说明和弹窗使用快照测无障碍，快照无加载性能分数。报告写入指定目录，浏览器使用独立临时配置并在结束时关闭。加载性能低于 90、无障碍低于 95 或仍有有权重的无障碍失败项时返回非零状态。其他系统通过 `CHROME_PATH` 指定 Chrome 可执行文件。

依据：[Lighthouse 官方概览](https://developer.chrome.com/docs/lighthouse/overview)、[官方用户流程 API](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md)。

## 100 页本地导入

生成器需要 Python 与 reportlab。它固定生成假账号、假商户和 100 页 / 2,000 笔交易，不读取任何真实文件。

```sh
python3 scripts/create-synthetic-benchmark.py /tmp/pulse-quality
node scripts/benchmark-import.mjs /tmp/pulse-audit-tools/node_modules /tmp/pulse-quality import
```

可在最后传入不同 run 名称保留独立报告。此测试使用上述生成器的固定文件名，不提供任意结单路径入口。参考汇率被合成 0.85 值替代，不访问真实汇率源；其他外部请求被阻止。实际服务可达性仍需独立验证。

计时从选择文件开始，直到完整 RC / CNY 结果渲染；浏览器缓存关闭，CPU 不节流，页面已加载。长任务按与处理区间有交集的任务统计，PerformanceObserver 阈值为 50ms，并保留 Lighthouse timespan 以交叉验证。报告中的 0 表示未观察到超阈值任务；耗时达到 5 秒或有超阈值任务时返回非零状态。

真实业务数据不能用于上述会输出页面快照的 Lighthouse 流程。首版结果、设备条件和已确认的范围见 [最终验收](ACCEPTANCE-S6-2.md)。
