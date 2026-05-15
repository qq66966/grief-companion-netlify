// Netlify Function — Dify 消息反馈代理（点赞/点踩）
const DIFY_BASE = "https://api.dify.ai/v1/messages";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { message_id, rating, user } = JSON.parse(event.body);
    if (!message_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "缺少 message_id" }) };
    }

    const body = { rating: rating || null, user: user || "anonymous", content: "" };

    const response = await fetch(`${DIFY_BASE}/${message_id}/feedbacks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      },
      body: JSON.stringify(body),
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
      body: JSON.stringify({ error: "反馈代理失败", detail: error.message }),
    };
  }
};
