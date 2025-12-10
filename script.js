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

  // 播放按钮
  const speakBtn = document.createElement("button");
  speakBtn.className = "tool-button";
  speakBtn.textContent = "🔊 朗读";
  speakBtn.addEventListener("click", () => {
    speakJapanese(japaneseText);
  });

  // 复制按钮
  const copyBtn = document.createElement("button");
  copyBtn.className = "tool-button";
  copyBtn.textContent = "📋 复制";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(japaneseText);
      copyBtn.textContent = "✅ 已复制";
      setTimeout(() => {
        copyBtn.textContent = "📋 复制";
      }, 1500);
    } catch (e) {
      alert("复制失败，请手动选择文本复制。");
    }
  });

  tools.appendChild(speakBtn);
  tools.appendChild(copyBtn);

  bubble.appendChild(document.createElement("br"));
  bubble.appendChild(tools);
}

// 使用浏览器自带语音合成朗读日语
function speakJapanese(text) {
  if (!window.speechSynthesis) {
    alert("当前浏览器不支持语音朗读功能。");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

// 模拟翻译 & 解析函数：先用假数据占位，之后接 OpenAI / 其他 API
async function fakeTranslateAndExplain(chineseText) {
  // 真实情况应该是调用后端 API，这里先假装一下
  const japanese = `【假翻译】${chineseText} 的日文（以后接入真实 API）`;

  // 伪造拆解内容
  const words = [
    {
      jp: "私",
      romaji: "わたし",
      meaning: "我",
      grammar: "名词，第一人称"
    },
    {
      jp: "今日",
      romaji: "きょう",
      meaning: "今天",
      grammar: "时间名词"
    },
    {
      jp: "日本へ",
      romaji: "にほん へ",
      meaning: "去日本",
      grammar: "助词 へ 表示方向"
    }
  ];

  const grammarSummary =
    "这里将来会根据整句自动分析语法结构，例如：主语 + 时间 + 方向 + 动词 等等。";

  return {
    japanese,
    words,
    grammarSummary
  };
}

// 在当前这一组（exchange）下渲染拆解
function renderExchangeAnalysis(exchange, result) {
  const block = document.createElement("div");
  block.className = "analysis-block";

  const title = document.createElement("p");
  title.className = "analysis-block-title";
  title.textContent = "句子拆解 · 词汇 & 语法";
  block.appendChild(title);

  result.words.forEach((w) => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.innerHTML = `
      <strong>${w.jp}</strong>（${w.romaji}） · 意思：${w.meaning}<br />
      语法：${w.grammar}
    `;
    block.appendChild(div);
  });

  const g = document.createElement("p");
  g.textContent = result.grammarSummary;
  block.appendChild(g);

  exchange.appendChild(block);
}

// 滚动到底部
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
