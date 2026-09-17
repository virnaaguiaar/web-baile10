import React, { useState, useEffect } from 'react';
import './App.css';
import Logo      from './assets/10D_2026.png';
import Twitter   from './assets/twitter-logo.png';
import Facebook  from './assets/face-logo.png';
import Instagram from './assets/insta-logo.png';
import UFRN      from './assets/ufrn-logo.png';
import Lance     from './assets/lance-logo.png';
import Controle          from './components/controle';
import Sobre             from './components/sobre';
import ControleMultiRobo from './components/ControleMultiRobo';
import DigitalTwin       from './components/DigitalTwin';
import ControleGiroscopio from './components/ControleGiroscopio';
import useMQTT from './hooks/useMQTT';

// ─── Abas disponíveis (Formas removida) ────────────────────────────────────
const NAV_ITEMS = [
    { id: 'controle',   label: 'Controle',  icon: '🎮' },
    { id: 'giroscopio', label: 'Giroscópio',icon: '🎯' },
    { id: 'multi',      label: 'Multi-Robô',icon: '🤖' },
    { id: 'twin',       label: 'Twins',     icon: '🔄' },
    { id: 'sobre',      label: 'Sobre',     icon: '📖' },
];

function App() {
    const [currentPage,  setCurrentPage]  = useState('controle');
    const [menuAberto,   setMenuAberto]   = useState(false);
    const [userRobotId,  setUserRobotId]  = useState(
        () => localStorage.getItem('digitalTwinRobotId') || 'robo1'
    );

    const brokerUrl = process.env.REACT_APP_MQTT_BROKER
        || 'wss://bfea296c.ala.us-east-1.emqxsl.com:8084/mqtt';
    const { isConnected, status, robotsPose } = useMQTT(brokerUrl);

    const trocarPagina = (id) => {
        setCurrentPage(id);
        setMenuAberto(false);
    };

    const salvarRobo = (id) => {
        setUserRobotId(id);
        localStorage.setItem('digitalTwinRobotId', id);
    };

    useEffect(() => {
        console.log('🚀 App iniciado | Broker:', brokerUrl);
    }, [brokerUrl]);

    // Fecha menu ao clicar fora
    useEffect(() => {
        if (!menuAberto) return;
        const fechar = () => setMenuAberto(false);
        document.addEventListener('click', fechar);
        return () => document.removeEventListener('click', fechar);
    }, [menuAberto]);

    const renderPage = () => {
        switch (currentPage) {
            case 'controle':
                return (
                    <div className="page-container animate-fadeIn w-full flex flex-col items-center">
                        <main className="flex justify-center items-center flex-col py-10 px-4 sm:px-6 mt-4 w-full bg-white/95 backdrop-blur-sm border-2 border-amber-200/50 max-w-[1100px] rounded-3xl shadow-2xl shadow-amber-500/10">
                            {/* Controle já embute Musicas e Coreografia internamente */}
                            <Controle
                                robotsPose={robotsPose}
                                id_robo={userRobotId}
                                onRobotIdChange={salvarRobo}
                            />
                        </main>
                    </div>
                );
            case 'giroscopio':
                return (
                    <div className="page-container animate-fadeIn">
                        <ControleGiroscopio
                            robotsPose={robotsPose}
                            id_robo={userRobotId}
                            onRobotIdChange={salvarRobo}
                        />
                    </div>
                );
            case 'multi':
                return (
                    <div className="page-container animate-fadeIn">
                        <ControleMultiRobo robotsPose={robotsPose} mqttOnline={isConnected} />
                    </div>
                );
            case 'twin':
                return (
                    <div className="page-container animate-fadeIn">
                        <DigitalTwin
                            robotsPose={robotsPose}
                            mqttOnline={isConnected}
                            id_robo={userRobotId}
                            onRobotIdChange={salvarRobo}
                        />
                    </div>
                );
            case 'sobre':
                return (
                    <div className="page-container animate-fadeIn">
                        <Sobre />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f62681] via-[#f62681]/90 to-[#fffaec]">

            {/* ── Badge de status (fixo, canto superior direito) ────────────── */}
            <div className={`fixed top-3 right-3 z-50 px-3 py-1.5 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md transition-all duration-500 ${
                isConnected
                    ? 'bg-emerald-500/90 text-white shadow-emerald-500/30'
                    : 'bg-rose-500/90 text-white shadow-rose-500/30'
            }`}>
                <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-white' : 'bg-white/50'}`} />
                    {isConnected ? '🚀 Online' : '⚠️ Offline'}
                    {status && <span className="ml-1 opacity-70">({status})</span>}
                </div>
            </div>

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/30 shadow-sm">
                <nav className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto gap-3">

                    {/* Logo */}
                    <button
                        onClick={() => trocarPagina('controle')}
                        className="flex items-center gap-2 shrink-0 group"
                    >
                        <img
                            src={Logo}
                            alt="Logo 10 Dimensões"
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md group-hover:drop-shadow-xl transition-all"
                        />
                        <span className="hidden sm:block text-base font-bold bg-gradient-to-r from-[#f62681] to-[#F68621] bg-clip-text text-transparent whitespace-nowrap">
                            10 Dimensões
                        </span>
                    </button>

                    {/* Menu desktop — visível em telas md+ */}
                    <div className="hidden md:flex items-center gap-1 bg-amber-50/50 p-1 rounded-2xl border border-amber-200/30 flex-wrap justify-center">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => trocarPagina(item.id)}
                                className={`
                                    px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-300
                                    flex items-center gap-1.5 whitespace-nowrap
                                    ${currentPage === item.id
                                        ? 'text-white shadow-md'
                                        : 'text-amber-800/70 hover:text-amber-800 hover:bg-amber-100/50'
                                    }
                                `}
                                style={{
                                    background: currentPage === item.id
                                        ? 'linear-gradient(135deg, #f62681, #F68621)'
                                        : 'transparent',
                                }}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Menu hamburguer — visível apenas em mobile (< md) */}
                    <div className="relative md:hidden">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuAberto(v => !v); }}
                            className="flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 gap-1.5 transition-all hover:bg-amber-100"
                            aria-label="Abrir menu"
                        >
                            <span className={`block w-5 h-0.5 bg-amber-800 rounded transition-all duration-300 ${menuAberto ? 'rotate-45 translate-y-2' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-amber-800 rounded transition-all duration-300 ${menuAberto ? 'opacity-0' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-amber-800 rounded transition-all duration-300 ${menuAberto ? '-rotate-45 -translate-y-2' : ''}`} />
                        </button>

                        {/* Dropdown mobile */}
                        {menuAberto && (
                            <div
                                className="absolute right-0 top-12 w-52 bg-white/95 backdrop-blur-md border border-amber-200/50 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden animate-fadeIn z-50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {NAV_ITEMS.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => trocarPagina(item.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                                            transition-all duration-200 border-b border-amber-100/50 last:border-0
                                            ${currentPage === item.id
                                                ? 'text-white'
                                                : 'text-amber-900 hover:bg-amber-50'
                                            }
                                        `}
                                        style={{
                                            background: currentPage === item.id
                                                ? 'linear-gradient(135deg, #f62681, #F68621)'
                                                : undefined,
                                        }}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            {/* ── Conteúdo principal ──────────────────────────────────────────── */}
            <main className="flex flex-col items-center px-3 sm:px-4 py-6 max-w-7xl mx-auto">
                {renderPage()}
            </main>

            {/* ── Footer ──────────────────────────────────────────────────────── */}
            <footer className="mt-16 bg-white/80 backdrop-blur-md border-t border-amber-200/30">
                <div className="flex flex-col items-center px-4 py-8 max-w-7xl mx-auto gap-6">

                    {/* Logos parceiros */}
                    <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                        <img src={Logo}  className="h-12 w-auto object-contain opacity-80" alt="10 Dimensões" />
                        <div className="hidden sm:block w-px h-10 bg-amber-200/50" />
                        <img src={Lance} className="h-10 w-auto object-contain opacity-80" alt="Lance" />
                        <div className="hidden sm:block w-px h-10 bg-amber-200/50" />
                        <img src={UFRN}  className="h-10 w-auto object-contain opacity-80" alt="UFRN" />
                    </div>

                    {/* Redes sociais */}
                    <div className="flex gap-5">
                        <a href="https://www.facebook.com/10dimensoes/" target="_blank" rel="noopener noreferrer"
                           className="hover:scale-110 transition-transform duration-300">
                            <img src={Facebook}  className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" alt="Facebook" />
                        </a>
                        <a href="https://www.instagram.com/10dimensoes/" target="_blank" rel="noopener noreferrer"
                           className="hover:scale-110 transition-transform duration-300">
                            <img src={Instagram} className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" alt="Instagram" />
                        </a>
                        <a href="https://x.com/10dimensoes" target="_blank" rel="noopener noreferrer"
                           className="hover:scale-110 transition-transform duration-300">
                            <img src={Twitter}   className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" alt="Twitter" />
                        </a>
                    </div>

                    <p className="text-xs text-amber-800/40">
                        © 2026 10 Dimensões · Todos os direitos reservados
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;