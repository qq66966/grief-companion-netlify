// Netlify Function — MiMo 多模态音频理解（语音转文字）
// 将浏览器录音直接发给 MiMo V2.5 / V2-Omni，模型听懂语音并返回转写文字
const MIMO_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { audio } = JSON.parse(event.body);
    // audio 已经是完整 data URL 格式: data:audio/webm;base64,AAAA...

    const response = await fetch(MIMO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.MIMO_API_KEY || "",
      },
      body: JSON.stringify({
        model: "mimo-v2.5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: { data: audio },
              },
              {
                type: "text",
                text: "请将这段音频逐字转写为中文文字。只输出转写结果，不要添加任何分析、解释或额外内容。",
              },
            ],
          },
        ],
        max_completion_tokens: 1024,
      }),
    });

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    // mimo-v2.5 是推理模型，转写结果可能在 reasoning_content 或 content
    const text = message?.content || message?.reasoning_content || "";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ text: text.trim() }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "语音理解代理失败", detail: error.message }),
    };
  }
};
