import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const {
      sexo,
      idade,
      peso,
      altura,
      objetivo,
      alimentos,
      nivelAtividade,
    } = await req.json();

    const prompt = `
Você é uma IA especializada em NUTRIÇÃO com finalidade EDUCACIONAL.

Crie um PLANO ALIMENTAR SEMANAL em JSON PURO.

Formato obrigatório:

{
  "avaliacao": {
    "resumo": "",
    "observacao_legal": ""
  },
  "semana": {
    "segunda": {
      "cafe_da_manha": [
        { "alimento": "", "quantidade": "", "unidade": "" }
      ],
      "lanche_manha": [],
      "almoco": [],
      "lanche_tarde": [],
      "jantar": []
    }
  },
  "substituicoes": [],
  "recomendacoes": ""
}

Dados:
Sexo: ${sexo}
Idade: ${idade}
Peso: ${peso}
Altura: ${altura}
Objetivo: ${objetivo}
Alimentos disponíveis: ${alimentos}
Nível de atividade: ${nivelAtividade}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let texto = completion.choices[0].message.content || "";
    texto = texto.replace(/```json|```/g, "").trim();

    const planoAlimentar = JSON.parse(texto);

    return new Response(JSON.stringify(planoAlimentar), { status: 200 });
  } catch (error) {
    console.error("Erro plano alimentar:", error);
    return new Response(
      JSON.stringify({ erro: "Erro ao gerar plano alimentar" }),
      { status: 500 }
    );
  }
}
