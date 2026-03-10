import { Button, Flex, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'en', label: 'EN' },
    { code: 'pt-BR', label: 'PT' },
];

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();

    const currentLanguage = i18n.language || i18n.resolvedLanguage || 'en';

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    return (
        <Flex align="center" gap="2">
            <Text size="2" style={{ color: 'var(--gray-11)' }} weight="bold">
                {t('app.language')}:
            </Text>
            <Flex gap="1">
                {languages.map((lang) => (
                    <Button
                        color={currentLanguage === lang.code ? 'blue' : undefined}
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        size="1"
                        style={{
                            cursor: 'pointer',
                            minWidth: '40px',
                        }}
                        variant={currentLanguage === lang.code ? 'solid' : 'soft'}
                    >
                        {lang.label}
                    </Button>
                ))}
            </Flex>
        </Flex>
    );
}
