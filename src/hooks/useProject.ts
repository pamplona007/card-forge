import { useQuery } from '@tanstack/react-query';

import type { Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useProject = (projectId?: string) => {
    const { fetchProjectById } = useFirebase();

    return useQuery<null | Project>({
        enabled: !!projectId,
        queryFn: async () => {
            if (!projectId) {
                return null;
            }
            return fetchProjectById(projectId);
        },
        queryKey: ['projects', projectId],
    });
};
