import { useQuery } from '@tanstack/react-query';

import type { LikedProject } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useLikes = () => {
    const { fetchLikedProjects, user } = useFirebase();

    return useQuery<LikedProject[]>({
        enabled: !!user,
        queryFn: () => fetchLikedProjects(),
        queryKey: ['likes', user?.uid],
    });
};
