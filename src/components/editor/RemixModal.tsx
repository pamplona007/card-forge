import type { Project } from 'firebase/context';

import { Box, Button, Dialog, Flex, Switch, Text, TextArea, TextField } from '@radix-ui/themes';
import { useCreateProject } from 'hooks/useCreateProject';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface RemixModalProps {
    defaultName: string;
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

export default function RemixModal({ defaultName, isOpen, onClose, project }: RemixModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const createProjectMutation = useCreateProject();

    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState(project.description);
    const [isPublic, setIsPublic] = useState(false);

    const handleCreate = async () => {
        const cards = project.cards.map((card) => ({ ...card, id: crypto.randomUUID() }));
        const newId = await createProjectMutation.mutateAsync({
            cards,
            description,
            gameId: project.gameId,
            isPublic,
            name: name.trim() || defaultName,
            remixedFrom: project.id,
            userId: '',
        });
        onClose();
        navigate(`/project/${newId}`);
    };

    return (
        <Dialog.Root onOpenChange={(open) => !open && onClose()} open={isOpen}>
            <Dialog.Content maxWidth="480px">
                <Dialog.Title>{t('projects.remix.title')}</Dialog.Title>
                <Dialog.Description mb="4">
                    {t('projects.remix.description')}
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
                    <Button
                        disabled={createProjectMutation.isPending}
                        onClick={onClose}
                        variant="soft"
                    >
                        {t('projects.button.cancel')}
                    </Button>
                    <Button
                        disabled={!name.trim() || createProjectMutation.isPending}
                        loading={createProjectMutation.isPending}
                        onClick={handleCreate}
                    >
                        {t('projects.remix.createButton')}
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
