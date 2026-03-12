import React from 'react';

import type {
    AbominationCardData,
    CardProps,
} from '../types';

import {
    CARD_DIMENSIONS,
} from '../types';

interface AbominationCardProps extends CardProps {
    card: AbominationCardData;
}

const AbominationCard: React.FC<AbominationCardProps> = ({
    card,
    exportMode = false,
    showBleed = false,
}) => {
    const { bleed, height, totalHeight, totalWidth, width } = CARD_DIMENSIONS;
    const cardWidth = showBleed ? totalWidth : width;
    const cardHeight = showBleed ? totalHeight : height;
    const scale = exportMode ? 1 : 1;

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
            className="abomination-card"
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
                fill="#1c0314"
                height={height}
                rx={4}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <rect
                fill="none"
                height={height}
                rx={4}
                stroke="#991b1b"
                strokeWidth={3}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <defs>
                <linearGradient id="abomHeader" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#2f0424" />
                    <stop offset="100%" stopColor="#1c0314" />
                </linearGradient>
                <linearGradient id="abomImage" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#4a044e" />
                    <stop offset="100%" stopColor="#2f0424" />
                </linearGradient>
                <linearGradient id="abomHealth" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#991b1b" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
            </defs>

            <rect
                fill="url(#abomHeader)"
                height={16}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <text
                fill="#f87171"
                fontSize={5}
                fontWeight="bold"
                style={{ textTransform: 'uppercase' }}
                x={showBleed ? bleed + 2 : 2}
                y={showBleed ? bleed + 5 : 5}
            >
                ABOMINATION
            </text>

            <text
                fill="#fecaca"
                fontSize={10}
                fontWeight="bold"
                x={showBleed ? bleed + 4 : 4}
                y={showBleed ? bleed + 14 : 14}
            >
                {card.name}
            </text>

            <g transform={`translate(${showBleed ? bleed + width - 28 : width - 28}, ${showBleed ? bleed + 2 : 2})`}>
                <rect fill="url(#abomHealth)" height={12} rx={2} width={26} x={0} y={0} />
                <text fill="#fff" fontSize={7} fontWeight="bold" x={4} y={8}>HP</text>
                <text fill="#fecaca" fontSize={7} fontWeight="bold" x={14} y={8}>{card.health}</text>
            </g>

            <rect
                fill="url(#abomImage)"
                height={38}
                rx={2}
                width={width - 4}
                x={showBleed ? bleed + 2 : 2}
                y={showBleed ? bleed + 18 : 18}
            />

            {card.image
                ? (
                    <image
                        height={38}
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
                            fill="#a855f7"
                            fontSize={7}
                            textAnchor="middle"
                            x={showBleed ? bleed + (width / 2) : width / 2}
                            y={showBleed ? bleed + 40 : 40}
                        >
                            NO IMAGE
                        </text>
                    </g>
                )}

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 58 : 58})`}>

                <g transform="translate(0, 0)">
                    <text fill="#f87171" fontSize={4} fontWeight="bold" x={0} y={3}>SPD</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.speed, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.speed ? '#facc15' : '#7f1d1d'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>

                <g transform="translate(32, 0)">
                    <text fill="#f87171" fontSize={4} fontWeight="bold" x={0} y={3}>ATK</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.attack, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.attack ? '#ef4444' : '#7f1d1d'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>

                <g transform="translate(64, 0)">
                    <text fill="#f87171" fontSize={4} fontWeight="bold" x={0} y={3}>DEF</text>
                    <g transform="translate(10, -2)">
                        {[...Array(Math.min(card.defense, 5))].map((_, i) => (
                            <circle
                                cx={i * 4}
                                cy={4}
                                fill={0 < card.defense ? '#3b82f6' : '#7f1d1d'}
                                key={i}
                                r={1.5}
                            />
                        ))}
                    </g>
                </g>
            </g>

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 70 : 70})`}>
                <rect fill="#991b1b" height={6} rx={1} width={14} x={0} y={0} />
                <text fill="#fecaca" fontSize={4} fontWeight="bold" textAnchor="middle" x={7} y={4}>{card.xpValue} XP</text>
            </g>

            {card.abilities && 0 < card.abilities.length && (
                <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 80 : 80})`}>
                    {card.abilities.map((ability, index) => (
                        <g key={ability.id} transform={`translate(0, ${index * 8})`}>
                            <text fill="#fecaca" fontSize={4} fontWeight="bold">
                                ★ {ability.name}
                            </text>
                        </g>
                    ))}
                </g>
            )}

            {card.flavorText && (
                <text
                    fill="#f87171"
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
                    fill="#7f1d1d"
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

export default AbominationCard;
