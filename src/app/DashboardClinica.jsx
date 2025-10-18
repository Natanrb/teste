"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import { NotoSans_Condensed_Regular_normal } from "@/app/NotoSans_Condensed-Regular-normal";

export default function DashboardClinica() {
  const [dados, setDados] = useState({
    data: "",
    nascimento: "",
    sexo: "feminino",
    peso: "",
    altura: "",
    cintura: "",
    quadril: "",
    objetivo: "emagrecer",
    habitos: {
      alimentacao: false,
      agua: false,
      sono: false,
      atividade: false,
      estresse: false,
      alcool: false,
      tabaco: false,
    },
  });

  const [resultados, setResultados] = useState({
    idade: 0,
    imc: 0,
    metabolismo: 0,
    calorias: 0,
    proteina: 0,
    gordura: 0,
    carboidrato: 0,
    aguaIdeal: 0,
    gorduraCorporal: 0,
    massaMuscular: 0,
  });

  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    const armazenados = localStorage.getItem("consultasClinica");
    if (armazenados) setHistorico(JSON.parse(armazenados));
  }, []);

  const calcularResultados = () => {
    const { peso, altura, nascimento, sexo, objetivo } = dados;
    if (!peso || !altura || !nascimento) return;

    const alturaM = altura / 100;
    const imc = peso / (alturaM * alturaM);
    const idade = new Date().getFullYear() - new Date(nascimento).getFullYear();

    const tmb =
      sexo === "masculino"
        ? 88.36 + 13.4 * peso + 4.8 * altura - 5.7 * idade
        : 447.6 + 9.2 * peso + 3.1 * altura - 4.3 * idade;

    // Calorias de manutenção
    let calorias = tmb * 1.55;
    if (objetivo === "emagrecer") calorias *= 0.85;
    else if (objetivo === "ganhar") calorias *= 1.15;
    else if (objetivo === "ambos") calorias *= 1.0;

    // Macros
    const proteina = peso * 2;
    const gordura = peso * 0.8;
    const caloriasProteina = proteina * 4;
    const caloriasGordura = gordura * 9;
    const caloriasRestantes = calorias - (caloriasProteina + caloriasGordura);
    const carboidrato = caloriasRestantes / 4;

    // Água
    const aguaIdeal = peso * 0.035;

    // Gordura corporal estimada
    const gorduraCorporal =
      1.2 * imc + 0.23 * idade - 10.8 * (sexo === "masculino" ? 1 : 0) - 5.4;
    const massaMuscular = Math.max(0, 100 - gorduraCorporal - 15);

    setResultados({
      idade,
      imc: imc.toFixed(1),
      metabolismo: Math.round(tmb),
      calorias: Math.round(calorias),
      proteina: Math.round(proteina),
      gordura: Math.round(gordura),
      carboidrato: Math.round(carboidrato),
      aguaIdeal: aguaIdeal.toFixed(2),
      gorduraCorporal: gorduraCorporal.toFixed(1),
      massaMuscular: massaMuscular.toFixed(1),
    });
  };

  useEffect(() => {
    calcularResultados();
  }, [dados]);

  const salvarConsulta = () => {
    const nova = { ...dados, ...resultados };
    const novoHistorico = [...historico, nova];
    setHistorico(novoHistorico);
    localStorage.setItem("consultasClinica", JSON.stringify(novoHistorico));
    alert("Consulta salva com sucesso!");
  };

  const gerarPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatorio de Avaliacao e Plano Alimentar Personalizado", 10, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Data da consulta: ${dados.data || "Nao informada"}`, 10, 25);

  // Dados pessoais
  doc.text("Dados Pessoais:", 10, 35);
  doc.text(`Sexo: ${dados.sexo}`, 10, 43);
  doc.text(`Idade: ${resultados.idade} anos`, 60, 43);
  doc.text(`Peso: ${dados.peso} kg`, 10, 51);
  doc.text(`Altura: ${dados.altura} cm`, 60, 51);
  doc.text(`Cintura: ${dados.cintura} cm`, 10, 59);
  doc.text(`Quadril: ${dados.quadril} cm`, 60, 59);

  // Resultados
  doc.text("Resultados Corporais:", 10, 70);
  let y = 78;
  const resultadosList = [
    ["IMC", resultados.imc],
    ["Metabolismo Basal (kcal)", resultados.metabolismo],
    ["Calorias Diarias Recomendadas", resultados.calorias],
    ["Gordura Corporal (%)", resultados.gorduraCorporal],
    ["Massa Muscular (%)", resultados.massaMuscular],
    ["Ingestao de Agua (L/dia)", resultados.aguaIdeal],
  ];
  resultadosList.forEach(([campo, valor]) => {
    doc.text(`${campo}: ${valor}`, 10, y);
    y += 6;
  });

  // Macronutrientes
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Macronutrientes Diarios:", 10, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Proteina: ${resultados.proteina} g`, 10, y);
  doc.text(`Gordura: ${resultados.gordura} g`, 70, y);
  doc.text(`Carboidratos: ${resultados.carboidrato} g`, 130, y);

  // ------------------------------------------
  // Ajuste conforme o objetivo
  // ------------------------------------------
  const fatorObjetivo = {
    emagrecer: 0.85,
    ganhar: 1.2,
    ambos: 1.0,
    manter: 1.0,
  }[dados.objetivo] || 1.0;

  // ------------------------------------------
  // PLANO ALIMENTAR DIÁRIO COM UNIDADES CORRETAS
  // ------------------------------------------
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Plano Alimentar Diario (quantidades ajustadas)", 10, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Definição base com unidades específicas
  const planoBase = {
    "Café da manhã": [
      ["Ovos mexidos", 100, "g"],
      ["Pão integral", 40, "g"],
      ["Café sem açucar", 200, "ml"],
      ["Aveia em flocos", 20, "g"],
    ],
    "Lanche da manhã": [
      ["Iogurte natural desnatado", 170, "ml"],
      ["Banana prata", 80, "g"],
    ],
    "Almoço": [
      ["Arroz integral", 100, "g"],
      ["Feijão carioca", 80, "g"],
      ["Peito de frango grelhado", 120, "g"],
      ["Legumes cozidos", 100, "g"],
      ["Salada verde com azeite", 50, "g"],
    ],
    "Lanche da tarde": [
      ["Castanha-do-pará", 10, "g"],
      ["Maçã", 130, "g"],
    ],
    "Jantar": [
      ["Peixe grelhado", 120, "g"],
      ["Purê de batata doce", 100, "g"],
      ["Brócolis no vapor", 100, "g"],
    ],
  };

  // Função de ajuste da quantidade
  const ajustarQtd = (valor) => Math.round(valor * fatorObjetivo);

  // Renderização
  Object.entries(planoBase).forEach(([refeicao, alimentos]) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(refeicao + ":", 10, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    alimentos.forEach(([item, qtd, unidade]) => {
      const ajustado = ajustarQtd(qtd);
      doc.text(`- ${item}: ${ajustado} ${unidade}`, 15, y, { maxWidth: 180 });
      y += 5;
    });
    y += 4;
  });

  // ------------------------------------------
  // TABELA DE SUBSTITUICOES
  // ------------------------------------------
  y += 8;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Tabela de Substituicoes Alimentares", 10, y);
  y += 10;

  const tabelaSubs = [
    ["Proteinas", "Frango grelhado", "Peixe, ovos, tofu, carne magra"],
    ["Carboidratos", "Arroz integral", "Batata doce, mandioca, quinoa, cuscuz"],
    ["Laticinios", "Iogurte natural", "Queijo branco, leite desnatado, kefir"],
    ["Frutas", "Banana", "Maçã, pera, mamão, melão"],
    ["Gorduras boas", "Azeite de oliva", "Abacate, castanhas, amêndoas"],
    ["Vegetais", "Brócolis", "Couve-flor, espinafre, abobrinha"],
  ];

  doc.setFontSize(10);
  doc.text("Grupo", 10, y);
  doc.text("Alimento Base", 60, y);
  doc.text("Substituicoes", 120, y);
  y += 5;
  doc.line(10, y, 200, y);
  y += 6;

  tabelaSubs.forEach(([grupo, base, subs]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(grupo, 10, y);
    doc.text(base, 60, y);
    doc.text(subs, 120, y, { maxWidth: 80 });
    y += 6;
  });

  // ------------------------------------------
  // RECOMENDAÇÕES GERAIS
  // ------------------------------------------
  y += 10;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Recomendacoes Gerais:", 10, y);
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);

  let recomendacao = "";
  switch (dados.objetivo) {
    case "emagrecer":
      recomendacao =
        "Reducao de 15% das calorias diarias. Priorizar proteinas magras, fibras e boa hidratacao.";
      break;
    case "ganhar":
      recomendacao =
        "Aumento de 20% das calorias, com foco em carboidratos complexos e boa ingestao proteica.";
      break;
    case "ambos":
      recomendacao =
        "Equilibrar ingestao calórica, mantendo alto teor proteico e treinos de forca.";
      break;
    default:
      recomendacao =
        "Manter alimentacao equilibrada, sono adequado e boa ingestao de agua.";
  }

  doc.text(recomendacao, 10, y, { maxWidth: 180 });

  // Salvar PDF
  const nomeArquivo = `Plano_Alimentar_${dados.data || "consulta"}.pdf`;
  doc.save(nomeArquivo);
};



  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      <h1 className="text-3xl font-bold text-center text-blue-700">
        🏥 Dashboard Clínico - Avaliação e Nutrição
      </h1>

      {/* Formulário */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-gray-700">
            📋 Dados do Paciente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                Data da consulta
                </label>
                <Input
                type="date"
                value={dados.data}
                onChange={(e) => setDados({ ...dados, data: e.target.value })}
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                Data de nascimento
                </label>
                <Input
                type="date"
                value={dados.nascimento}
                onChange={(e) =>
                    setDados({ ...dados, nascimento: e.target.value })
                }
                />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Peso Atual
                </label>
            <Input
              type="number"
              placeholder="Peso (kg)"
              value={dados.peso || ""}
              onChange={(e) => {
                const val = e.target.value;
                setDados({ ...dados, peso: val ? parseFloat(val) : "" });
              }}
            />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Altura
                </label>
            <Input
              type="number"
              placeholder="Altura (cm)"
              value={dados.altura || ""}
              onChange={(e) => {
                const val = e.target.value;
                setDados({ ...dados, altura: val ? parseFloat(val) : "" });
              }}
            />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Medida da cintura
                </label>
            <Input
              type="number"
              placeholder="Cintura (cm)"
              value={dados.cintura || ""}
              onChange={(e) => {
                const val = e.target.value;
                setDados({ ...dados, cintura: val ? parseFloat(val) : "" });
              }}
            />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Medida do quadril
                </label>
            <Input
              type="number"
              placeholder="Quadril (cm)"
              value={dados.quadril || ""}
              onChange={(e) => {
                const val = e.target.value;
                setDados({ ...dados, quadril: val ? parseFloat(val) : "" });
              }}
            />
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Sexo
                </label>
            <select
              className="border p-2 rounded-lg"
              value={dados.sexo}
              onChange={(e) => setDados({ ...dados, sexo: e.target.value })}
            >
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
            </select>
            </div>
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
               Objetivo
                </label>
            <select
              className="border p-2 rounded-lg"
              value={dados.objetivo}
              onChange={(e) => setDados({ ...dados, objetivo: e.target.value })}
            >
              <option value="emagrecer">Emagrecer</option>
              <option value="ganhar">Ganhar massa muscular</option>
              <option value="ambos">Perder gordura e ganhar massa</option>
              <option value="manter">Manutenção</option>
            </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados calculados */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            📊 Resultados Calculados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <p>
              IMC: <b>{resultados.imc}</b>
            </p>
            <p>
              Metabolismo: <b>{resultados.metabolismo} kcal</b>
            </p>
            <p>
              Calorias diárias: <b>{resultados.calorias} kcal</b>
            </p>
            <p>
              Proteína: <b>{resultados.proteina} g</b>
            </p>
            <p>
              Gordura: <b>{resultados.gordura} g</b>
            </p>
            <p>
              Carboidratos: <b>{resultados.carboidrato} g</b>
            </p>
            <p>
              Água ideal: <b>{resultados.aguaIdeal} L</b>
            </p>
            <p>
              Gordura corporal: <b>{resultados.gorduraCorporal}%</b>
            </p>
            <p>
              Massa muscular: <b>{resultados.massaMuscular}%</b>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={salvarConsulta} className="px-6 py-3 text-lg">
          💾 Salvar Consulta
        </Button>
        <Button
          onClick={gerarPDF}
          variant="outline"
          className="px-6 py-3 text-lg"
        >
          🧾 Gerar PDF do Plano Alimentar
        </Button>
      </div>
    </div>
  );
}
