"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";

export default function DashboardClinica() {
  const [dados, setDados] = useState({
    sexo: "",
    idade: "",
    peso: "",
    altura: "",
    objetivo: "",
    alimentos: "",
    nivelAtividade: "",
    nivel: "",
    dias: "",
    local: "",
  });

  const formularioValido =
    dados.sexo &&
    dados.idade &&
    dados.peso &&
    dados.altura &&
    dados.objetivo &&
    dados.nivelAtividade &&
    dados.dias &&
    dados.local;

  const [plano, setPlano] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [analisando, setAnalisando] = useState(false);

const gerarAnalise = async () => {
  try {
    setAnalisando(true);

    const res = await fetch("/api/gerar-planos/analise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!res.ok) throw new Error("Erro na análise");

    const data = await res.json();
    setAnalise(data);
  } catch (err) {
    console.error("Erro ao gerar análise:", err);
    alert("Erro ao gerar análise");
  } finally {
    setAnalisando(false);
  }
};


const gerarPlanoIA = async () => {
  try {
    setGerando(true);

    // 1️⃣ Plano alimentar
    const resAlimentar = await fetch("/api/gerar-planos/plano-alimentar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!resAlimentar.ok) throw new Error("Erro no plano alimentar");

    const planoAlimentar = await resAlimentar.json();

    // 2️⃣ Plano de treino
    const resTreino = await fetch("/api/gerar-planos/plano-treino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!resTreino.ok) throw new Error("Erro no plano de treino");

    const planoTreino = await resTreino.json();

    // 3️⃣ Unifica no frontend (SEM mudar PDF)
    setPlano({
      ...planoAlimentar,
      treino: planoTreino,
    });

  } catch (error) {
    console.error("Erro ao gerar planos:", error);
    alert("Erro ao gerar o plano. Tente novamente.");
  } finally {
    setGerando(false);
  }
};




  const gerarPDF = () => {
  if (!plano || !plano.semana) {
    alert("Plano inválido. Gere o plano novamente.");
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text("Plano Alimentar Semanal", 20, y);
  y += 10;

  Object.entries(plano.semana).forEach(([dia, refeicoes]) => {
    doc.setFontSize(13);
    doc.text(dia.toUpperCase(), 20, y);
    y += 6;

    Object.entries(refeicoes || {}).forEach(([refeicao, itens]) => {
      doc.setFontSize(11);
      doc.text(refeicao.replace("_", " "), 22, y);
      y += 5;

      if (Array.isArray(itens)) {
        itens.forEach((item) => {
          doc.text(
            `- ${item.alimento || "N/D"}: ${item.quantidade || ""} ${item.unidade || ""}`,
            25,
            y
          );
          y += 5;
        });
      }
    });

    y += 4;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  });

  // TREINO
  if (plano.treino && plano.treino.semana) {
    doc.addPage();
    y = 20;

    doc.setFontSize(16);
    doc.text("Plano de Treino Semanal", 20, y);
    y += 10;

    Object.entries(plano.treino.semana).forEach(([dia, exercicios]) => {
      if (!Array.isArray(exercicios) || exercicios.length === 0) return;

      doc.setFontSize(13);
      doc.text(dia.toUpperCase(), 20, y);
      y += 6;

      doc.setFontSize(11);
      exercicios.forEach((ex) => {
        doc.text(
          `• ${ex.exercicio} — ${ex.series}x${ex.repeticoes} (${ex.descanso})`,
          22,
          y
        );
        y += 5;
      });

      y += 5;
    });
  }

  doc.save("plano_semanal.pdf");
};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Gerador de Plano Alimentar Semanal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select
          className="border rounded px-3 py-2"
          value={dados.sexo}
          onChange={(e) => setDados({ ...dados, sexo: e.target.value })}
        >
          <option value="">Sexo</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
        </select>

        <Input
          placeholder="Idade"
          type="number"
          value={dados.idade}
          onChange={(e) => setDados({ ...dados, idade: e.target.value })}
        />
        <Input
          placeholder="Peso (kg)"
          type="number"
          value={dados.peso}
          onChange={(e) => setDados({ ...dados, peso: e.target.value })}
        />
        <Input
          placeholder="Altura (cm)"
          type="number"
          value={dados.altura}
          onChange={(e) => setDados({ ...dados, altura: e.target.value })}
        />

        <select
          className="border rounded px-3 py-2"
          value={dados.objetivo}
          onChange={(e) => setDados({ ...dados, objetivo: e.target.value })}
        >
          <option value="">Objetivo</option>
          <option value="emagrecimento">Emagrecimento</option>
          <option value="hipertrofia">Hipertrofia</option>
          <option value="manutencao">Manutenção</option>
        </select>

        <Input
          placeholder="Alimentos disponíveis"
          value={dados.alimentos}
          onChange={(e) => setDados({ ...dados, alimentos: e.target.value })}
        />

        <select
          className="border rounded px-3 py-2"
          value={dados.nivelAtividade}
          onChange={(e) =>
            setDados({ ...dados, nivelAtividade: e.target.value })
          }
        >
          <option value="">Nível de atividade</option>
          <option value="sedentario">Sedentário</option>
          <option value="leve">Leve</option>
          <option value="moderado">Moderado</option>
          <option value="alto">Alto</option>
        </select>

        <select
          className="border rounded px-3 py-2"
          value={dados.nivel}
          onChange={(e) => setDados({ ...dados, nivel: e.target.value })}
        >
          <option value="">Nível de treino</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>

        <Input
          placeholder="Dias de treino por semana"
          type="number"
          value={dados.dias}
          onChange={(e) => setDados({ ...dados, dias: e.target.value })}
        />

        <select
          className="border rounded px-3 py-2"
          value={dados.local}
          onChange={(e) => setDados({ ...dados, local: e.target.value })}
        >
          <option value="">Local de treino</option>
          <option value="casa">Casa</option>
          <option value="academia">Academia</option>
        </select>
      </div>

{analise?.metabolismo && (
  <div className="border rounded p-4 mt-4 text-sm space-y-2">
    <h2 className="font-semibold text-lg">Análise do Perfil</h2>

    <p>
      <strong>Taxa Metabólica Basal:</strong>{" "}
      {analise.metabolismo.bmr} kcal
    </p>


    <p>
      <strong>Gasto Diário Estimado:</strong>{" "}
      {analise.metabolismo.gastoDiarioEstimado} kcal
    </p>

    <p>
      <strong>Gordura Corporal (estimativa):</strong>{" "}
      {analise.composicaoCorporal.gorduraCorporalEstimativa}
    </p>

    <p className="text-gray-500">
      {analise.composicaoCorporal.observacao}
    </p>

    <p>
      <strong>Recomendação de treino:</strong>{" "}
      {analise.analiseGeral.recomendacao}
    </p>

    <p className="text-green-600 font-medium">
      {analise.proximoPasso}
    </p>
  </div>
)}
<Button onClick={gerarAnalise} disabled={!formularioValido || analisando}>
  {analisando ? "Analisando..." : "Analisar Perfil"}
</Button>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500 text-center">
          O plano será gerado automaticamente com base nas informações fornecidas.
        </p>

        <Button onClick={gerarPlanoIA} disabled={!analise || !formularioValido || gerando}>
          {gerando ? "Gerando plano..." : "Gerar Plano Semanal"}
        </Button>

        {plano && (
          <Button variant="outline" onClick={gerarPDF}>
            Baixar em PDF
          </Button>
        )}

        <p className="text-xs text-gray-400 text-center max-w-md">
          Este plano é gerado automaticamente com base nas informações fornecidas,
          com fins educacionais. Não substitui acompanhamento profissional.
        </p>
      </div>
    </div>
  );
}
