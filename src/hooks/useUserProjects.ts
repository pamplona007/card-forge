import { useQuery } from '@tanstack/react-query';

import type { Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useUserProjects = (userId?: string) => {
    const { fetchProjectsByUser } = useFirebase();

    return useQuery<Project[]>({
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) {
                return [];
            }
            return fetchProjectsByUser(userId);
        },
        queryKey: ['userProjects', userId],
    });
};
