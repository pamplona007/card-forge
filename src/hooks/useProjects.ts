import { useQuery } from '@tanstack/react-query';

import type { Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useProjects = (gameId: string | undefined) => {
    const { fetchPublicProjectsByGame, fetchUserProjectsByGame, user } = useFirebase();

    return useQuery<{ publicProjects: Project[]; userProjects: Project[] }>({
        enabled: !!gameId,
        queryFn: async () => {
            if (!gameId) {
                return { publicProjects: [], userProjects: [] };
            }

            const publicData = await fetchPublicProjectsByGame(gameId);
            const userData = user ? await fetchUserProjectsByGame(gameId) : [];

            return {
                publicProjects: publicData,
                userProjects: userData,
            };
        },
        queryKey: ['projects', gameId, user?.uid],
    });
};
