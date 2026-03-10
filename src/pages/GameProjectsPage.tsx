import { Box, Button, Card, Dialog, Flex, Grid, Heading, Spinner, Text, TextField } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import type { Project } from '../contexts/FirebaseContext';

import AppLayout from '../components/AppLayout';
import { useFirebase } from '../hooks/useFirebase';
import { getGameById } from '../types/game';

interface ProjectCardProps {
  isOwner: boolean;
  onClick: () => void;
  project: Project;
}

export default function GameProjectsPage() {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { createProject, fetchPublicProjectsByGame, fetchUserProjectsByGame, user } = useFirebase();
    const { t } = useTranslation();

    const [game] = useState(getGameById(gameId || ''));
    const [publicProjects, setPublicProjects] = useState<Project[]>([]);
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!gameId) {
                return;
            }

            setLoading(true);
            try {
                const publicData = await fetchPublicProjectsByGame(gameId);
                setPublicProjects(publicData);

                if (user) {
                    const userData = await fetchUserProjectsByGame(gameId);
                    setUserProjects(userData);
                } else {
                    setUserProjects([]);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [gameId, user, fetchPublicProjectsByGame, fetchUserProjectsByGame]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !user || !gameId) {
            return;
        }

        setIsCreating(true);
        try {
            const projectId = await createProject({
                description: '',
                gameId,
                isPublic: false,
                name: newProjectName.trim(),
                userId: user.uid,
            });

            navigate(`/project/${projectId}`);
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setIsCreating(false);
            setIsCreateDialogOpen(false);
            setNewProjectName('');
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
                <Flex align="center" justify="between" mb="4">
                    <Box>
                        <Heading mb="2" size="8">
                            {game.name}
                        </Heading>
                        <Text color="gray" size="4">
                            {t('projects.label.publishedBy', { publisher: game.publisher })}
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
                                <Flex direction="column" gap="3">
                                    <label>
                                        <Text as="span" mb="1" size="2" style={{ display: 'block' }}>
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
                                    </label>
                                </Flex>
                                <Flex gap="3" justify="end" mt="5">
                                    <Dialog.Close>
                                        <Button color="gray" variant="soft">
                                            {t('projects.button.cancel')}
                                        </Button>
                                    </Dialog.Close>
                                    <Button
                                        color="blue"
                                        disabled={!newProjectName.trim() || isCreating}
                                        onClick={handleCreateProject}
                                    >
                                        {isCreating ? t('projects.status.creating') : t('projects.button.createProject')}
                                    </Button>
                                </Flex>
                            </Dialog.Content>
                        </Dialog.Root>
                    )}
                </Flex>
                <Text size="4" style={{ display: 'block', lineHeight: 1.6 }}>
                    {game.description}
                </Text>
            </Box>

            {loading && (
                <Box py="9" style={{ textAlign: 'center' }}>
                    <Spinner size="3" />
                    <Text color="gray" ml="3">{t('projects.status.loading')}</Text>
                </Box>
            )}

            {!loading && (
                <>

                    {user && 0 < userProjects.length && (
                        <Box mb="7">
                            <Heading mb="4" size="5">
                                {t('projects.section.myProjects')}
                            </Heading>
                            <Grid columns={{ initial: '1', lg: '4', md: '3', sm: '2' }} gap="4">
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
                            <Grid columns={{ initial: '1', lg: '4', md: '3', sm: '2' }} gap="4">
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
                                <strong>Sign in</strong> {t('projects.prompt.signIn')}
                            </Text>
                        </Box>
                    )}
                </>
            )}
        </AppLayout>
    );
}

function ProjectCard({ isOwner, onClick, project }: ProjectCardProps) {
    const { t } = useTranslation();
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Card
            className="project-card"
            onClick={onClick}
            size="2"
            style={{
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
        >
            <Box
                style={{
                    alignItems: 'center',
                    backgroundColor: 'var(--gray-4)',
                    borderRadius: 'var(--radius-2)',
                    display: 'flex',
                    height: '100px',
                    justifyContent: 'center',
                    marginBottom: '12px',
                }}
            >
                <Text color="gray" size="6">
                    {project.name.charAt(0).toUpperCase()}
                </Text>
            </Box>
            <Flex align="center" justify="between" mb="1">
                <Heading size="3" trim="both">
                    {project.name}
                </Heading>
                {isOwner && (
                    <Text color="blue" size="1">
                        {t('projects.card.yours')}
                    </Text>
                )}
            </Flex>
            {project.description && (
                <Text color="gray" mb="2" size="2" style={{ display: 'block', lineHeight: 1.4 }}>
                    {project.description}
                </Text>
            )}
            <Text color="gray" size="1">
                {t('projects.card.updated', { date: formatDate(project.updatedAt) })}
            </Text>
        </Card>
    );
}
