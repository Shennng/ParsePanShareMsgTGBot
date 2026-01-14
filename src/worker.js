/**
 * Telegram Bot on Cloudflare Workers
 * 解析频道消息并提取资源信息
 */

// 从环境变量获取配置
const config = {
  TELEGRAM_BOT_TOKEN: '', // 将在 wrangler.toml 中配置
  WEBHOOK_SECRET: '', // 可选：用于验证 webhook 请求
};

/**
 * 解析消息内容，提取资源信息
 * @param {string} text - 消息文本
 * @param {Array} entities - 消息实体列表
 * @returns {Object} 包含资源名称、标签、描述和链接的对象
 */
function parseMessage(text, entities = []) {
  const result = {
    name: '未知名称',
    tags: '无标签',
    description: '无描述',
    link: '无链接',
  };

  // 正则提取资源名称：开头到第一个 # 前的部分
  const nameMatch = text.match(/^(.+?)(?=\s*#)/s);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  // 提取标签：所有 # 开头的词
  const tagsMatch = text.match(/#\S+/g);
  if (tagsMatch) {
    result.tags = tagsMatch.join(' ');
  }

  // 提取描述：标签后到链接提示前的文本
  const lastTagIndex = tagsMatch
    ? text.lastIndexOf(tagsMatch[tagsMatch.length - 1]) + tagsMatch[tagsMatch.length - 1].length
    : result.name.length;
  const descEnd = text.indexOf('💾 获取资源请点击：');
  if (descEnd !== -1) {
    result.description = text.slice(lastTagIndex, descEnd).trim();
  } else {
    // 如果没有找到特定标记，尝试通用的"获取资源"标记
    const genericDescEnd = text.search(/获取资源/i);
    if (genericDescEnd !== -1) {
      result.description = text.slice(lastTagIndex, genericDescEnd).trim();
    }
  }

  // 提取链接文本：👉 ... 👈 部分
  const linkMatch = text.match(/👉\s*(.+?)\s*👈/);
  if (linkMatch) {
    result.link = linkMatch[1].trim();
  }

  // 处理隐藏链接（Telegram 实体）- 优先查找包含"点我获取"的链接
  if (entities && entities.length > 0) {
    for (const entity of entities) {
      if (entity.type === 'text_link') {
        const linkText = text.slice(entity.offset, entity.offset + entity.length);
        if (linkText.includes('点我获取') || linkText.includes('点击获取')) {
          result.link = entity.url;  // 获取真实 URL（如夸克网盘链接）
          break;
        }
      }
    }

    // 如果没有找到"点我获取"链接，使用第一个 text_link
    if (result.link === '无链接') {
      for (const entity of entities) {
        if (entity.type === 'text_link') {
          result.link = entity.url;
          break;
        } else if (entity.type === 'url') {
          const start = entity.offset;
          const length = entity.length;
          result.link = text.substring(start, start + length);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * 格式化解析结果
 * @param {Object} parsedData - 解析后的数据
 * @returns {string} 格式化后的字符串
 */
function formatResult(parsedData) {
  return `资源名称：${parsedData.name}\n资源标签：${parsedData.tags}\n资源描述：${parsedData.description}\n资源链接：${parsedData.link}`;
}

/**
 * 发送消息到 Telegram
 * @param {string} chatId - 聊天ID
 * @param {string} text - 消息文本
 * @param {string} botToken - Bot Token
 */
async function sendMessage(chatId, text, botToken) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}

/**
 * 处理 /start 命令
 */
function getStartMessage() {
  return (
    '👋 欢迎使用资源消息解析机器人！\n\n' +
    '📌 使用方法：\n' +
    '直接转发或发送包含资源信息的消息给我，我会自动解析并整理格式。\n\n' +
    '💡 支持的信息：\n' +
    '• 资源名称\n' +
    '• 资源标签（#标签）\n' +
    '• 资源描述\n' +
    '• 资源链接\n\n' +
    '快来试试吧！'
  );
}

/**
 * 处理 /help 命令
 */
function getHelpMessage() {
  return (
    '📖 使用帮助\n\n' +
    '1️⃣ 转发频道消息给我\n' +
    '2️⃣ 或直接发送包含资源信息的文本\n' +
    '3️⃣ 我会自动解析并返回整理后的信息\n\n' +
    '示例消息格式：\n' +
    '小梨听书 1.0.6去广告版.apk #去广告版 #纯净听书 纯净听书体验... 获取资源请点击：[链接]'
  );
}

/**
 * 处理 Telegram 更新
 * @param {Object} update - Telegram 更新对象
 * @param {Object} env - 环境变量
 */
async function handleUpdate(update, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;

  if (!update.message) {
    return new Response('OK', { status: 200 });
  }

  const message = update.message;
  const chatId = message.chat.id;

  // 处理命令
  if (message.text && message.text.startsWith('/')) {
    const command = message.text.split(' ')[0];

    if (command === '/start') {
      await sendMessage(chatId, getStartMessage(), botToken);
      return new Response('OK', { status: 200 });
    }

    if (command === '/help') {
      await sendMessage(chatId, getHelpMessage(), botToken);
      return new Response('OK', { status: 200 });
    }
  }

  // 处理普通消息（忽略命令）
  if (message.text && !message.text.startsWith('/')) {
    const messageText = message.text;
    const entities = message.entities || [];

    // 解析消息
    const parsedData = parseMessage(messageText, entities);

    // 格式化并发送结果
    const resultText = formatResult(parsedData);
    await sendMessage(chatId, resultText, botToken);

    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

/**
 * Cloudflare Workers 入口
 */
export default {
  async fetch(request, env, ctx) {
    // 只接受 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const update = await request.json();
      return await handleUpdate(update, env);
    } catch (error) {
      console.error('Error processing update:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
