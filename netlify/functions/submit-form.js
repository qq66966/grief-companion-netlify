// Netlify Function — Google Forms 静默代理
// 接收前端表单数据，服务端提交到 Google Forms（绕过国内网络限制）

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const data = JSON.parse(event.body);

    const formData = new URLSearchParams();
    formData.append("entry.666380221", data.id || "");       // 参与者编号
    formData.append("entry.459836270", data.gender || "");   // 性别
    formData.append("entry.815929513", data.age || "");      // 年龄范围
    formData.append("entry.980200032", data.relation || ""); // 丧亲关系
    formData.append("entry.1223532793", data.time || "");    // 距离离世时间

    const GOOGLE_FORM_URL =
      "https://docs.google.com/forms/d/e/1FAIpQLSfC7o4d73bdfFrK8e8H7V28IcVbusu6YR3n3mf3bJFaLWc0kQ/formResponse";

    const response = await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "提交失败", detail: error.message }),
    };
  }
};
