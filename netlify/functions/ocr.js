exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const imageData = body.imageData;
    const mediaType = body.mediaType || 'image/jpeg';

    if (!imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'imageData obrigatorio' }) };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'API key nao configurada' }) };
    }

    const prompt = 'Analisa esta fatura ou recibo. Responde APENAS JSON puro sem markdown: {"fornecedor":"","nif":"","total":"","iva":"23","data":"","descricao":"","confianca":"alta"} REGRAS: fornecedor=nome empresa emitente, nif=9 digitos numericos sem espacos (procura NIF/NIPC/Contribuinte), total=valor total com IVA em decimal (ex: 45.50), iva=percentagem 23 ou 13 ou 6 ou 0, data=YYYY-MM-DD, descricao=resumo do que foi comprado, confianca=alta/media/baixa. Campo vazio se nao visivel.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model: 'claude-haiku-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: prompt }
        ]}]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: errText })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
