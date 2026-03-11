import { IconButton, Tooltip } from '@radix-ui/themes';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { Project } from '../contexts/FirebaseContext';

import { useLikes } from '../hooks/useLikes';
import { useFirebase } from '../hooks/useFirebase';
import { useToggleLike } from '../hooks/useToggleLike';

interface LikeButtonProps {
  project: Project;
  size?: '1' | '2' | '3';
}

export default function LikeButton({ project, size = '2' }: LikeButtonProps) {
    const { user } = useFirebase();
    const { data: likedProjects } = useLikes();
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
                    fill={isLiked ? 'currentColor' : 'none'}
                    size={16}
                    strokeWidth={2}
                />
            </IconButton>
        </Tooltip>
    );
}
