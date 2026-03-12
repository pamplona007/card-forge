import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LikedProject, Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useToggleLike = () => {
    const { likeProject, unlikeProject, user } = useFirebase();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ isLiked, project }: { isLiked: boolean; project: LikedProject | Project }) => {
            if (isLiked) {
                await unlikeProject(project.id);
            } else {
                await likeProject(project);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['likes', user?.uid] });
        },
    });
};
