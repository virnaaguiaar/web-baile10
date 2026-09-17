import React, { useState, useEffect } from 'react';
import './App.css';
import Logo      from './assets/10D_2026.png';
import Twitter   from './assets/twitter-logo.png';
import Facebook  from './assets/face-logo.png';
import Instagram from './assets/insta-logo.png';
import UFRN      from './assets/ufrn-logo.png';
import Lance     from './assets/lance-logo.png';
import Controle           from './components/controle';
import Sobre              from './components/sobre';
import ControleMultiRobo  from './components/ControleMultiRobo';
import DigitalTwin        from './components/DigitalTwin';
import ControleGiroscopio from './components/ControleGiroscopio';
import useMQTT from './hooks/useMQTT';

// ── "Manual" é o novo nome da aba controle ──────────────────────────────────
const NAV_ITEMS = [
    { id: 'controle',   label: 'Manual',     icon: '🎮' },
    { id: 'giroscopio', label: 'Giroscópio', icon: '🎯' },
    { id: 'multi',      label: 'Multi-Robô', icon: '🤖' },
    { id: 'twin',       label: 'Twins',      icon: '🔄' },
    { id: 'sobre',      label: 'Sobre',      icon: '📖' },
];

// Primeiras 3 abas ficam sempre visíveis no mobile; as demais vão em "Mais"
const NAV_VISIBLE_MOBILE = 3; // Manual | Giroscópio | Multi-Robô

function App() {
    const [currentPage, setCurrentPage] = useState('controle');
    const [maisAberto,  setMaisAberto]  = useState(false);
    const [userRobotId, setUserRobotId] = useState(
        () => localStorage.getItem('digitalTwinRobotId') || 'robo1'
    );

    const brokerUrl = process.env.REACT_APP_MQTT_BROKER
        || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';
    const { isConnected, status, robotsPose } = useMQTT(brokerUrl);

    const trocarPagina = (id) => { setCurrentPage(id); setMaisAberto(false); };
    const salvarRobo   = (id) => { setUserRobotId(id); localStorage.setItem('digitalTwinRobotId', id); };

    useEffect(() => { console.log('🚀 App | Broker:', brokerUrl); }, [brokerUrl]);

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        if (!maisAberto) return;
        const fechar = () => setMaisAberto(false);
        document.addEventListener('click', fechar);
        return () => document.removeEventListener('click', fechar);
    }, [maisAberto]);

    const renderPage = () => {
        switch (currentPage) {
            case 'controle':
                return (
                    <div className="animate-fadeIn w-full flex flex-col items-center">
                        <main className="flex justify-center items-center flex-col py-10 px-4 sm:px-6 mt-4 w-full
                                         bg-white/95 backdrop-blur-sm border border-[#f62681]/20
                                         max-w-[1100px] rounded-3xl shadow-2xl shadow-[#f62681]/10">
                            <Controle robotsPose={robotsPose} id_robo={userRobotId} onRobotIdChange={salvarRobo} />
                        </main>
                    </div>
                );
            case 'giroscopio':
                return <div className="animate-fadeIn"><ControleGiroscopio robotsPose={robotsPose} id_robo={userRobotId} onRobotIdChange={salvarRobo} /></div>;
            case 'multi':
                return <div className="animate-fadeIn"><ControleMultiRobo robotsPose={robotsPose} mqttOnline={isConnected} /></div>;
            case 'twin':
                return <div className="animate-fadeIn"><DigitalTwin robotsPose={robotsPose} mqttOnline={isConnected} id_robo={userRobotId} onRobotIdChange={salvarRobo} /></div>;
            case 'sobre':
                return <div className="animate-fadeIn"><Sobre /></div>;
            default:
                return null;
        }
    };

    const navPrimarios  = NAV_ITEMS.slice(0, NAV_VISIBLE_MOBILE);
    const navSecundarios = NAV_ITEMS.slice(NAV_VISIBLE_MOBILE);
    const maisAtivo = navSecundarios.some(i => i.id === currentPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f62681] via-[#e8197a] to-[#fdf2f8]">

            {/* ── HEADER ─────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/96 backdrop-blur-md border-b border-[#f62681]/15 shadow-sm">

                {/* Badge status — integrado ao header, não flutua sobre o conteúdo */}
                <div className="flex items-center justify-between px-4 pt-2 pb-0 max-w-7xl mx-auto">
                    {/* Logo */}
                    <button onClick={() => trocarPagina('controle')} className="flex items-center gap-2 shrink-0 group">
                        <img src={Logo} alt="10 Dimensões" className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow group-hover:drop-shadow-lg transition-all" />
                        <span className="hidden sm:block text-base font-bold text-[#f62681] whitespace-nowrap">
                            10 Dimensões
                        </span>
                    </button>

                    {/* Status badge — alinhado à direita, nunca sobrepõe nada */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-500 ${
                        isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                        {isConnected ? 'Online' : 'Offline'}
                        {status && <span className="opacity-60 hidden sm:inline">· {status}</span>}
                    </div>
                </div>

                {/* ── NAV DESKTOP (md+) ──────────────────────────────────────── */}
                <nav className="hidden md:flex justify-center px-4 pb-2 pt-1.5">
                    <div className="flex items-center gap-1 bg-[#fdf2f8] p-1 rounded-2xl border border-[#f62681]/15">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => trocarPagina(item.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                                    currentPage === item.id
                                        ? 'bg-[#f62681] text-white shadow-md shadow-[#f62681]/30'
                                        : 'text-[#f62681]/70 hover:text-[#f62681] hover:bg-[#f62681]/10'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* ── NAV MOBILE (< md) — tab bar centralizada ───────────────── */}
                <nav className="md:hidden flex items-center justify-center px-2 pb-2 pt-1 gap-1">
                    {/* Abas primárias */}
                    {navPrimarios.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => trocarPagina(item.id)}
                            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 flex-1 max-w-[80px] ${
                                currentPage === item.id
                                    ? 'bg-[#f62681] text-white shadow-md shadow-[#f62681]/30'
                                    : 'text-[#f62681]/60 hover:text-[#f62681] hover:bg-[#f62681]/10'
                            }`}
                        >
                            <span className="text-base leading-none">{item.icon}</span>
                            <span className="leading-tight truncate">{item.label}</span>
                        </button>
                    ))}

                    {/* Botão "Mais" — dropdown para abas secundárias */}
                    <div className="relative flex-1 max-w-[80px]">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMaisAberto(v => !v); }}
                            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 w-full ${
                                maisAtivo || maisAberto
                                    ? 'bg-[#f62681] text-white shadow-md shadow-[#f62681]/30'
                                    : 'text-[#f62681]/60 hover:text-[#f62681] hover:bg-[#f62681]/10'
                            }`}
                        >
                            <span className="text-base leading-none">⋯</span>
                            <span className="leading-tight">Mais</span>
                        </button>

                        {maisAberto && (
                            <div
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-white border border-[#f62681]/20 rounded-2xl shadow-2xl shadow-[#f62681]/15 overflow-hidden animate-fadeIn z-50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {navSecundarios.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => trocarPagina(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all border-b border-[#f62681]/10 last:border-0 ${
                                            currentPage === item.id
                                                ? 'bg-[#f62681] text-white'
                                                : 'text-[#f62681]/80 hover:bg-[#fdf2f8]'
                                        }`}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            {/* ── CONTEÚDO ───────────────────────────────────────────────────── */}
            <main className="flex flex-col items-center px-3 sm:px-4 py-6 max-w-7xl mx-auto">
                {renderPage()}
            </main>

            {/* ── FOOTER ─────────────────────────────────────────────────────── */}
            <footer className="mt-16 bg-white/85 backdrop-blur-md border-t border-[#f62681]/15">
                <div className="flex flex-col items-center px-4 py-8 max-w-7xl mx-auto gap-5">
                    <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                        <img src={Logo}  className="h-11 w-auto object-contain opacity-80" alt="10 Dimensões" />
                        <div className="hidden sm:block w-px h-9 bg-[#f62681]/20" />
                        <img src={Lance} className="h-9 w-auto object-contain opacity-75" alt="Lance" />
                        <div className="hidden sm:block w-px h-9 bg-[#f62681]/20" />
                        <img src={UFRN}  className="h-9 w-auto object-contain opacity-75" alt="UFRN" />
                    </div>
                    <div className="flex gap-5">
                        <a href="https://www.facebook.com/10dimensoes/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                            <img src={Facebook}  className="h-7 w-auto opacity-60 hover:opacity-100 transition-opacity" alt="Facebook" />
                        </a>
                        <a href="https://www.instagram.com/10dimensoes/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                            <img src={Instagram} className="h-7 w-auto opacity-60 hover:opacity-100 transition-opacity" alt="Instagram" />
                        </a>
                        <a href="https://x.com/10dimensoes" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                            <img src={Twitter}   className="h-7 w-auto opacity-60 hover:opacity-100 transition-opacity" alt="Twitter" />
                        </a>
                    </div>
                    <p className="text-xs text-[#f62681]/40">© 2026 10 Dimensões · Todos os direitos reservados</p>
                </div>
            </footer>
        </div>
    );
}

export default App;