import { Box, Spinner, Text } from '@radix-ui/themes';
import ProjectOwnerView from 'components/editor/ProjectOwnerView';
import ProjectViewerView from 'components/editor/ProjectViewerView';
import AppLayout from 'components/ui/AppLayout';
import { useFirebase } from 'hooks/useFirebase';
import { useProject } from 'hooks/useProject';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function CardEditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useFirebase();
    const { data: project, isLoading } = useProject(projectId);
    const { t } = useTranslation();

    return (
        <AppLayout>
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
