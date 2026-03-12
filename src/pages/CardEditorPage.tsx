import { Box, Button, Spinner, Text } from '@radix-ui/themes';
import ProjectOwnerView from 'components/editor/ProjectOwnerView';
import ProjectViewerView from 'components/editor/ProjectViewerView';
import AppLayout from 'components/ui/AppLayout';
import { useFirebase } from 'hooks/useFirebase';
import { useProject } from 'hooks/useProject';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

export default function CardEditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useFirebase();
    const { data: project, isLoading } = useProject(projectId);
    const { t } = useTranslation();

    return (
        <AppLayout>
            <Box mb={'3'}>
                <Link style={{ textDecoration: 'none' }} to={`/game/${project?.gameId}`}>
                    <Button color="blue" size="2" variant='ghost'>
                        {t('editor.backToProjects')}
                    </Button>
                </Link>
            </Box>

            {isLoading
                ? (
                    <Box py="9" style={{ textAlign: 'center' }}>
                        <Spinner size="3" />
                        <Text color="gray" ml="3">{t('projects.status.loading')}</Text>
                    </Box>
                )
                : project && projectId && (
                    user?.uid === project.userId
                        ? <ProjectOwnerView initialProject={project} projectId={projectId} />
                        : <ProjectViewerView project={project} />
                )}
        </AppLayout>
    );
}
