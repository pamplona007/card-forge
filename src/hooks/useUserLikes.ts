import type { LikedProject } from 'firebase/context';

import { useQuery } from '@tanstack/react-query';

import { useFirebase } from './useFirebase';

export const useUserLikes = (userId?: string) => {
    const { fetchUserLikes } = useFirebase();

    return useQuery<LikedProject[]>({
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) {
                return [];
            }
            return fetchUserLikes(userId);
        },
        queryKey: ['userLikes', userId],
    });
};
