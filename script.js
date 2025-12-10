const chatContainer = document.getElementById("chat-container");
const form = document.getElementById("input-form");
const userInput = document.getElementById("user-input");
const analysisContent = document.getElementById("analysis-content");

// 监听表单提交
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // 显示用户气泡
  addMessageBubble(text, "user");

  // 清空输入框
  userInput.value = "";

  // “翻译中……”占位
  const loadingId = addMessageBubble("翻译中，请稍候…", "bot");

  try {
    // TODO: 这里以后换成真实的 API 调用
    const result = await fakeTranslateAndExplain(text);

    // 更新 bot 气泡内容
    updateBotBubble(loadingId, result.japanese);

    // 更新解析区
    renderAnalysis(result);
  } catch (error) {
    console.error(error);
    updateBotBubble(loadingId, "翻译失败，请稍后重试。");
  }

  scrollToBottom();
});

// 添加气泡
function addMessageBubble(text, role) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  // 如果是 bot 的消息，将来会在这里插入按钮
  if (role === "bot") {
    // 给一个 id 用于后续更新
    const id = `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    bubble.dataset.id = id;
    row.appendChild(bubble);
    chatContainer.appendChild(row);
    return id;
  }

  row.appendChild(bubble);
  chatContainer.appendChild(row);
  return null;
}

// 更新 bot 气泡：文字 + 工具按钮（🔊 + 复制）
function updateBotBubble(id, japaneseText) {
  const bubble = chatContainer.querySelector(`.bubble[data-id="${id}"]`);
  if (!bubble) return;

  bubble.textContent = japaneseText;

  const tools = document.createElement("div");
  tools.className = "translation-tools";

  // 播放按钮
  const speakBtn = document.createElement("button");
  speakBtn.className = "tool-button";
  speakBtn.textContent = "🔊 朗读";
  speakBtn.addEventListener("click", () => {
    speakJapanese(japaneseText);
  });

  // 复制按钮（辅助手机长按 / 电脑右键）
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
  // 这里真实情况下应该是：
  // const response = await fetch("/api/translate", { ... })
  // return await response.json();

  // 现在先用非常简单的“假翻译”和“假拆解”
  const japanese = `【假翻译】${chineseText} 的日文（以后接入真实 API）`;

  // 假装拆成几个词
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

// 渲染解析区域
function renderAnalysis(result) {
  analysisContent.innerHTML = "";

  result.words.forEach((w) => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.innerHTML = `
      <strong>${w.jp}</strong>（${w.romaji}）  
      · 意思：${w.meaning}  
      · 语法：${w.grammar}
    `;
    analysisContent.appendChild(div);
  });

  const g = document.createElement("p");
  g.textContent = result.grammarSummary;
  analysisContent.appendChild(g);
}

// 滚动到底部
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
