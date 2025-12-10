import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 一个工具函数：让 OpenAI 同时返回“日文翻译 + 分词 + 语法解释”
async function translateAndExplain(chineseText) {
  const prompt = `
你是一个专业的日语老师，请针对下面的中文句子，输出如下结构的 JSON：

1. japanese：整体翻译成自然、地道的日语。
2. words：把日语句子拆成若干词或短语，每个词包含：
   - jp：日语写法
   - romaji：罗马音
   - meaning：中文意思（简明）
   - grammar：语法说明（词性、用法等）
3. grammarSummary：对整句语法结构做一个简短说明。

要求：
- 只输出 JSON，不要多余文字。
- JSON 结构示例：
{
  "japanese": "今日は日本へ行きます。",
  "words": [
    {
      "jp": "今日",
      "romaji": "きょう",
      "meaning": "今天",
      "grammar": "时间名词，表示今天"
    }
  ],
  "grammarSummary": "解释整句语法结构……"
}

下面是中文句子：
${chineseText}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert Japanese teacher and translator."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3
  });

  const content = response.choices[0].message.content;

  // 尝试解析为 JSON
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    const jsonText = content.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("解析 JSON 失败：", e, content);
    throw new Error("解析 AI 返回结果失败");
  }
}

// 对外暴露一个接口：/api/translate
app.post("/api/translate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "缺少 text 字段" });
    }

    const result = await translateAndExplain(text);
    res.json(result);
  } catch (error) {
    console.error("翻译接口出错：", error);
    res.status(500).json({ error: "翻译失败" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Japanese backend listening on port ${port}`);
});
