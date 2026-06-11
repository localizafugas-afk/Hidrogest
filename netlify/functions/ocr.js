// netlify/functions/ocr.js
// Lê uma fatura (imagem base64) e devolve os dados em JSON usando a API da Anthropic.
// O cliente envia { imageData, mediaType } e espera de volta a resposta da API (com .content).

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  // 1) Ler o corpo do pedido
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corpo do pedido inválido (não é JSON).' }) };
  }

  const imageData = body.imageData;
  const mediaType = body.mediaType || 'image/jpeg';

  if (!imageData) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Imagem em falta (imageData vazio).' }) };
  }

  // 2) Chave da API (definida nas variáveis de ambiente do Netlify)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada no Netlify.' }) };
  }

  // 3) Instrução para a IA
  const prompt = `És um assistente que lê faturas e recibos portugueses.
Extrai os dados desta fatura e responde APENAS com um objeto JSON válido, sem texto antes nem depois, com estes campos:
{"fornecedor":"nome da empresa","nif":"NIF do fornecedor com 9 dígitos","total":"valor total com IVA (número)","iva":"taxa de IVA principal: 23, 13, 6 ou 0","data":"data no formato AAAA-MM-DD","descricao":"breve descrição do que foi comprado"}
Se algum campo não existir, usa string vazia.`;

  // 4) Montar o pedido — a lista 'messages' TEM de ter pelo menos uma mensagem
  const payload = {
    model:'claude-sonnet-4-6' ,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
          { type: 'text', text: prompt }
        ]
      }
    ]
  };

  // 5) Chamar a API e devolver a resposta
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      const msg = (data && data.error && data.error.message) ? data.error.message : ('Erro da API: ' + resp.status);
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: msg }) };
    }

    // Devolve a resposta da API tal como está (o cliente lê data.content)
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Falha ao contactar a API: ' + (err.message || String(err)) }) };
  }
};
