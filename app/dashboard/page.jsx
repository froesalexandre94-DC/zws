'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// importa o Plot apenas no client (evita self is not defined)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/vendas')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Erro ao carregar API:', err));
  }, []);

  if (!data) return <div className="p-4 text-gray-400">Carregando dados...</div>;

  const { top10Sold = [], baixoEstoque = [] } = data;

  // Totais e indicadores
  const totalVendido = top10Sold.reduce(
    (acc, item) => acc + (item.totalVendido || 0),
    0
  );
  const totalBaixoEstoque = baixoEstoque.length;
  const produtoMaisVendido = top10Sold[0]
    ? top10Sold[0].produto
    : '—';

  // Função de cor com base no nível de estoque
  const getColor = (qtd) => {
    if (qtd <= 20) return 'rgb(239,68,68)'; // vermelho
    if (qtd <= 49) return 'rgb(234,179,8)'; // amarelo
    return 'rgb(34,197,94)'; // verde
  };

  return (
    <main className="p-8 space-y-12">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">
        Dashboard de Vendas
      </h1>

      {/* 📊 Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total vendido */}
        <div className="bg-gray-900 rounded-lg p-6 shadow border border-gray-700">
          <p className="text-gray-400 text-sm uppercase">Total Vendido</p>
          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {totalVendido.toLocaleString('pt-BR')}
          </h2>
        </div>

        {/* Produtos com baixo estoque */}
        <div className="bg-gray-900 rounded-lg p-6 shadow border border-gray-700">
          <p className="text-gray-400 text-sm uppercase">
            Produtos com Baixo Estoque
          </p>
          <h2 className="text-3xl font-bold text-yellow-400 mt-2">
            {totalBaixoEstoque}
          </h2>
        </div>

        {/* Produto mais vendido */}
        <div className="bg-gray-900 rounded-lg p-6 shadow border border-gray-700">
          <p className="text-gray-400 text-sm uppercase">Produto Mais Vendido</p>
          <h2 className="text-xl font-semibold text-blue-400 mt-2">
            {produtoMaisVendido}
          </h2>
        </div>
      </div>

      {/* 🟢 Top 10 Mais Vendidos */}
      <div className="card bg-gray-900 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-green-400">
          Top 10 Mais Vendidos
        </h2>
        <Plot
          data={[
            {
              x: top10Sold.map((i) => i.totalVendido),
              y: top10Sold.map((i) => i.produto),
              type: 'bar',
              text: top10Sold.map(
                (i) =>
                  `${i.totalVendido} (${(
                    (i.totalVendido /
                      totalVendido) *
                    100
                  ).toFixed(1)}%)`
              ),
              textposition: 'auto',
              marker: { color: 'rgb(34,197,94)' },
            },
          ]}
          layout={{
            height: 400,
            margin: { t: 40, l: 50, r: 10, b: 80 },
            title: 'Mais Vendidos',
            plot_bgcolor: '#111827',
            paper_bgcolor: '#111827',
            font: { color: '#fff' },
            xaxis: { title: 'Unidades Vendidas' },
            yaxis: { automargin: true },
          }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>

      {/* 🔴 Produtos com Baixo Estoque */}
      <div className="card bg-gray-900 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-red-400">
          Produtos com Baixo Estoque (menos de 50)
        </h2>
        <Plot
          data={[
            {
              x: baixoEstoque.map((i) => i.produto),
              y: baixoEstoque.map((i) => i.quantidade),
              type: 'bar',
              text: baixoEstoque.map((i) => i.quantidade.toString()),
              textposition: 'auto',
              marker: {
                color: baixoEstoque.map((i) => getColor(i.quantidade)),
              },
              name: 'Quantidade atual',
            },
            {
              // Linha de limite mínimo (50)
              x: baixoEstoque.map((i) => i.produto),
              y: baixoEstoque.map(() => 50),
              type: 'scatter',
              mode: 'lines',
              line: { color: 'rgb(239,68,68)', dash: 'dash' },
              name: 'Limite mínimo (50)',
            },
          ]}
          layout={{
            height: 400,
            margin: { t: 40, l: 50, r: 10, b: 80 },
            title: 'Necessitam de Reposição',
            plot_bgcolor: '#111827',
            paper_bgcolor: '#111827',
            font: { color: '#fff' },
            xaxis: { automargin: true },
            yaxis: { title: 'Estoque Atual' },
            legend: { orientation: 'h', y: -0.2 },
          }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>
    </main>
  );
}
