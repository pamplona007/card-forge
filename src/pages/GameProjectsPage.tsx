import { Box, Button, Dialog, Flex, Grid, Heading, Spinner, Switch, Text, TextArea, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../components/ui/AppLayout';
import ProjectCard from '../components/ui/ProjectCard';
import { useCreateProject } from '../hooks/useCreateProject';
import { useFirebase } from '../hooks/useFirebase';
import { useProjects } from '../hooks/useProjects';
import { getGameById } from '../types/game';

export default function GameProjectsPage() {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { user } = useFirebase();
    const { data: projectsData, isLoading } = useProjects(gameId);
    const createProjectMutation = useCreateProject();
    const { t } = useTranslation();

    const [game] = useState(getGameById(gameId || ''));
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectIsPublic, setNewProjectIsPublic] = useState(false);

    const publicProjects = projectsData?.publicProjects || [];
    const userProjects = projectsData?.userProjects || [];

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !user || !gameId) {
            return;
        }

        try {
            const projectId = await createProjectMutation.mutateAsync({
                cards: [],
                description: newProjectDescription.trim(),
                gameId,
                isPublic: newProjectIsPublic,
                name: newProjectName.trim(),
                userId: user.uid,
            });

            navigate(`/project/${projectId}`);
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setIsCreateDialogOpen(false);
            setNewProjectName('');
            setNewProjectDescription('');
            setNewProjectIsPublic(false);
        }
    };

    const handleProjectClick = (projectId: string) => {
        navigate(`/project/${projectId}`);
    };

    if (!game) {
        return (
            <AppLayout>
                <Box p="6">
                    <Heading color="red" size="6">
                        {t('projects.error.gameNotFound')}
                    </Heading>
                    <Text color="gray">
                        {t('projects.error.gameNotFoundDescription')}
                    </Text>
                </Box>
            </AppLayout>
        );
    }

    return (
        <AppLayout>

            <Box mb="6">
                <Flex
                    align={{
                        initial: 'start',
                        sm: 'center',
                    }}
                    direction={{
                        initial: 'column',
                        sm: 'row',
                    }}
                    gap={'4'}
                    justify="between"
                    mb="4"
                >
                    <Box>
                        <Heading mb="2" size="8">
                            {game.name}
                        </Heading>
                        <Text color="gray" size="4">
                            {t('projects.label.publishedBy', { publisher: game.publisher })}
                        </Text>
                        <Text as='p' size="4">
                            {game.description}
                        </Text>
                    </Box>
                    {user && (
                        <Dialog.Root onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
                            <Dialog.Trigger>
                                <Button color="blue" size="3">
                                    {t('projects.button.createNew')}
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content style={{ maxWidth: 450 }}>
                                <Dialog.Title>{t('projects.dialog.createTitle')}</Dialog.Title>
                                <Dialog.Description mb="4" size="2">
                                    {t('projects.dialog.createDescription')}
                                </Dialog.Description>
                                <Flex direction="column" gap="4">
                                    <Box>
                                        <Text as="label" mb="2" size="2" weight="bold">
                                            {t('projects.label.projectName')}
                                        </Text>
                                        <TextField.Root
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if ('Enter' === e.key && newProjectName.trim()) {
                                                    handleCreateProject();
                                                }
                                            }}
                                            placeholder={t('projects.placeholder.projectName')}
                                            value={newProjectName}
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="label" mb="2" size="2" weight="bold">
                                            {t('projects.label.description')}
                                        </Text>
                                        <TextArea
                                            onChange={(e) => setNewProjectDescription(e.target.value)}
                                            placeholder={t('projects.placeholder.description')}
                                            rows={3}
                                            value={newProjectDescription}
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
                                                checked={newProjectIsPublic}
                                                onCheckedChange={setNewProjectIsPublic}
                                            />
                                        </Flex>
                                    </Box>
                                </Flex>
                                <Flex gap="3" justify="end" mt="5">
                                    <Dialog.Close>
                                        <Button color="gray" variant="soft">
                                            {t('projects.button.cancel')}
                                        </Button>
                                    </Dialog.Close>
                                    <Button
                                        color="blue"
                                        disabled={!newProjectName.trim() || createProjectMutation.isPending}
                                        loading={createProjectMutation.isPending}
                                        onClick={handleCreateProject}
                                    >
                                        {createProjectMutation.isPending ? t('projects.status.creating') : t('projects.button.createProject')}
                                    </Button>
                                </Flex>
                            </Dialog.Content>
                        </Dialog.Root>
                    )}
                </Flex>
            </Box>

            {!user && 0 < publicProjects.length && (
                <Box
                    mb="6"
                    p="4"
                    style={{
                        backgroundColor: 'var(--blue-2)',
                        border: '1px solid var(--blue-4)',
                        borderRadius: 'var(--radius-4)',
                    }}
                >
                    <Text size="3">
                        <strong>{t('auth.signIn')}</strong> {t('projects.prompt.signIn')}
                    </Text>
                </Box>
            )}

            {isLoading && (
                <Box py="9" style={{ textAlign: 'center' }}>
                    <Spinner size="3" />
                    <Text color="gray" ml="3">{t('projects.status.loading')}</Text>
                </Box>
            )}

            {!isLoading && (
                <>

                    {user && 0 < userProjects.length && (
                        <Box mb="7">
                            <Heading mb="4" size="5">
                                {t('projects.section.myProjects')}
                            </Heading>
                            <Grid columns={{ initial: '2', lg: '4', md: '3' }} gap="4">
                                {userProjects.map((project) => (
                                    <ProjectCard
                                        isOwner={true}
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        project={project}
                                    />
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {0 < publicProjects.length && (
                        <Box mb="7">
                            <Heading mb="4" size="5">
                                {t('projects.section.publicProjects')}
                            </Heading>
                            <Grid columns={{ initial: '2', lg: '4', md: '3' }} gap="4">
                                {publicProjects.map((project) => (
                                    <ProjectCard
                                        isOwner={project.userId === user?.uid}
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        project={project}
                                    />
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {!user && 0 === publicProjects.length && (
                        <Box
                            style={{
                                backgroundColor: 'white',
                                border: '1px dashed var(--gray-6)',
                                borderRadius: 'var(--radius-4)',
                                padding: '60px 20px',
                                textAlign: 'center',
                            }}
                        >
                            <Heading mb="2" size="5">
                                {t('projects.empty.noPublicProjects')}
                            </Heading>
                            <Text color="gray" mb="4">
                                {t('projects.empty.publicProjectsPrompt')}
                            </Text>
                        </Box>
                    )}

                    {user && 0 === userProjects.length && 0 === publicProjects.length && (
                        <Box
                            style={{
                                backgroundColor: 'white',
                                border: '1px dashed var(--gray-6)',
                                borderRadius: 'var(--radius-4)',
                                padding: '60px 20px',
                                textAlign: 'center',
                            }}
                        >
                            <Heading mb="2" size="5">
                                {t('projects.empty.noProjects')}
                            </Heading>
                            <Text color="gray" mb="4">
                                {t('projects.empty.createFirstPrompt')}
                            </Text>
                            <Button color="blue" onClick={() => setIsCreateDialogOpen(true)}>
                                {t('projects.button.createNew')}
                            </Button>
                        </Box>
                    )}

                </>
            )}
        </AppLayout>
    );
}
