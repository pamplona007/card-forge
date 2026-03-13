import { useQuery } from '@tanstack/react-query';

import type { Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const usePopularProjects = (gameId: string | undefined, days: number, enabled: boolean) => {
    const { fetchPopularProjectsByGame } = useFirebase();

    return useQuery<Project[]>({
        enabled: !!gameId && enabled,
        queryFn: () => fetchPopularProjectsByGame(gameId!, days),
        queryKey: ['popularProjects', gameId, days],
    });
};
