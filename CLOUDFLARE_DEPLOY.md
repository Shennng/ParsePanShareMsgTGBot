# Cloudflare Workers 部署指南

本指南将帮助你将 Telegram 机器人部署到 Cloudflare Workers。

## 前置要求

1. Cloudflare 账号（[注册地址](https://dash.cloudflare.com/sign-up)）
2. Node.js 16.x 或更高版本
3. npm 或 yarn 包管理器
4. Telegram Bot Token（从 [@BotFather](https://t.me/botfather) 获取）

## 部署步骤

### 1. 安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的官方 CLI 工具。

```bash
npm install -g wrangler
```

或使用 yarn：

```bash
yarn global add wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器窗口，要求你登录 Cloudflare 账号并授权 Wrangler。

### 3. 配置项目

编辑 `wrangler.toml` 文件，填入你的 Cloudflare Account ID：

```toml
account_id = "your_account_id"
```

你可以在 Cloudflare Dashboard 右侧栏找到 Account ID。

### 4. 设置环境变量（Bot Token）

为了安全，Bot Token 需要通过 secret 方式设置：

```bash
wrangler secret put BOT_TOKEN
```

系统会提示你输入 Bot Token，粘贴后按回车。

### 5. 部署到 Cloudflare Workers

```bash
wrangler deploy
```

部署成功后，你会看到 Worker 的 URL，类似：

```
https://telegram-resource-parser-bot.your-subdomain.workers.dev
```

### 6. 设置 Telegram Webhook

将 Worker URL 设置为 Telegram Bot 的 Webhook：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://telegram-resource-parser-bot.your-subdomain.workers.dev"}'
```

将 `<YOUR_BOT_TOKEN>` 替换为你的实际 Bot Token。

### 7. 验证部署

发送消息给你的机器人进行测试：

1. 在 Telegram 中找到你的机器人
2. 发送 `/start` 命令
3. 如果收到欢迎消息，说明部署成功！

## 更新部署

修改代码后，重新部署：

```bash
wrangler deploy
```

## 查看日志

实时查看 Worker 日志：

```bash
wrangler tail
```

## 环境管理

### 开发环境

部署到开发环境：

```bash
wrangler deploy --env dev
```

### 生产环境

部署到生产环境：

```bash
wrangler deploy --env production
```

## 删除 Webhook

如果需要切换回 polling 模式或删除 webhook：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## 常见问题

### Q: 部署失败，提示权限错误？

A: 确保你已经登录 Cloudflare 并且在 `wrangler.toml` 中设置了正确的 `account_id`。

### Q: 机器人不响应消息？

A: 检查以下几点：
1. Webhook 是否正确设置（使用 `getWebhookInfo` API 查询）
2. Bot Token 是否正确设置（使用 `wrangler secret list` 查看）
3. 查看 Worker 日志（使用 `wrangler tail`）

### Q: 如何查看当前 Webhook 状态？

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Q: Workers 免费计划的限制？

Cloudflare Workers 免费计划提供：
- 每天 100,000 次请求
- 10ms CPU 时间限制（每次请求）
- 适合个人和小型项目使用

如需更多配额，可以升级到 [Workers Paid Plan](https://developers.cloudflare.com/workers/platform/pricing/)。

### Q: 如何切换回 Python 版本（polling 模式）？

1. 删除 Telegram Webhook
2. 在 VPS 或本地运行 `bot.py`

## 监控和调试

### 查看 Worker 状态

访问 Cloudflare Dashboard：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 Workers & Pages
3. 点击你的 Worker 名称
4. 查看请求统计、错误率等信息

### 实时日志

使用 wrangler tail 查看实时日志：

```bash
wrangler tail --format pretty
```

### 本地开发测试

在本地测试 Worker（需要配置本地环境）：

```bash
wrangler dev
```

这将启动一个本地服务器，你可以使用工具如 ngrok 创建公网 URL 来测试 Webhook。

## 性能优化

1. **响应时间优化**：Worker 会在全球边缘节点运行，响应速度极快
2. **并发处理**：Workers 自动处理并发请求，无需额外配置
3. **缓存策略**：可以使用 Cloudflare Cache API 缓存频繁访问的数据

## 安全建议

1. 永远不要在代码中硬编码 Bot Token
2. 使用 `wrangler secret` 管理敏感信息
3. 考虑添加 Webhook Secret 验证（可选）
4. 定期检查 Worker 日志，监控异常活动

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Telegram Bot API 文档](https://core.telegram.org/bots/api)

## 支持

如有问题，请查看：
- [GitHub Issues](https://github.com/yourusername/parseMSGTGBot/issues)
- [Cloudflare Workers 社区](https://community.cloudflare.com/c/developers/workers/40)
