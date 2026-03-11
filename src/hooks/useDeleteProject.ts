import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useFirebase } from './useFirebase';

export const useDeleteProject = () => {
    const { deleteProject } = useFirebase();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: string) => {
            return deleteProject(projectId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};
