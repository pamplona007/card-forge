import { Button, Flex, Text } from '@radix-ui/themes';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type CardSide = 'back' | 'front';

interface CardSideSwitchProps {
  currentSide: CardSide;
  onSideChange: (side: CardSide) => void;
}

const CardSideSwitch: React.FC<CardSideSwitchProps> = ({
    currentSide,
    onSideChange,
}) => {
    const { t } = useTranslation();

    return (
        <Flex align="center" gap="2">
            <Text as="p" mr="2" size="2" style={{ color: 'var(--gray-11)' }}>
                {t('editor.label.side')}:
            </Text>
            <Button
                color={'front' === currentSide ? 'blue' : 'gray'}
                onClick={() => onSideChange('front')}
                size="1"
                variant={'front' === currentSide ? 'solid' : 'outline'}
            >
                {t('zombicide.editor.label.front')}
            </Button>
            <Button
                color={'back' === currentSide ? 'blue' : 'gray'}
                onClick={() => onSideChange('back')}
                size="1"
                variant={'back' === currentSide ? 'solid' : 'outline'}
            >
                {t('zombicide.editor.label.back')}
            </Button>
        </Flex>
    );
};

export default CardSideSwitch;
