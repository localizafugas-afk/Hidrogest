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
          { type: 'text', text: 'Analisa esta fatura ou recibo portugues. Responde APENAS JSON puro sem markdown:\n{"fornecedor":"","nif":"","total":"","iva":"23","data":"","descricao":"","confianca":"alta"}\nREGRAS IMPORTANTES:\n- fornecedor: nome da empresa que emitiu a fatura\n- nif: numero de identificacao fiscal portugues com EXATAMENTE 9 digitos numericos (ex: 123456789). Procura por "NIF", "NIPC", "Contribuinte", "NIF/NIPC". Se encontrares um numero com 9 digitos que comece por 1,2,3,5,6,7,8,9 e o NIF. Nao incluas espacos nem pontos.\n- total: valor TOTAL a pagar com IVA incluido, apenas numeros e ponto decimal (ex: 45.50)\n- iva: taxa de IVA em percentagem: 23 ou 13 ou 6 ou 0\n- data: data da fatura em formato YYYY-MM-DD\n- descricao: breve descricao do que foi comprado\n- confianca: alta/media/baixa\nDeixa campo vazio string se nao conseguires ler.' }
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
      headers: { 'Content-Type': 'application/json', 'Access-Con
