'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export default function EstoquePage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [novoProduto, setNovoProduto] = useState({
    codigo: '',
    produto: '',
    'GTIN/EAN': '',
    Localizacao: '',
    Unidade: '',
    quantidade: 0,
  });
  const [editando, setEditando] = useState(null);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalPecas, setTotalPecas] = useState(0);

  // === BUSCAR PRODUTOS ===
  async function buscarProdutos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('estoque')
      .select('codigo, "GTIN/EAN", produto, "Localizacao", "Unidade", quantidade')
      .order('codigo', { ascending: true });

    if (error) {
      console.error('Erro ao buscar estoque:', error);
      setErro('Erro ao carregar os dados do estoque.');
    } else {
      setProdutos(data || []);
      calcularTotais(data || []);
      setErro('');
    }
    setLoading(false);
  }

  // === CALCULAR TOTAIS ===
  function calcularTotais(lista) {
    const totalItens = lista.length;
    const totalQtd = lista.reduce((sum, item) => sum + (item.quantidade || 0), 0);
    setTotalProdutos(totalItens);
    setTotalPecas(totalQtd);
  }

  // === ADICIONAR PRODUTO ===
  async function adicionarProduto() {
    if (!novoProduto.codigo) {
      alert('O código é obrigatório.');
      return;
    }

    const { error } = await supabase.from('estoque').insert([novoProduto]);

    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto.');
    } else {
      alert('Produto adicionado com sucesso!');
      setNovoProduto({
        codigo: '',
        produto: '',
        'GTIN/EAN': '',
        Localizacao: '',
        Unidade: '',
        quantidade: 0,
      });
      buscarProdutos();
    }
  }

  // === ATUALIZAR PRODUTO ===
  async function atualizarProduto() {
    const { error } = await supabase
      .from('estoque')
      .update(editando)
      .eq('codigo', editando.codigo);

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto.');
    } else {
      alert('Produto atualizado com sucesso!');
      setEditando(null);
      buscarProdutos();
    }
  }

  // === EXCLUIR PRODUTO ===
  async function excluirProduto(codigo) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('estoque').delete().eq('codigo', codigo);

    if (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto.');
    } else {
      alert('Produto excluído com sucesso!');
      buscarProdutos();
    }
  }

  // === PESQUISA DINÂMICA ===
  const produtosFiltrados = produtos.filter((p) => {
    const termo = filtro.toLowerCase();
    return (
      p.codigo?.toLowerCase().includes(termo) ||
      p.produto?.toLowerCase().includes(termo) ||
      p['GTIN/EAN']?.toLowerCase().includes(termo)
    );
  });

  // === AO CARREGAR ===
  useEffect(() => {
    buscarProdutos();
  }, []);

  // === VOLTAR AO DASHBOARD ===
  const voltarDashboard = () => router.push('/dashboard');

  return (
    <div className="p-6 text-white">
      {/* TOPO */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📦 Estoque</h1>
        <button
          onClick={voltarDashboard}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow"
        >
          ← Voltar ao Dashboard
        </button>
      </div>

      {/* === ESTATÍSTICAS === */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400 text-sm">Total de Produtos</p>
          <p className="text-xl font-semibold">{totalProdutos}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400 text-sm">Total de Peças</p>
          <p className="text-xl font-semibold">{totalPecas}</p>
        </div>
      </div>

      {/* === CAMPO DE PESQUISA === */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Pesquisar por código, nome ou GTIN/EAN..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
        />
      </div>

      {/* === TABELA === */}
      {loading ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p className="text-red-500">{erro}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-left text-red-300">
                <th className="border border-gray-700 px-4 py-2">Código</th>
                <th className="border border-gray-700 px-4 py-2">Produto</th>
                <th className="border border-gray-700 px-4 py-2">GTIN/EAN</th>
                <th className="border border-gray-700 px-4 py-2">Localização</th>
                <th className="border border-gray-700 px-4 py-2">Unidade</th>
                <th className="border border-gray-700 px-4 py-2">Quantidade</th>
                <th className="border border-gray-700 px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((p) => (
                  <tr key={p.codigo} className="hover:bg-gray-800">
                    <td className="border border-gray-700 px-4 py-2">{p.codigo}</td>
                    <td className="border border-gray-700 px-4 py-2">{p.produto}</td>
                    <td className="border border-gray-700 px-4 py-2">{p['GTIN/EAN']}</td>
                    <td className="border border-gray-700 px-4 py-2">{p.Localizacao}</td>
                    <td className="border border-gray-700 px-4 py-2">{p.Unidade}</td>
                    <td className="border border-gray-700 px-4 py-2">{p.quantidade}</td>
                    <td className="border border-gray-700 px-4 py-2 space-x-2">
                      <button
                        onClick={() => setEditando(p)}
                        className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluirProduto(p.codigo)}
                        className="bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-400">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* === FORMULÁRIO DE ADIÇÃO === */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Adicionar Produto</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(novoProduto).map((key) => (
            <input
              key={key}
              type={key === 'quantidade' ? 'number' : 'text'}
              placeholder={key}
              value={novoProduto[key]}
              onChange={(e) => setNovoProduto({ ...novoProduto, [key]: e.target.value })}
              className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
            />
          ))}
        </div>
        <button
          onClick={adicionarProduto}
          className="mt-4 bg-green-600 px-4 py-2 rounded hover:bg-green-700"
        >
          Adicionar
        </button>
      </div>

      {/* === FORMULÁRIO DE EDIÇÃO === */}
      {editando && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Editar Produto</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(editando).map((key) =>
              key === 'codigo' ? (
                <input
                  key={key}
                  type="text"
                  value={editando[key]}
                  disabled
                  className="p-2 rounded bg-gray-800 border border-gray-700 text-gray-400"
                />
              ) : (
                <input
                  key={key}
                  type={key === 'quantidade' ? 'number' : 'text'}
                  placeholder={key}
                  value={editando[key]}
                  onChange={(e) => setEditando({ ...editando, [key]: e.target.value })}
                  className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
                />
              )
            )}
          </div>
          <div className="mt-4 space-x-2">
            <button
              onClick={atualizarProduto}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditando(null)}
              className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
