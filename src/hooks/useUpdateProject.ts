import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Project } from '../contexts/FirebaseContext';

import { useFirebase } from './useFirebase';

export const useUpdateProject = () => {
    const { updateProject } = useFirebase();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (project: Project) => {
            return updateProject(project);
        },
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['projects', variables.id], variables);
            queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
        },
    });
};
