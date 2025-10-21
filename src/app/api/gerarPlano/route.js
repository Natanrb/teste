import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { sexo, idade, peso, altura, objetivo, alimentos } = body;

    const prompt =
      "Você é um nutricionista clínico especializado em emagrecimento e recomposição corporal.\n" +
      "Monte um plano alimentar semanal completo (7 dias) com 5 refeições diárias: café da manhã, lanche da manhã, almoço, lanche da tarde e jantar.\n" +
      "Use somente os alimentos listados a seguir.\n\n" +
      `Dados do paciente:\n- Sexo: ${sexo}\n- Idade: ${idade}\n- Peso: ${peso} kg\n- Altura: ${altura} cm\n- Objetivo: ${objetivo}\n\n` +
      `Alimentos disponíveis: ${alimentos}\n\n` +
      "Requisitos de saída:\n" +
      "- Responder apenas com JSON válido (sem texto extra, sem markdown, sem blocos de código).\n" +
      '- Campos obrigatórios em cada item de refeição: "alimento", "quantidade", "unidade".\n' +
      'A unidade deve ser "g", "ml" ou "unidade".\n' +
      "Modelo exato de saída (exemplo de estrutura):\n" +
      "{\n" +
      '  "semana": {\n' +
      '    "segunda": {\n' +
      '      "cafe_da_manha": [\n' +
      '        { "alimento": "Aveia", "quantidade": "40", "unidade": "g" },\n' +
      '        { "alimento": "Iogurte", "quantidade": "200", "unidade": "ml" }\n' +
      "      ],\n" +
      '      "lanche_manha": [],\n' +
      '      "almoco": [],\n' +
      '      "lanche_tarde": [],\n' +
      '      "jantar": []\n' +
      "    },\n" +
      '    "terca": { },\n' +
      '    "quarta": { },\n' +
      '    "quinta": { },\n' +
      '    "sexta": { },\n' +
      '    "sabado": { },\n' +
      '    "domingo": { }\n' +
      "  },\n" +
      '  "recomendacoes": "Texto com orientações gerais"\n' +
      '  "substituicoes": "Texto com substtituições"\n' +
      "}\n";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let texto = completion.choices[0].message.content || "";
    texto = texto.replace(/^\s*```[a-zA-Z]*\s*|\s*```\s*$/g, "").trim();
    const match = texto.match(/\{[\s\S]*\}$/);
    const jsonStr = match ? match[0] : texto;
    const plano = JSON.parse(jsonStr);

    return new Response(JSON.stringify(plano), { status: 200 });
  } catch (error) {
    console.error("❌ ERRO AO GERAR PLANO:", error);
    return new Response(
      JSON.stringify({ erro: error.message || "Falha ao gerar plano" }),
      { status: 500 }
    );
  }
}
