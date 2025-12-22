import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { objetivo, nivel, dias, local } = await req.json();

    const prompt = `
Você é uma IA especializada em EDUCAÇÃO FÍSICA com finalidade EDUCACIONAL.

Crie um PLANO DE TREINO SEMANAL em JSON PURO.

Formato obrigatório:

{
  "descricao": "",
  "semana": {
    "segunda": [
      {
        "exercicio": "",
        "series": "",
        "repeticoes": "",
        "descanso": ""
      }
    ]
  },
  "observacoes": ""
}

Dados:
Objetivo: ${objetivo}
Nível: ${nivel}
Dias por semana: ${dias}
Local: ${local}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let texto = completion.choices[0].message.content || "";
    texto = texto.replace(/```json|```/g, "").trim();

    const planoTreino = JSON.parse(texto);

    return new Response(JSON.stringify(planoTreino), { status: 200 });
  } catch (error) {
    console.error("Erro plano treino:", error);
    return new Response(
      JSON.stringify({ erro: "Erro ao gerar plano de treino" }),
      { status: 500 }
    );
  }
}
