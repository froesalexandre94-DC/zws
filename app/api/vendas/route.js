// app/api/vendas/route.js
import { NextResponse } from "next/server";
;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Buscar vendas
    const { data: vendas = [], error: vendasError } = await supabase
      .from("vendas")
      .select("codigo, produto, quantidade");

    if (vendasError) throw vendasError;

    // Buscar estoque
    const { data: estoque = [], error: estoqueError } = await supabase
      .from("estoque")
      .select("codigo, produto, quantidade");

    if (estoqueError) throw estoqueError;

    // Agrupar vendas por código do produto (chave única)
    const vendasPorCodigo = vendas.reduce((acc, v) => {
      const key = v.codigo;
      acc[key] = (acc[key] || 0) + (v.quantidade ?? 0);
      return acc;
    }, {});

    // Combinar com estoque
    const produtosComDados = estoque.map((item) => ({
      codigo: item.codigo,
      produto: item.produto || item.codigo,
      quantidade: item.quantidade ?? 0,
      totalVendido: vendasPorCodigo[item.codigo] ?? 0,
    }));

    // Top 10 mais vendidos
    const top10Sold = [...produtosComDados]
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .slice(0, 10);

    // Produtos com baixo estoque (<50)
    const baixoEstoque = [...produtosComDados]
      .filter((p) => p.quantidade < 50)
      .sort((a, b) => a.quantidade - b.quantidade);

    return NextResponse.json({ top10Sold, baixoEstoque, produtosComDados });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar dados no Supabase",
        details: error?.message ?? String(error),
        top10Sold: [],
        baixoEstoque: [],
        produtosComDados: [],
      },
      { status: 500 }
    );
  }
}
