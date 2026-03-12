import React from 'react';

import type {
    CardProps,
    EquipmentCardData,
} from '../types';

import {
    CARD_DIMENSIONS,
    RARITY_COLORS,
} from '../types';

interface EquipmentCardProps extends CardProps {
    card: EquipmentCardData;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
    card,
    exportMode = false,
    showBleed = false,
}) => {
    const { bleed, height, totalHeight, totalWidth, width } = CARD_DIMENSIONS;
    const cardWidth = showBleed ? totalWidth : width;
    const cardHeight = showBleed ? totalHeight : height;
    const scale = exportMode ? 1 : 1;

    const rarityColor = RARITY_COLORS[card.rarity] || '#9CA3AF';

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
            className="equipment-card"
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
                fill="#0f172a"
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
                stroke={rarityColor}
                strokeWidth={2}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <defs>
                <linearGradient id="equipmentHeader" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="equipmentImage" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
            </defs>

            <rect
                fill="url(#equipmentHeader)"
                height={14}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <text
                fill="#fff"
                fontSize={9}
                fontWeight="bold"
                x={showBleed ? bleed + 4 : 4}
                y={showBleed ? bleed + 10 : 10}
            >
                {card.name}
            </text>

            <g transform={`translate(${showBleed ? bleed + width - 14 : width - 14}, ${showBleed ? bleed + 3 : 3})`}>
                {[...Array(5)].map((_, i) => (
                    <rect
                        fill={i < card.rarity ? rarityColor : '#374151'}
                        height={8}
                        key={i}
                        rx={0.5}
                        width={2}
                        x={i * 2.5}
                        y={0}
                    />
                ))}
            </g>

            {card.isUnique && (
                <rect
                    fill="#F59E0B"
                    height={8}
                    rx={1}
                    width={12}
                    x={showBleed ? bleed + width - 28 : width - 28}
                    y={showBleed ? bleed + 3 : 3}
                />
            )}
            {card.isUnique && (
                <text
                    fill="#000"
                    fontSize={5}
                    fontWeight="bold"
                    x={showBleed ? bleed + width - 22 : width - 22}
                    y={showBleed ? bleed + 9 : 9}
                >
                    ★
                </text>
            )}

            <rect
                fill="url(#equipmentImage)"
                height={35}
                rx={2}
                width={width - 4}
                x={showBleed ? bleed + 2 : 2}
                y={showBleed ? bleed + 16 : 16}
            />

            {card.image
                ? (
                    <image
                        height={35}
                        href={card.image}
                        preserveAspectRatio="xMidYMid slice"
                        width={width - 4}
                        x={showBleed ? bleed + 2 : 2}
                        y={showBleed ? bleed + 16 : 16}
                    />
                )
                : (
                    <g>
                        <text
                            fill="#64748b"
                            fontSize={7}
                            textAnchor="middle"
                            x={showBleed ? bleed + (width / 2) : width / 2}
                            y={showBleed ? bleed + 36 : 36}
                        >
                            NO IMAGE
                        </text>
                    </g>
                )}

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 53 : 53})`}>
                <rect
                    fill="#334155"
                    height={6}
                    rx={1}
                    width={18}
                    x={0}
                    y={0}
                />
                <text
                    fill="#94a3b8"
                    fontSize={4}
                    fontWeight="bold"
                    textAnchor="middle"
                    x={9}
                    y={4}
                >
                    {card.slot.toUpperCase()}
                </text>
            </g>

            <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 62 : 62})`}>
                <text
                    fill="#cbd5e1"
                    fontSize={6}
                    x={0}
                    y={0}
                >
                    {card.description.split('\n').map((line, i) => (
                        <tspan dy={0 === i ? 0 : 8} key={i} x={0}>
                            {line}
                        </tspan>
                    ))}
                </text>
            </g>

            {card.abilities && 0 < card.abilities.length && (
                <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 74 : 74})`}>
                    <text fill="#94a3b8" fontSize={5} fontWeight="bold">
                        SPECIAL:
                    </text>
                    {card.abilities.map((ability, index) => (
                        <text
                            fill="#cbd5e1"
                            fontSize={5}
                            key={ability.id}
                            x={0}
                            y={6 + (index * 8)}
                        >
                            • {ability.name}
                        </text>
                    ))}
                </g>
            )}

            {card.flavorText && (
                <text
                    fill="#64748b"
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
                    fill="#475569"
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

export default EquipmentCard;
