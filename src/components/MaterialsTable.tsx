import { MaterialLine } from '@/lib/calcMaterials';
import { useMemo } from 'react';

interface Props {
  materials: MaterialLine[];
  search: string;
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MaterialsTable({ materials, search }: Props) {
  const filtered = useMemo(() => {
    if (!search) return materials;
    const q = search.toLowerCase();
    return materials.filter((m) => m.descricao.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q));
  }, [materials, search]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Material</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Categoria</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Quantidade</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Unidade</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => (
            <tr key={`${m.materialId}-${m.unidade}-${i}`} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-1.5 px-2">{m.descricao}</td>
              <td className="py-1.5 px-2">
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{m.categoria}</span>
              </td>
              <td className="py-1.5 px-2 text-right font-mono">{fmt(m.quantidade)}</td>
              <td className="py-1.5 px-2 text-muted-foreground">{m.unidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhum material encontrado.</p>
      )}
    </div>
  );
}
