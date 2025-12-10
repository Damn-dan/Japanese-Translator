const chatContainer = document.getElementById("chat-container");
const form = document.getElementById("input-form");
const userInput = document.getElementById("user-input");

// 提交事件：每次输入一句中文，生成一整组 exchange
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // 创建一个对话组容器：包含中文 + 日文 + 拆解
  const exchange = document.createElement("div");
  exchange.className = "exchange";
  chatContainer.appendChild(exchange);

  // 1. 用户中文气泡
  addMessageBubble(text, "user", exchange);

  // 2. 先插入“翻译中”的日文气泡
  const loadingId = addMessageBubble("翻译中，请稍候…", "bot", exchange);

  // 清空输入框
  userInput.value = "";
  scrollToBottom();

  try {
    // TODO：未来这里接 OpenAI / 其他真实翻译 + 语法 API
    const result = await fakeTranslateAndExplain(text);

    // 3. 更新日文气泡为真正的日文译文，并附加“朗读 + 复制”按钮
    updateBotBubble(loadingId, result.japanese);

    // 4. 在这一组 exchange 下，渲染对应的拆解
    renderExchangeAnalysis(exchange, result);
  } catch (error) {
    console.error(error);
    updateBotBubble(loadingId, "翻译失败，请稍后重试。");
  }

  scrollToBottom();
});

// 新增一个气泡
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

// 更新 bot 气泡内容，并加入朗读 + 复制按钮
function updateBotBubble(id, japaneseText) {
  const bubble = chatContainer.querySelector(`.bubble[data-id="${id}"]`);
  if (!bubble) return;

  bubble.textContent = japaneseText;

  const tools = document.createElement("div");
  tools.className = "translation-tools";

  // 朗读按钮
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

// 模拟翻译 & 拆解函数：以后换成真实 API
async function fakeTranslateAndExplain(chineseText) {
  // 真实情况下：这里应该是 fetch 后端接口
  const japanese = `【假翻译】${chineseText} 的日文（以后接入真实 API）`;

  // 临时示例拆解
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

// 在当前对话组下渲染拆解
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

// 始终滚动到最底部
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
