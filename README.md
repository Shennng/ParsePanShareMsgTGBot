# Telegram 资源消息解析机器人

一个用于解析 Telegram 频道资源消息的机器人，自动提取资源名称、标签、描述和链接。

## 功能特点

- 自动解析频道转发的资源消息
- 提取资源名称（支持 .apk、.exe、.zip 等常见文件格式）
- 提取资源标签（#标签格式）
- 提取资源描述文本
- 提取资源链接（支持夸克网盘等各类链接）
- 格式化输出，便于阅读和分享

## 消息示例

**输入消息：**
```
小梨听书 1.0.6去广告版-幻幻喵.apk #去广告版 #纯净听书 #本地导入
纯净听书体验，彻底告别广告打扰。精选海量有声资源，支持本地导入，界面简洁操作流畅。专注内容本身，让你随时随地沉浸于精彩故事之中。
获取资源请点击： 点我获取小梨听书 1.0.6去广告版-幻幻喵.apk
```

**输出结果：**
```
📦 资源信息整理

📝 资源名称：小梨听书 1.0.6去广告版-幻幻喵.apk

🏷️ 资源标签：#去广告版 #纯净听书 #本地导入

📄 资源描述：纯净听书体验，彻底告别广告打扰。精选海量有声资源，支持本地导入，界面简洁操作流畅。专注内容本身，让你随时随地沉浸于精彩故事之中。

🔗 资源链接：[夸克网盘链接]
```

## 快速开始

### 前置要求

- Python 3.8 或更高版本
- Telegram Bot Token（从 [@BotFather](https://t.me/botfather) 获取）

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/parseMSGTGBot.git
cd parseMSGTGBot
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 BOT_TOKEN
```

4. 运行机器人
```bash
python bot.py
```

## 使用方法

1. 在 Telegram 中找到你的机器人
2. 发送 `/start` 开始使用
3. 转发或发送包含资源信息的消息
4. 机器人会自动解析并返回格式化的结果

## 部署方案

### 方案一：本地/VPS 部署

使用 systemd 或 supervisor 保持机器人持续运行。

#### systemd 配置示例

创建 `/etc/systemd/system/tg-parser-bot.service`：

```ini
[Unit]
Description=Telegram Resource Parser Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/parseMSGTGBot
Environment="BOT_TOKEN=your_token_here"
ExecStart=/usr/bin/python3 /path/to/parseMSGTGBot/bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable tg-parser-bot
sudo systemctl start tg-parser-bot
```

### 方案二：Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot.py .

CMD ["python", "bot.py"]
```

构建并运行：
```bash
docker build -t tg-parser-bot .
docker run -d --name tg-parser-bot -e BOT_TOKEN=your_token_here tg-parser-bot
```

### 方案三：Cloudflare Workers 部署

由于 Cloudflare Workers 不支持 Python，需要使用 JavaScript/TypeScript 版本。

查看 [worker.js](worker.js) 和 [wrangler.toml](wrangler.toml) 了解详情。

## 项目结构

```
parseMSGTGBot/
├── bot.py              # Python 版机器人主程序
├── worker.js           # Cloudflare Workers 版本
├── wrangler.toml       # Cloudflare Workers 配置
├── requirements.txt    # Python 依赖
├── .env.example        # 环境变量示例
└── README.md          # 项目文档
```

## 开发

### 消息解析逻辑

机器人使用正则表达式提取消息中的各个部分：

- **资源名称**：匹配第一行或带文件扩展名的文本
- **标签**：匹配 `#` 开头的词汇
- **描述**：提取标签后、"获取资源"之前的文本
- **链接**：从 Telegram 消息实体中提取 URL

### 自定义解析规则

修改 [bot.py](bot.py) 中的 `parse_message()` 函数来调整解析逻辑。

## 常见问题

**Q: 机器人无法提取链接？**
A: 确保消息中的链接是有效的超链接格式，而不是纯文本。

**Q: 资源名称提取不正确？**
A: 检查文件名格式，确保包含常见的文件扩展名（.apk、.exe 等）。

**Q: 如何添加新的文件类型支持？**
A: 在 `parse_message()` 函数的正则表达式中添加新的扩展名。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。
