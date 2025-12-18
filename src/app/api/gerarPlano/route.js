import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
function calcularBMR(sexo, peso, altura, idade) {
  if (sexo.toLowerCase() === "masculino") {
    return 10 * peso + 6.25 * altura - 5 * idade + 5;
  }
  return 10 * peso + 6.25 * altura - 5 * idade - 161;
}

function calcularTDEE(bmr, nivelAtividade) {
  const fatores = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    alto: 1.725,
  };
  return bmr * (fatores[nivelAtividade] || 1.55);
}

function ajustarCalorias(tdee, objetivo) {
  if (objetivo === "emagrecimento") return tdee * 0.8;
  if (objetivo === "hipertrofia") return tdee * 1.15;
  return tdee;
}

export async function POST(req) {
  try {
    const body = await req.json();
    //const { sexo, idade, peso, altura, objetivo, alimentos } = body;
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
    local
  } = body;

  const bmr = calcularBMR(sexo, peso, altura, idade);
  const tdee = calcularTDEE(bmr, nivelAtividade);
  const calorias = ajustarCalorias(tdee, objetivo);

    const prompt = `
      Você é uma inteligência artificial especializada em NUTRIÇÃO e EDUCAÇÃO FÍSICA
      com finalidade EDUCACIONAL. 
      Você NÃO realiza diagnósticos clínicos nem prescrições médicas.
      Utilize linguagem simples, clara e profissional, com alimentos comuns no Brasil.

      Crie um PLANO SEMANAL PERSONALIZADO com base nos dados abaixo.

      DADOS DO USUÁRIO
      Sexo: ${sexo}
      Idade: ${idade} anos
      Peso: ${peso} kg
      Altura: ${altura} cm
      Objetivo: ${objetivo}

      ALIMENTAÇÃO
      - Usar somente os alimentos listados
      - 5 refeições por dia:
        café_da_manha, lanche_manha, almoco, lanche_tarde, jantar
      - Informar quantidades aproximadas
      - Unidades permitidas: g, ml ou unidade

      ALIMENTOS DISPONÍVEIS
      ${alimentos}

      REGRAS IMPORTANTES
      - Não utilizar termos clínicos
      - Não prometer resultados
      - Não mencionar doenças
      - Plano com caráter educativo
      - Manter equilíbrio alimentar
      - Linguagem acessível ao público geral

      FORMATO OBRIGATÓRIO DE RESPOSTA (JSON PURO, SEM TEXTO EXTRA)

      {
        "avaliacao": {
          "resumo": "Resumo simples da estratégia do plano",
          "observacao_legal": "Este plano é gerado automaticamente com fins educativos e não substitui acompanhamento profissional."
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
        "substituicoes": [
          "Sugestão simples de substituição alimentar"
        ],
        "recomendacoes": "Texto com orientações gerais sobre hidratação, rotina e constância"
      }
      `;
      const promptTreino = `
        Você é uma inteligência artificial especializada em EDUCAÇÃO FÍSICA
        com finalidade EDUCACIONAL.
        Você NÃO realiza diagnósticos, nem prescrições clínicas.
        Use linguagem simples, clara e segura.

        Crie um PLANO DE TREINO SEMANAL com base nos dados abaixo.

        DADOS DO USUÁRIO
        Objetivo: ${objetivo}
        Nível: ${nivel}
        Dias de treino por semana: ${dias}
        Local de treino: ${local}

        REGRAS
        - Linguagem simples
        - Exercícios comuns no Brasil
        - Evitar exercícios muito técnicos para iniciantes
        - Sempre incluir aquecimento
        - Incluir descanso adequado
        - Não prometer resultados

        FORMATO OBRIGATÓRIO DE RESPOSTA (JSON PURO)

        {
          "descricao": "Resumo simples da estratégia do treino",
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
          },
          "observacoes": "Texto com orientações de segurança, postura e descanso"
        }
        `;


    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-instant",
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
