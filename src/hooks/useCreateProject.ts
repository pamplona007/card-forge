import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Project } from '../contexts/FirebaseContext';

import { useFirebase } from './useFirebase';

type CreateProjectInput = Omit<Project, 'createdAt' | 'id' | 'updatedAt'>;

export const useCreateProject = () => {
    const { createProject } = useFirebase();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (project: CreateProjectInput) => {
            return createProject(project);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};
