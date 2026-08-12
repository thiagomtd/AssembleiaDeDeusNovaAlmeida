import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Emblem, IconBook, IconUsers, IconVideo, IconPin } from '../components/icons';

interface ChurchInfo {
  textoInstitucional: string;
  endereco: string;
  mapaEmbedUrl: string;
  horarios: { dia: string; horario: string }[];
}

const feelings = [
  {
    titulo: 'A Quarta-Feira',
    texto:
      'O ritmo é calmo. Enquanto o dia esfria, a sala se enche devagar. É o momento da oração, da avó em seu lugar de sempre, do fôlego no meio da semana.',
    icone: IconBook,
    tom: 'coastClay',
  },
  {
    titulo: 'Domingo de Manhã',
    texto:
      'Escola Bíblica. As crianças correm nos fundos enquanto os adultos mergulham nas Escrituras. Um abraço de quem se conhece há anos — aqui, ninguém é estranho por muito tempo.',
    icone: IconUsers,
    tom: 'coastOcean',
  },
  {
    titulo: 'Domingo à Noite',
    texto:
      'A grande celebração. O lugar aquece com a força das vozes em uníssono, e a esperança é renovada para os dias que virão.',
    icone: IconVideo,
    tom: 'coastMist',
  },
] as const;

export function Home() {
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<ChurchInfo | null>(null);

  useEffect(() => {
    api.get<ChurchInfo>('/church-info').then(setInfo).catch(() => {});
  }, []);

  const mapsUrl = info?.endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.endereco)}`
    : undefined;

  return (
    <div className="-mx-4 sm:-mx-5 -mt-6 sm:-mt-7">
      {/* Hero */}
      <section className="px-4 sm:px-5 pt-8 pb-16 md:pb-24">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="inline-block py-1 px-3 bg-coastMist rounded-full text-[10px] font-bold uppercase tracking-widest text-coastOcean italic mb-6">
                Fé · Família · Esperança
              </span>
              <h1 className="font-serif text-[38px] sm:text-[52px] md:text-[60px] leading-[1.08] mb-6 text-coastInk">
                Assembleia de Deus <br />
                <span className="text-coastClay italic">de Nova Almeida</span>
              </h1>
              <p className="text-[15px] sm:text-[17px] text-coastInk/70 max-w-lg mb-9 leading-relaxed">
                {info?.textoInstitucional ||
                  'Uma comunidade de fé, família e esperança. Anunciando o Evangelho e servindo a comunidade de Nova Almeida.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5">
                <a
                  href="#convite"
                  className="px-7 py-3.5 bg-coastOcean text-white font-semibold rounded-md hover:bg-coastInk transition-colors shadow-lg text-center text-[14px]"
                >
                  Ver horários e endereço
                </a>
                <Link
                  to={isAuthenticated ? '/midia' : '/entrar'}
                  className="px-7 py-3.5 border border-coastInk/15 font-semibold rounded-md hover:bg-white transition-colors flex items-center justify-center gap-2 text-[14px] text-coastInk"
                >
                  Galeria dos Cultos
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-coastMist via-coastSand to-coastClay/20 flex items-center justify-center">
                <Emblem className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />
              </div>
              <div className="absolute -bottom-5 -left-5 sm:-bottom-6 sm:-left-6 bg-white p-5 sm:p-6 shadow-xl rounded-lg hidden md:block max-w-[230px]">
                <p className="text-[13.5px] italic font-serif leading-relaxed text-coastInk">
                  "Sentir o cheiro do mar e o calor da nossa gente. Aqui o Evangelho tem raízes profundas."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A sensação de estar lá */}
      <section className="bg-coastOcean text-coastSand py-16 md:py-24 px-4 sm:px-5">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid sm:grid-cols-3 gap-10 md:gap-14">
            {feelings.map((f) => (
              <div key={f.titulo} className="flex flex-col">
                <h3 className="font-serif text-[24px] mb-4">{f.titulo}</h3>
                <p className="text-coastSand/80 text-[13.5px] leading-relaxed mb-4 flex-1">{f.texto}</p>
                <div className="w-full aspect-video rounded-lg bg-white/10 flex items-center justify-center flex-none">
                  <f.icone className="icon w-7 h-7 text-coastSand/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Convite */}
      <section id="convite" className="py-20 md:py-28 px-4 sm:px-5 bg-white scroll-mt-16">
        <div className="max-w-[820px] mx-auto text-center">
          <h2 className="font-serif text-[32px] md:text-[42px] mb-12 text-coastInk">Você é nosso convidado</h2>

          <div className="grid md:grid-cols-2 gap-10 md:gap-14 text-left">
            <div>
              <h4 className="text-coastClay font-bold uppercase tracking-widest text-[11px] mb-4">Nossos Encontros</h4>
              <ul className="space-y-5">
                {(info?.horarios ?? []).map((h, i) => (
                  <li key={i} className="flex justify-between items-end border-b border-coastInk/10 pb-3.5">
                    <span className="font-serif text-[18px] text-coastInk">{h.dia}</span>
                    <span className="text-[12.5px] font-semibold text-coastInk/70 text-right">{h.horario}</span>
                  </li>
                ))}
                {(!info || info.horarios.length === 0) && (
                  <li className="text-sm text-coastInk/50">Horários a definir.</li>
                )}
              </ul>
            </div>

            <div className="bg-coastMist p-6 sm:p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-coastOcean font-bold uppercase tracking-widest text-[11px] mb-4">Onde Estamos</h4>
                <p className="font-serif text-[19px] leading-snug mb-3 text-coastInk">
                  {info?.endereco || 'Endereço a definir'}
                </p>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-white text-coastInk border border-coastInk/5 font-semibold rounded shadow-sm flex items-center justify-center gap-2 hover:bg-coastOcean hover:text-white transition-colors text-[13.5px]"
                >
                  Abrir no Google Maps <IconPin className="icon w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Convite ao portal do membro */}
      {!isAuthenticated && (
        <section className="px-4 sm:px-5 pb-16 md:pb-24">
          <div className="max-w-[1180px] mx-auto bg-coastClay rounded-[2rem] p-8 md:p-16 text-white text-center overflow-hidden relative">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-serif text-[30px] md:text-[46px] mb-5">Faça parte da nossa família</h2>
              <p className="text-white/85 text-[14.5px] md:text-[16px] mb-8 leading-relaxed">
                Já frequenta a nossa igreja? Acesse o portal para ver aniversariantes, transparência financeira e as
                fotos dos últimos cultos.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Link
                  to="/entrar"
                  className="inline-block px-9 py-3.5 bg-white text-coastClay font-bold rounded-full hover:scale-105 transition-transform text-[14px] text-center"
                >
                  Entrar no Portal do Membro
                </Link>
                <a
                  href="#convite"
                  className="inline-block px-9 py-3.5 border border-white/40 text-white font-bold rounded-full hover:bg-white/10 transition-colors text-[14px] text-center"
                >
                  Quero me envolver
                </a>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>
      )}
    </div>
  );
}
