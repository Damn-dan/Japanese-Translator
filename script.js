const chatContainer = document.getElementById("chat-container");
const form = document.getElementById("input-form");
const userInput = document.getElementById("user-input");

// 监听表单提交
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // 创建一组 exchange：包含该句的用户气泡 + 译文 + 拆解
  const exchange = document.createElement("div");
  exchange.className = "exchange";
  chatContainer.appendChild(exchange);

  // 显示用户气泡
  addMessageBubble(text, "user", exchange);

  // 显示“翻译中…”的 bot 气泡
  const loadingId = addMessageBubble("翻译中，请稍候…", "bot", exchange);

  // 清空输入框
  userInput.value = "";

  scrollToBottom();

  try {
    // TODO：未来这里接入真正的翻译 + 语法解析 API
    const result = await fakeTranslateAndExplain(text);

    // 更新 bot 气泡内容为日文译文，并添加工具按钮
    updateBotBubble(loadingId, result.japanese);

    // 在这一组 exchange 下渲染对应的拆解
    renderExchangeAnalysis(exchange, result);
  } catch (error) {
    console.error(error);
    updateBotBubble(loadingId, "翻译失败，请稍后重试。");
  }

  scrollToBottom();
});

// 添加气泡（支持指定父容器）
function addMessageBubble(text, role, parent) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  let id = null;
  if (role === "bot") {
    id = `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    bubble.dataset.id = id;
  }

  row.appendChild(bubble);
  (parent || chatContainer).appendChild(row);
  return id;
}

// 更新 bot 气泡：文字 + 工具按钮（🔊 + 复制）
function updateBotBubble(id, japaneseText) {
  const bubble = chatContainer.querySelector(`.bubble[data-id="${id}"]`);
  if (!bubble) return;

  // 先设置文本
  bubble.textContent = japaneseText;

  // 工具按钮容器
  const tools = document.createElement("div");
  tools.className = "translation-tools";

  // 播放
