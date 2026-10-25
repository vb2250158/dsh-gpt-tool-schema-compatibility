# dsh-gpt-tool-schema-compatibility

This release requires DSH 0.2.1-alpha.1 or a compatible 0.2 release. See [compatibility details](docs/dsh-0.2-compatibility.md).

修复 GPT/Codex 在 Full access 下的工具参数冲突。

DSH 0.2.1-rc.3 的 `system-prompt/assemble` 只提供提示词文字与运行时上下文，工具 schema 由执行器提供。此版本保留这些文字与上下文，不再在该事件中改写工具参数；旧版仍提供 `tools` 的事件继续使用原有适配。

## 安装

锁定公开仓库的提交后，通过 DSH 官方入口安装：

```powershell
pnpm dsh plugin --profile web add github:vb2250158/dsh-gpt-tool-schema-compatibility#<commit>
```

插件包声明 `dsh.bundle`，安装后会把自己的配置层加入 profile。

## 配置

插件配置保存在 DSH profile 的 `cordis.patch.yml`。多电脑同步仓库只保存仓库地址、固定提交、启停状态和配置，不保存本仓库源码。

## 验证

```powershell
npm test
npm pack --dry-run
```

使用已构建的 rc.3 源码与聊天增强源码设置 `DSH_SOURCE_ROOT`、`DSH_CHAT_ENHANCEMENT_SOURCE` 后，运行 `node --test tests/rc3-presentation.integration.mjs` 验证两个插件共同经过真实提示词服务时保留执行器 schema。

## 许可证

MIT

## Plugin display metadata

The plugin list shows **GPT tool compatibility** in English and **GPT 工具兼容** in Chinese, following the DSH interface language. `locale/en.json` and `locale/zh.json` provide the title and description; `icon.svg` supplies self-contained artwork. The package exports and publishes these resources. The icon is adapted from Lucide; see [ICON_LICENSE.txt](ICON_LICENSE.txt).

The icon uses a centered 36 × 36 viewBox to leave more space around the artwork inside the plugin icon frame.
