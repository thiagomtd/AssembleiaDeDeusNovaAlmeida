import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, Eyebrow, Pill, fmtBRL } from '../components/ui';
import { IconShield, IconWallet, IconInfo, IconPlus, IconPaperclip } from '../components/icons';
import { MonthPicker } from '../components/MonthPicker';
import { AttachmentViewer } from '../components/AttachmentViewer';

interface Transacao {
  transactionId: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
  comprovanteUrl?: string | null;
}

export function Transacoes() {
  const { isAdmin, isTesouraria } = useAuth();
  const podeGerenciarFinancas = isAdmin || isTesouraria;
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [itens, setItens] = useState<Transacao[]>([]);
  const [saldoCaixa, setSaldoCaixa] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [comprovanteAberto, setComprovanteAberto] = useState<string | null>(null);

  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    api.get<{ saldoCaixa: number }>('/church-info').then((r) => setSaldoCaixa(r.saldoCaixa ?? 0)).catch(() => {});
  }, []);

  useEffect(() => {
    setCarregando(true);
    api
      .get<Transacao[]>(`/transactions?mes=${mesAno}`)
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, [mesAno]);

  const totais = useMemo(() => {
    const entradas = itens.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
    const saidas = itens.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [itens]);

  return (
    <section>
      <Eyebrow icon={<IconShield className="icon w-3 h-3" />}>Financeiro</Eyebrow>
      <h1 className="text-[27px] mb-1.5 text-ink">Entradas e Saídas</h1>
      <p className="text-inkSecondary text-[14.5px] max-w-[62ch] mb-6">
        Acompanhe os lançamentos financeiros do mês. Acesso de leitura para membros; a edição é exclusiva da
        administração.
      </p>

      <Card className="p-5 flex items-center justify-between gap-5 flex-wrap mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-accentSoft flex items-center justify-center flex-none">
            <IconWallet className="icon w-5 h-5 text-accentStrong" />
          </div>
          <div>
            <p className="text-[11.5px] uppercase tracking-wider text-muted mb-1">Saldo total em caixa</p>
            <div className="font-serif text-[28px] text-ink">
              {saldoCaixa === null ? '—' : fmtBRL(saldoCaixa)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3.5 mb-5">
        <Card className="p-4">
          <Eyebrow>Entradas no mês</Eyebrow>
          <div className="font-serif text-[23px] text-income">{fmtBRL(totais.entradas)}</div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Saídas no mês</Eyebrow>
          <div className="font-serif text-[23px] text-expense">{fmtBRL(totais.saidas)}</div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Saldo do mês</Eyebrow>
          <div className="font-serif text-[23px] text-ink">{fmtBRL(totais.saldo)}</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2.5 flex-wrap px-4.5 py-3.5 border-b border-border">
          <MonthPicker mes={mes} ano={ano} onChange={(m, a) => { setMes(m); setAno(a); }} />
          {podeGerenciarFinancas && (
            <Link to="/admin/lancamentos/novo">
              <span className="inline-flex items-center gap-1.5 bg-accent text-[#241703] text-[12.5px] font-semibold rounded-lg px-3 py-1.5">
                <IconPlus className="icon w-3.5 h-3.5" /> Novo lançamento
              </span>
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px] border-collapse">
            <thead>
              <tr>
                {['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Comprovante'].map((h) => (
                  <th
                    key={h}
                    className={`text-[10.5px] uppercase tracking-wider text-muted font-bold px-3 py-2.5 border-b border-border whitespace-nowrap ${
                      h === 'Valor' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itens.map((t) => (
                <tr key={t.transactionId}>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">
                    {t.data.split('-').reverse().join('/')}
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    <Pill tone={t.tipo === 'entrada' ? 'income' : 'expense'}>
                      {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Pill>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{t.categoria}</td>
                  <td className="px-3 py-2.5 border-b border-border text-inkSecondary">{t.descricao}</td>
                  <td className={`px-3 py-2.5 border-b border-border text-right font-semibold ${t.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'} {fmtBRL(t.valor)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-border">
                    {t.comprovanteUrl ? (
                      <button
                        type="button"
                        onClick={() => setComprovanteAberto(t.comprovanteUrl!)}
                        className="inline-flex items-center gap-1 text-accentStrong hover:underline text-[12.5px]"
                      >
                        <IconPaperclip className="icon w-3.5 h-3.5" /> Ver
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!carregando && itens.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    Nenhum lançamento neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex gap-2.5 items-start bg-surface2 border border-border rounded-xl px-4 py-3.5 text-[12.5px] text-inkSecondary mt-4.5">
        <IconInfo className="icon w-[17px] h-[17px] text-muted mt-0.5" />
        <span>
          Esta tela mostra o fluxo de caixa de forma aberta e transparente. Nenhum lançamento é vinculado
          publicamente a uma pessoa — veja quem contribuiu em{' '}
          <Link to="/dizimistas" className="text-accentStrong font-semibold">
            Dizimistas do mês
          </Link>
          .
        </span>
      </div>

      {comprovanteAberto && <AttachmentViewer url={comprovanteAberto} onClose={() => setComprovanteAberto(null)} />}
    </section>
  );
}
