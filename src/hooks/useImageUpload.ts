import { useMutation } from '@tanstack/react-query';

import { useFirebase } from './useFirebase';

type UploadImageInput = {
    file: File;
    path: string;
};

export const useImageUpload = () => {
    const { uploadImage } = useFirebase();

    return useMutation({
        mutationFn: async ({ file, path }: UploadImageInput) => {
            return uploadImage(file, path);
        },
    });
};
