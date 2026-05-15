// Netlify Function — Dify Audio-to-Text 代理
const DIFY_URL = "https://api.dify.ai/v1/audio-to-text";

function buildMultipart(fields) {
  const boundary = "----DifyAudio" + Math.random().toString(36).slice(2);
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    if (value.type === "file") {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${value.filename}"\r\nContent-Type: ${value.contentType}\r\n\r\n`
      );
      parts.push(Buffer.isBuffer(value.data) ? value.data : Buffer.from(value.data));
      parts.push("\r\n");
    } else {
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
    }
  }
  parts.push(`--${boundary}--`);
  const buffers = parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p, "utf-8")));
  const body = Buffer.concat(buffers);
  return { body, boundary };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { audio, format } = JSON.parse(event.body);
    const ext = format === "webm" ? "webm" : "wav";
    const mimeType = format === "webm" ? "audio/webm" : "audio/wav";

    const { body, boundary } = buildMultipart({
      file: {
        type: "file",
        filename: `recording.${ext}`,
        contentType: mimeType,
        data: Buffer.from(audio, "base64"),
      },
      user: "grief-companion-user",
    });

    const response = await fetch(DIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Dify 返回非JSON", detail: text.substring(0, 500) }),
      };
    }

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
      body: JSON.stringify({ error: "语音识别代理失败", detail: error.message }),
    };
  }
};
