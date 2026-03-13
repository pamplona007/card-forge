import { IconButton, Tooltip } from '@radix-ui/themes';
import { useUserLikes } from 'hooks/useUserLikes';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { LikedProject, Project } from '../../firebase/context';

import { useFirebase } from '../../hooks/useFirebase';
import { useToggleLike } from '../../hooks/useToggleLike';

interface LikeButtonProps {
  project: LikedProject | Project;
  size?: '1' | '2' | '3';
}

export default function LikeButton({ project, size = '2' }: LikeButtonProps) {
    const { user } = useFirebase();
    const { data: likedProjects } = useUserLikes(user?.uid);
    const toggleLikeMutation = useToggleLike();
    const { t } = useTranslation();

    if (!user) {
        return null;
    }

    const isLiked = likedProjects?.some((lp) => lp.projectId === project.id) ?? false;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLikeMutation.mutate({ isLiked, project });
    };

    return (
        <Tooltip content={isLiked ? t('likes.button.unlike') : t('likes.button.like')}>
            <IconButton
                color={isLiked ? 'red' : 'gray'}
                disabled={toggleLikeMutation.isPending}
                onClick={handleToggle}
                size={size}
                variant="ghost"
            >
                <Heart
                    color={isLiked ? 'currentColor' : '#ddd'}
                    fill={isLiked ? 'currentColor' : 'none'}
                    size={16}
                    strokeWidth={2}
                />
            </IconButton>
        </Tooltip>
    );
}
