export const resizeToDataUrl = (
    file: File,
    maxSize: number = 800,
    quality: number = 0.85,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get 2d context'));
                return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasTransparency = data.some((_, i) => 3 === i % 4 && 255 > data[i]);

            resolve(hasTransparency
                ? canvas.toDataURL('image/png')
                : canvas.toDataURL('image/jpeg', quality));
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = objectUrl;
    });
};
