import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================
// FUNÇÕES DE CÁLCULO
// ======================
function calcularBMR(sexo, peso, altura, idade) {
  if (sexo === "masculino") {
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

// Estimativa simples de gordura corporal (fórmula Deurenberg)
function estimarGorduraCorporal(imc, idade, sexo) {
  const sexoNum = sexo === "masculino" ? 1 : 0;
  return 1.2 * imc + 0.23 * idade - 10.8 * sexoNum - 5.4;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      sexo,
      idade,
      peso,
      altura,
      nivelAtividade,
      nivelTreino,
      objetivo,
    } = body;

    // ======================
    // CÁLCULOS
    // ======================
    const imc = peso / Math.pow(altura / 100, 2);
    const bmr = calcularBMR(sexo, peso, altura, idade);
    const tdee = calcularTDEE(bmr, nivelAtividade);
    const gorduraEstimada = estimarGorduraCorporal(imc, idade, sexo);

    // ======================
    // PROMPT DE ANÁLISE
    // ======================
    const prompt = `
Você é um especialista em EDUCAÇÃO FÍSICA e NUTRIÇÃO com foco EDUCACIONAL.
Não faça diagnósticos médicos nem prescrições clínicas.

Analise o estado atual do usuário com base nos dados abaixo
e gere um parecer claro, profissional e acessível.

DADOS
Sexo: ${sexo}
Idade: ${idade}
Peso: ${peso} kg
Altura: ${altura} cm
IMC: ${imc.toFixed(1)}
Gordura corporal estimada: ${gorduraEstimada.toFixed(1)}%
Taxa metabólica basal (BMR): ${Math.round(bmr)} kcal
Gasto calórico diário estimado (TDEE): ${Math.round(tdee)} kcal
Nível de atividade: ${nivelAtividade}
Nível de treino: ${nivelTreino}
Objetivo: ${objetivo}

FORMATO OBRIGATÓRIO (JSON PURO):

{
  "resumo_geral": "Resumo simples do estado atual",
  "avaliacao_corporal": {
    "imc": "",
    "gordura_estimada": "",
    "interpretacao": ""
  },
  "metabolismo": {
    "bmr": "",
    "tdee": "",
    "explicacao": ""
  },
  "nivel_treino": {
    "avaliacao": "",
    "cuidados": ""
  },
  "direcionamento": {
    "foco_principal": "",
    "prioridades": [
      ""
    ]
  },
  "observacao_legal": "Análise educativa, não substitui acompanhamento profissional."
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    let texto = completion.choices[0].message.content || "";
    texto = texto.replace(/```json|```/g, "").trim();

    const analiseIA = JSON.parse(texto);

    // ======================
    // RESPOSTA FINAL
    // ======================
    const respostaFinal = {
      dados_calculados: {
        imc: imc.toFixed(1),
        gordura_estimada: gorduraEstimada.toFixed(1),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      },
      analise: analiseIA,
    };

    return new Response(JSON.stringify(respostaFinal), { status: 200 });
  } catch (error) {
    console.error("❌ ERRO NA ANÁLISE:", error);
    return new Response(
      JSON.stringify({ erro: "Erro ao gerar análise corporal" }),
      { status: 500 }
    );
  }
}
