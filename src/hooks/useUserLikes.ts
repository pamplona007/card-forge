import { useQuery } from '@tanstack/react-query';

import type { FetchUserLikesOptions, LikedProject } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useUserLikes = (userId?: string, options?: FetchUserLikesOptions) => {
    const { fetchUserLikes } = useFirebase();

    return useQuery<LikedProject[]>({
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) {
                return [];
            }
            return fetchUserLikes(userId, options);
        },
        queryKey: ['likes', userId, options],
    });
};
