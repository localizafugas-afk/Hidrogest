exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const apiKey = body.apiKey;
    const imageData = body.imageData;
    const mediaType = body.mediaType || 'image/jpeg';

    if (!apiKey || !imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'apiKey e imageData sao obrigatorios' }) };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: 'Extrai dados desta fatura. Responde APENAS JSON sem markdown: {"fornecedor":"","nif":"","total":"","iva":"23","data":"","descricao":"","confianca":"alta"} Regras: total=numero decimal com IVA, iva=23/13/6/0, data=YYYY-MM-DD, confianca=alta/media/baixa. Vazio se nao visivel.' }
        ]}]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: errText }) };
    }

    const data = await response.json();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: err.message }) };
  }
};
