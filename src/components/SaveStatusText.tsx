import { Text } from '@radix-ui/themes';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

dayjs.extend(relativeTime);

interface SaveStatusTextProps {
    isSaving: boolean;
    isVisible: boolean;
    lastSaved: Date | null;
}

export default function SaveStatusText({
    isSaving,
    isVisible,
    lastSaved,
}: SaveStatusTextProps) {
    const { i18n, t } = useTranslation();
    const [, setRelativeTimeRefreshTick] = useState(() => Date.now());

    useEffect(() => {
        if (!lastSaved) {
            return;
        }

        const intervalId = setInterval(() => {
            setRelativeTimeRefreshTick(Date.now());
        }, 60000);

        return () => {
            clearInterval(intervalId);
        };
    }, [lastSaved]);

    if (!isVisible) {
        return null;
    }

    let text = '';
    const dayjsLocale = i18n.resolvedLanguage?.toLowerCase().startsWith('pt') ? 'pt-br' : 'en';
    const relativeTimeText = lastSaved
        ? dayjs(lastSaved)
            .locale(dayjsLocale)
            .fromNow()
        : t('editor.status.never');

    text = isSaving
        ? t('editor.status.saving')
        : t('editor.status.lastSaved', {
            time: relativeTimeText,
        });

    return (
        <Text size="2">
            {text}
        </Text>
    );
}
