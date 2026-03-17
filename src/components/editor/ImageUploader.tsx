import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useTranslation } from 'react-i18next';

const ImageUploader: React.FC<{
    label?: string;
    onUpload: (url: string) => void;
    onUploadClick: () => void;
    uploading?: boolean;
    value?: string;
}> = ({ label, onUpload, onUploadClick, uploading, value }) => {
    const { t } = useTranslation();
    return (
        <Box>
            <Text as="p" mb="2" size="2" style={{ color: 'var(--gray-11)' }}>
                {label || t('editor.label.cardImage')}
            </Text>
            {value
                ? (
                    <Flex direction="column" gap="2">
                        <Box
                            style={{
                                border: '1px solid var(--gray-6)',
                                borderRadius: 'var(--radius-2)',
                            }}
                        >
                            <img
                                alt={t('editor.alt.cardPreview')}
                                src={value}
                                style={{ height: '100%', objectFit: 'contain', width: '100%' }}
                            />
                        </Box>
                        <Button color="red" onClick={() => onUpload('')} size="1" variant="soft">
                            {t('editor.buttonRemove.removeImage')}
                        </Button>
                    </Flex>
                )
                : (
                    <Button disabled={uploading} onClick={onUploadClick} variant="soft">
                        {uploading ? t('editor.status.uploading') : t('editor.buttonUpload.uploadImage')}
                    </Button>
                )}
        </Box>
    );
};

export default ImageUploader;
