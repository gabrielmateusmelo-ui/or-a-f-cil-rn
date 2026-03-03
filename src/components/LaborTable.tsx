import { LaborResult } from '@/lib/calcLabor';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCur(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  labor: LaborResult[];
}

export default function LaborTable({ labor }: Props) {
  const totalHH = labor.reduce((s, l) => s + l.hhTotal, 0);
  const totalCusto = labor.reduce((s, l) => s + l.custoTotal, 0);
  const totalHD = labor.reduce((s, l) => s + l.homemDia, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Função</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo HH</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">HH</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Homem-dia</th>
            <th className="py-2 px-2 text-xs font-semibold text-muted-foreground text-right">Custo Total</th>
          </tr>
        </thead>
        <tbody>
          {labor.filter(l => l.hhTotal > 0).map((l) => (
            <tr key={l.funcao} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-1.5 px-2 font-medium">{l.descricao}</td>
              <td className="py-1.5 px-2 text-right font-mono">{fmtCur(l.custoHH)}</td>
              <td className="py-1.5 px-2 text-right font-mono">{fmt(l.hhTotal)}</td>
              <td className="py-1.5 px-2 text-right font-mono">{fmt(l.homemDia)}</td>
              <td className="py-1.5 px-2 text-right font-mono font-semibold">{fmtCur(l.custoTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-semibold">
            <td className="py-2 px-2">Total</td>
            <td className="py-2 px-2"></td>
            <td className="py-2 px-2 text-right font-mono">{fmt(totalHH)}</td>
            <td className="py-2 px-2 text-right font-mono">{fmt(totalHD)}</td>
            <td className="py-2 px-2 text-right font-mono">{fmtCur(totalCusto)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
