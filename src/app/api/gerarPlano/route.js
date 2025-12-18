import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      sexo,
      idade,
      peso,
      altura,
      objetivo,
      alimentos,
      nivelAtividade,
      nivel,
      dias,
      local,
    } = body;

    const prompt = `
Você é uma IA especializada em NUTRIÇÃO e EDUCAÇÃO FÍSICA (uso educacional).

Gere UM ÚNICO JSON válido contendo:
1) Plano alimentar semanal
2) Plano de treino semanal

FORMATO OBRIGATÓRIO (JSON PURO, SEM TEXTO EXTRA):

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
    },
    "terca": {},
    "quarta": {},
    "quinta": {},
    "sexta": {},
    "sabado": {},
    "domingo": {}
  },
  "substituicoes": ["texto"],
  "recomendacoes": "texto",
  "treino": {
    "descricao": "",
    "semana": {
      "segunda": [
        {
          "exercicio": "",
          "series": "",
          "repeticoes": "",
          "descanso": ""
        }
      ],
      "terca": [],
      "quarta": [],
      "quinta": [],
      "sexta": [],
      "sabado": [],
      "domingo": []
    }
  }
}

DADOS DO USUÁRIO:
Sexo: ${sexo}
Idade: ${idade}
Peso: ${peso}
Altura: ${altura}
Objetivo: ${objetivo}
Alimentos disponíveis: ${alimentos}
Nível de treino: ${nivel}
Dias de treino por semana: ${dias}
Local de treino: ${local}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let texto = completion.choices[0].message.content || "";
    texto = texto.replace(/```json|```/g, "").trim();

    const plano = JSON.parse(texto);

    return new Response(JSON.stringify(plano), { status: 200 });
  } catch (error) {
    console.error("❌ ERRO AO GERAR PLANO:", error);
    return new Response(
      JSON.stringify({ erro: "Falha ao gerar plano" }),
      { status: 500 }
    );
  }
}
