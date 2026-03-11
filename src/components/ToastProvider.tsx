import { Toaster } from 'sonner';

export default function ToastProvider() {
    return (
        <Toaster
            closeButton
            position="bottom-right"
            richColors
        />
    );
}
