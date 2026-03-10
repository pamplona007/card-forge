import React from 'react';

import type {
    CardProps,
    DamageType,
    PimpWeaponCardData,
} from '../../../types/zombicide-card';

import {
    CARD_DIMENSIONS,
} from '../../../types/zombicide-card';

interface PimpWeaponCardProps extends CardProps {
  card: PimpWeaponCardData;
}

const DAMAGE_TYPE_ICONS: Record<DamageType, string> = {
    explosive: '💥',
    fire: '🔥',
    melee: '⚔',
    ranged: '🎯',
};

const DAMAGE_TYPE_COLORS: Record<DamageType, string> = {
    explosive: '#F97316',
    fire: '#DC2626',
    melee: '#EF4444',
    ranged: '#3B82F6',
};

const PimpWeaponCard: React.FC<PimpWeaponCardProps> = ({
    card,
    exportMode = false,
    showBleed = false,
}) => {
    const { bleed, height, totalHeight, totalWidth, width } = CARD_DIMENSIONS;
    const cardWidth = showBleed ? totalWidth : width;
    const cardHeight = showBleed ? totalHeight : height;
    const scale = exportMode ? 1 : 1;

    const damageColor = DAMAGE_TYPE_COLORS[card.damageType];

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
            className="pimp-weapon-card"
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
                fill="#18181b"
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
                stroke={damageColor}
                strokeWidth={3}
                width={width}
                x={showBleed ? bleed : 0}
                y={showBleed ? bleed : 0}
            />

            <defs>
                <linearGradient id="weaponHeader" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="100%" stopColor="#18181b" />
                </linearGradient>
                <linearGradient id="weaponImage" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#3f3f46" />
                    <stop offset="100%" stopColor="#27272a" />
                </linearGradient>
            </defs>

            <rect
                fill="url(#weaponHeader)"
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

            <g transform={`translate(${showBleed ? bleed + width - 12 : width - 12}, ${showBleed ? bleed + 2 : 2})`}>
                <text fontSize={10}>
                    {DAMAGE_TYPE_ICONS[card.damageType]}
                </text>
            </g>

            <rect
                fill="url(#weaponImage)"
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
                            fill="#71717a"
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

                <g transform="translate(0, 0)">
                    <rect fill="#27272a" height={10} rx={2} width={22} x={0} y={0} />
                    <text fill={damageColor} fontSize={5} fontWeight="bold" x={3} y={4}>DMG</text>
                    <text fill="#fff" fontSize={6} fontWeight="bold" x={3} y={8}>{card.damage}</text>
                    <text fill={damageColor} fontSize={5} x={16} y={8}>★</text>
                </g>

                <g transform="translate(26, 0)">
                    <rect fill="#27272a" height={10} rx={2} width={22} x={0} y={0} />
                    <text fill="#22c55e" fontSize={5} fontWeight="bold" x={3} y={4}>RNG</text>
                    <text fill="#fff" fontSize={6} fontWeight="bold" x={3} y={8}>{card.range}</text>
                    <text fill="#22c55e" fontSize={5} x={16} y={8}>★</text>
                </g>

                {card.isTwoHanded && (
                    <g transform="translate(52, 0)">
                        <rect fill="#27272a" height={10} rx={2} width={10} x={0} y={0} />
                        <text fill="#a1a1aa" fontSize={6} textAnchor="middle" x={5} y={7}>2H</text>
                    </g>
                )}
            </g>

            {card.abilities && 0 < card.abilities.length && (
                <g transform={`translate(${showBleed ? bleed + 2 : 2}, ${showBleed ? bleed + 66 : 66})`}>
                    <text fill="#a1a1aa" fontSize={5} fontWeight="bold" style={{ textTransform: 'uppercase' }}>
            Abilities
                    </text>
                    {card.abilities.map((ability, index) => (
                        <g key={ability.id} transform={`translate(0, ${6 + (index * 10)})`}>
                            <text fill="#e4e4e7" fontSize={5} fontWeight="bold">
                ★ {ability.name}
                            </text>
                            <text fill="#a1a1aa" fontSize={4} x={0} y={5}>
                                {ability.description}
                            </text>
                        </g>
                    ))}
                </g>
            )}

            {card.flavorText && (
                <text
                    fill="#71717a"
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
                    fill="#52525b"
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

export default PimpWeaponCard;
