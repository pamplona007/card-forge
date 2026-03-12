import type { Project } from 'firebase/context';

import { Box, Button, Dialog, Flex, Switch, Text, TextArea, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectSettingsModalProps {
    isDeleting?: boolean;
    isOpen: boolean;
    isSaving: boolean;
    onClose: () => void;
    onDelete?: () => void;
    onSave: (updates: Pick<Project, 'description' | 'isPublic' | 'name'>) => void;
    project: Project;
}

export default function ProjectSettingsModal({
    isDeleting,
    isOpen,
    isSaving,
    onClose,
    onDelete,
    onSave,
    project,
}: ProjectSettingsModalProps) {
    const { t } = useTranslation();

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [isPublic, setIsPublic] = useState(project.isPublic);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

                {onDelete && (
                    <Box
                        mt="5"
                        p="3"
                        style={{
                            border: '1px solid var(--red-6)',
                            borderRadius: 'var(--radius-3)',
                        }}
                    >
                        <Text as="p" color="red" mb="2" size="2" weight="bold">
                            {t('projects.settings.dangerZone')}
                        </Text>
                        {showDeleteConfirm
                            ? (
                                <Flex direction="column" gap="2">
                                    <Text as="p" size="2">
                                        {t('projects.settings.deleteConfirmTitle', { name: project.name })}
                                    </Text>
                                    <Text as="p" color="gray" size="1">
                                        {t('projects.settings.deleteWarning')}
                                    </Text>
                                    <Flex gap="2" mt="1">
                                        <Button
                                            color="gray"
                                            disabled={isDeleting}
                                            onClick={() => setShowDeleteConfirm(false)}
                                            size="2"
                                            variant="soft"
                                        >
                                            {t('projects.button.cancel')}
                                        </Button>
                                        <Button
                                            color="red"
                                            disabled={isDeleting}
                                            loading={isDeleting}
                                            onClick={onDelete}
                                            size="2"
                                        >
                                            {t('projects.button.confirmDelete')}
                                        </Button>
                                    </Flex>
                                </Flex>
                            )
                            : (
                                <Button
                                    color="red"
                                    disabled={isSaving}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    size="2"
                                    variant="soft"
                                >
                                    {t('projects.button.deleteProject')}
                                </Button>
                            )}
                    </Box>
                )}

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
