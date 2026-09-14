import React, { useMemo } from 'react';
import './RobotFloorMap.css';
import { getRobotAppearance } from './robotAppearance';

// Alcance máximo (em metros) que o mapa consegue representar em cada eixo.
// Usado só para normalizar em % — não define pixels, por isso escala em
// qualquer largura de tela.
const MAX_COORDINATE = 3.8;
// Quanto do raio do mapa (em %) os robôs podem ocupar, deixando uma margem
// para o marcador não ficar colado na borda.
const USABLE_RADIUS_PERCENT = 44;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toPercent(value) {
    const clamped = clamp(Number(value) || 0, -MAX_COORDINATE, MAX_COORDINATE);
    return (clamped / MAX_COORDINATE) * USABLE_RADIUS_PERCENT;
}

function MiniRobotMarker({ id, pose, isSelected }) {
    const xPercent = 50 + toPercent(pose.x);
    const yPercent = 50 - toPercent(pose.y);
    const theta = (Number(pose.theta) || 0) * (180 / Math.PI);
    const appearance = getRobotAppearance(id);

    return (
        <div
            className={`mini-robot-marker ${isSelected ? 'is-selected' : ''}`}
            style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
            title={`${id}: x ${Number(pose.x || 0).toFixed(2)} m, y ${Number(pose.y || 0).toFixed(2)} m`}
        >
            <div
                className={`mini-robot-body mini-robot-shape-${appearance.shape}`}
                style={{ '--robot-color': appearance.color, transform: `translate(-50%, -50%) rotate(${theta}deg)` }}
            >
                <span className="mini-robot-arrow" aria-hidden="true">▲</span>
            </div>
            <span className="mini-robot-label">{id}</span>
        </div>
    );
}

export default function RobotFloorMap({ robotsPose = {}, mqttOnline, selectedRobotId, title = 'Mapa ao vivo' }) {
    const robots = useMemo(() => Object.entries(robotsPose), [robotsPose]);

    return (
        <section className="mini-map-card" aria-labelledby="mini-map-title">
            <div className="mini-map-heading">
                <h2 id="mini-map-title">{title}</h2>
                <span className={`mini-mqtt-indicator ${mqttOnline ? 'is-online' : ''}`}>
                    <i aria-hidden="true" />
                    {mqttOnline ? 'MQTT conectado' : 'Aguardando conexão'}
                </span>
            </div>

            <div className="mini-floor-map" aria-label="Mapa da área de movimentação dos robôs">
                <div className="mini-floor-origin" aria-hidden="true">0,0</div>
                {robots.map(([id, pose]) => (
                    <MiniRobotMarker key={id} id={id} pose={pose} isSelected={id === selectedRobotId} />
                ))}
                {robots.length === 0 ? (
                    <div className="mini-empty-message">
                        <span aria-hidden="true">🤖</span>
                        <small>Nenhum robô publicando posição ainda.</small>
                    </div>
                ) : null}
            </div>
        </section>
    );
}