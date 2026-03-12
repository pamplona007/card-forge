import React from 'react';

import type {
    CardProps,
    ZombieSpawnCardData,
} from '../types';

import {
    POKER_CARD_DIMENSIONS,
    ZONE_COLORS,
} from '../types';

interface ZombieSpawnCardProps extends CardProps {
    card: ZombieSpawnCardData;
}

const ZombieSpawnCard: React.FC<ZombieSpawnCardProps> = ({
    card,
    exportMode = false,
    showBleed = false,
}) => {
    const { bleed, height, totalHeight, totalWidth, width } = POKER_CARD_DIMENSIONS;
    const cardWidth = showBleed ? totalWidth : width;
    const cardHeight = showBleed ? totalHeight : height;
    const scale = exportMode ? 1 : 1;

    const zoneColor = ZONE_COLORS[card.spawnZone];

    const renderBleedArea = () => {
        if (!showBleed) {
            return null;
        }
        return (
            <rect
                fill="none"
                height={cardHeight - 2}
                opacity={0.3}
                stroke="#000"
                strokeDasharray="4 2"
                strokeWidth={0.5}
                width={cardWidth - 2}
                x={1}
                y={1}
            />
        );
    };

    return (
        <svg
            className="zombie-spawn-card"
            height={cardHeight * scale}
            style={{
                fontFamily: 'Impact, Haettenschweiler, sans-serif',
            }}
            viewBox={`0 0 ${cardWidth} ${cardHeight}`}
            width={cardWidth * scale}
            xmlns="http://www.w3.org/2000/svg"
        >

            {showBleed && (
                <rect
                    fill="#f5f5f5"
                    height={cardHeight}
                    width={cardWidth}
                    x={0}
                    y={0}
                />
            )}

            <rect
                fill="#1c1917"
                height={height}
                rx={4}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <rect
                fill={zoneColor}
                height={4}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <defs>
                <linearGradient id="zombieHeader" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#292524" />
                    <stop offset="100%" stopColor="#1c1917" />
                </linearGradient>
                <linearGradient id="zombieImage" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#44403c" />
                    <stop offset="100%" stopColor="#292524" />
                </linearGradient>
            </defs>

            <rect
                fill="url(#zombieHeader)"
                height={12}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed + 4 : 4}
            />

            <text
                fill="#f5f5f4"
                fontSize={9}
                fontWeight="bold"
                x={showBleed ? bleed + 4 : 4}
                y={showBleed ? bleed + 12 : 12}
            >
                {card.name}
            </text>

            <g transform={`translate(${showBleed ? bleed + width - 20 : width - 20}, ${showBleed ? bleed + 6 : 6})`}>
                {card.isElite && (
                    <g>
                        <rect fill="#7c2d12" height={6} rx={1} width={8} x={0} y={0} />
                        <text fill="#fdba74" fontSize={4} fontWeight="bold" textAnchor="middle" x={4} y={4}>E</text>
                    </g>
                )}
                {card.isSpecial && (
                    <g transform="translate(10, 0)">
                        <rect fill="#7c2d12" height={6} rx={1} width={8} x={0} y={0} />
                        <text fill="#fdba74" fontSize={4} fontWeight="bold" textAnchor="middle" x={4} y={4}>S</text>
                    </g>
                )}
            </g>

            <rect
                fill="url(#zombieImage)"
                height={35}
                rx={2}
                width={width - 4}
                x={showBleed ? bleed + 2 : 2}
                y={showBleed ? bleed + 18 : 18}
            />

            {card.image
                ? (
                    <image
                        height={35}
                        href={card.image}
                        preserveAspectRatio="xMidYMid slice"
                        width={width - 4}
                        x={showBleed ? bleed + 2 : 2}
                        y={showBleed ? bleed + 18 : 18}
                    />
                )
                : (
                    <g>
                        <text
                            fill="#78716c"
                            fontSize={7}
                            textAnchor="middle"
                            x={showBleed ? bleed + (width / 2) : width / 2}
                            y={showBleed ? bleed + 38 : 38}
                        >
                            NO IMAGE
                        </text>
                    </g>
                )}

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 55 : 55})`}>

                <g transform="translate(0, 0)">
                    <text fill="#a8a29e" fontSize={4} fontWeight="bold" x={0} y={3}>SPD</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.speed, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.speed ? '#facc15' : '#57534e'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>

                <g transform="translate(32, 0)">
                    <text fill="#a8a29e" fontSize={4} fontWeight="bold" x={0} y={3}>ATK</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.attack, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.attack ? '#ef4444' : '#57534e'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>

                <g transform="translate(64, 0)">
                    <text fill="#a8a29e" fontSize={4} fontWeight="bold" x={0} y={3}>DEF</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.defense, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.defense ? '#3b82f6' : '#57534e'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>
            </g>

            <g transform={`translate(${showBleed ? bleed + width - 20 : width - 20}, ${showBleed ? bleed + 68 : 68})`}>
                <rect fill={zoneColor} height={8} rx={2} width={18} x={0} y={0} />
                <text fill="#fff" fontSize={5} fontWeight="bold" style={{ textTransform: 'uppercase' }} textAnchor="middle" x={9} y={5}>
                    {card.spawnZone}
                </text>
            </g>

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 68 : 68})`}>
                <text fill="#a8a29e" fontSize={5}>XP: {card.xpValue || 1}</text>
            </g>

            {card.abilities && 0 < card.abilities.length && (
                <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 78 : 78})`}>
                    {card.abilities.map((ability, index) => (
                        <g key={ability.id} transform={`translate(0, ${index * 8})`}>
                            <text fill="#d6d3d1" fontSize={4} fontWeight="bold">
                                ★ {ability.name}
                            </text>
                        </g>
                    ))}
                </g>
            )}

            {card.flavorText && (
                <text
                    fill="#78716c"
                    fontSize={5}
                    fontStyle="italic"
                    x={showBleed ? bleed + 2 : 2}
                    y={showBleed ? bleed + height - 8 : height - 8}
                >
                    "{card.flavorText}"
                </text>
            )}

            {card.copyright && (
                <text
                    fill="#57534e"
                    fontSize={3}
                    textAnchor="end"
                    x={showBleed ? bleed + width - 2 : width - 2}
                    y={showBleed ? bleed + height - 2 : height - 2}
                >
                    {card.copyright}
                </text>
            )}

            {renderBleedArea()}
        </svg>
    );
};

export default ZombieSpawnCard;
