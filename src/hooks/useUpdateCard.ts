import { useMutation } from '@tanstack/react-query';

import type { ZombicideCardData } from '../components/editors/zombicide/ZombicideCardEditor';

import { useFirebase } from './useFirebase';

type UpdateCardInput = {
    card: ZombicideCardData;
    projectId: string;
};

export const useUpdateCard = () => {
    const { updateCard } = useFirebase();

    return useMutation({
        mutationFn: async ({ card, projectId }: UpdateCardInput) => {
            return updateCard(projectId, card);
        },
    });
};
