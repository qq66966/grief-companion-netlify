// Netlify Function — Dify Audio-to-Text 代理
const DIFY_URL = "https://api.dify.ai/v1/audio-to-text";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { audio, format } = JSON.parse(event.body);
    const buffer = Buffer.from(audio, "base64");
    const ext = format === "webm" ? "webm" : "wav";
    const mimeType = format === "webm" ? "audio/webm" : "audio/wav";

    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: mimeType }), `recording.${ext}`);
    formData.append("user", "grief-companion-user");

    const response = await fetch(DIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "语音识别失败", detail: error.message }),
    };
  }
};
