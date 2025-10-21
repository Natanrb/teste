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
  });

  const [plano, setPlano] = useState(null);
  const [gerando, setGerando] = useState(false);

  const gerarPlanoIA = async () => {
    try {
      setGerando(true);
      const res = await fetch("/api/gerarPlano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      setPlano(data);
      setGerando(false);
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
      setGerando(false);
    }
  };

  const gerarPDF = () => {
    //doc.setFont("helvetica", "normal");
    if (!plano) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    let y = 20;

    doc.setFontSize(16);
    doc.text("Plano Alimentar Semanal Personalizado", 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Sexo: ${dados.sexo}`, 20, y);
    y += 6;
    doc.text(`Idade: ${dados.idade} anos`, 20, y);
    y += 6;
    doc.text(`Peso: ${dados.peso} kg`, 20, y);
    y += 6;
    doc.text(`Altura: ${dados.altura} cm`, 20, y);
    y += 6;
    doc.text(`Objetivo: ${dados.objetivo}`, 20, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Cardápio Semanal", 20, y);
    y += 8;
    doc.setFontSize(12);

    Object.entries(plano.semana).forEach(([dia, refeicoes]) => {
      doc.setFontSize(13);
      doc.text(`${dia.toUpperCase()}`, 20, y);
      y += 6;
      doc.setFontSize(11);

      Object.entries(refeicoes).forEach(([refeicao, itens]) => {
        doc.text(`${refeicao.replace("_", " ")}:`, 22, y);
        y += 5;

        if (Array.isArray(itens)) {
          itens.forEach((item) => {
            const nome = item.alimento || "Item não especificado";
            const qtd = item.quantidade || "-";
            const unidade = item.unidade || "";
            doc.text(` - ${nome}: ${qtd} ${unidade}`, 25, y);
            y += 5;
          });
        } else {
          doc.text(" - (sem dados)", 25, y);
          y += 5;
        }

        y += 3;
      });

      y += 5;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    y += 5;
    doc.setFontSize(13);
    doc.text("Recomendações:", 20, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(
      plano.recomendacoes ||
        "Mantenha alimentação equilibrada e hidratação adequada.",
      20,
      y,
      { maxWidth: 170 }
    );

    // 🔁 Sugestões de Substituição (geradas pelo ChatGPT)
    if (plano.substituicoes && plano.substituicoes.length > 0) {
      y += 20;
      doc.setFontSize(13);
      doc.text("Sugestões de Substituição:", 20, y);
      y += 6;
      doc.setFontSize(11);
      if (
        Array.isArray(plano.substituicoes) &&
        plano.substituicoes.length > 0
      ) {
        plano.substituicoes.forEach((linha) => {
          doc.text(`- ${linha}`, 25, y);
          y += 5;
        });
      } else if (typeof plano.substituicoes === "string") {
        doc.text(plano.substituicoes, 25, y);
        y += 5;
      } else {
        doc.text("Nenhuma substituição fornecida pela IA.", 25, y);
        y += 5;
      }
    }

    doc.save("plano_alimentar_semanal.pdf");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Gerador de Plano Alimentar Semanal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Input
          placeholder="Sexo"
          value={dados.sexo}
          onChange={(e) => setDados({ ...dados, sexo: e.target.value })}
        />
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
        <Input
          placeholder="Objetivo"
          value={dados.objetivo}
          onChange={(e) => setDados({ ...dados, objetivo: e.target.value })}
        />
        <Input
          placeholder="Alimentos disponíveis"
          value={dados.alimentos}
          onChange={(e) => setDados({ ...dados, alimentos: e.target.value })}
        />
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={gerarPlanoIA} disabled={gerando}>
          {gerando ? "Gerando plano..." : "Gerar Plano Semanal"}
        </Button>
        {plano && <Button onClick={gerarPDF}>Baixar em PDF</Button>}
      </div>
    </div>
  );
}
