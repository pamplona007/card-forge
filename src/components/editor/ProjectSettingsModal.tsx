import type { Project } from 'firebase/context';

import { Box, Button, Dialog, Flex, Switch, Text, TextArea, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectSettingsModalProps {
    isOpen: boolean;
    isSaving: boolean;
    onClose: () => void;
    onSave: (updates: Pick<Project, 'description' | 'isPublic' | 'name'>) => void;
    project: Project;
}

export default function ProjectSettingsModal({
    isOpen,
    isSaving,
    onClose,
    onSave,
    project,
}: ProjectSettingsModalProps) {
    const { t } = useTranslation();

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [isPublic, setIsPublic] = useState(project.isPublic);

    const handleSave = () => {
        onSave({ description, isPublic, name: name.trim() || project.name });
    };

    return (
        <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
            <Dialog.Content maxWidth="480px">
                <Dialog.Title>{t('projects.settings.title')}</Dialog.Title>
                <Dialog.Description mb="4">
                    {t('projects.settings.description')}
                </Dialog.Description>

                <Flex direction="column" gap="4">
                    <Box>
                        <Text as="label" mb="2" size="2" weight="bold">
                            {t('projects.label.projectName')}
                        </Text>
                        <TextField.Root
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('projects.placeholder.projectName')}
                            value={name}
                        />
                    </Box>

                    <Box>
                        <Text as="label" mb="2" size="2" weight="bold">
                            {t('projects.label.description')}
                        </Text>
                        <TextArea
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('projects.placeholder.description')}
                            rows={3}
                            value={description}
                        />
                    </Box>

                    <Box
                        p="3"
                        style={{
                            backgroundColor: 'var(--gray-3)',
                            borderRadius: 'var(--radius-3)',
                        }}
                    >
                        <Flex align="center" gap="3" justify="between">
                            <Box>
                                <Text as="p" size="2" weight="bold">
                                    {t('projects.label.publicProject')}
                                </Text>
                                <Text as="p" color="gray" size="1">
                                    {t('projects.label.publicProjectHint')}
                                </Text>
                            </Box>
                            <Switch
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </Flex>
                    </Box>
                </Flex>

                <Flex gap="3" justify="end" mt="5">
                    <Dialog.Close>
                        <Button disabled={isSaving} onClick={onClose} variant="soft">
                            {t('projects.button.cancel')}
                        </Button>
                    </Dialog.Close>
                    <Button disabled={isSaving || !name.trim()} loading={isSaving} onClick={handleSave}>
                        {t('projects.button.saveSettings')}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
