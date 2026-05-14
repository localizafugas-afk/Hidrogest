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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: 'Analisa esta imagem de fatura ou recibo. Responde APENAS com JSON puro sem markdown ou texto extra:\n{"fornecedor":"","nif":"","total":"","iva":"23","data":"","descricao":"","confianca":"alta"}\nREGRAS: total=valor TOTAL a pagar com IVA incluido em formato numerico decimal (ex: 45.50), iva=taxa em percentagem apenas 23 ou 13 ou 6 ou 0, data=formato YYYY-MM-DD, fornecedor=nome empresa emitente, nif=numero fiscal do fornecedor (9 digitos), descricao=resumo breve do que foi comprado, confianca=alta se leste bem/media se alguma duvida/baixa se nao conseguiste ler. Campo vazio se nao visivel.' }
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
