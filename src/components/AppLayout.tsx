import { Box, Button, Container, Dialog, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFirebase } from '../hooks/useFirebase';
import LanguageSwitcher from './LanguageSwitcher';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { logOut, signIn, signUp, user } = useFirebase();
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handleAuth = async () => {
        if (user) {
            await logOut();
        } else {
            setIsAuthDialogOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log(`[Auth] Attempting to ${isSignUp ? 'sign up' : 'sign in'} with email:`, email);

            if (isSignUp) {
                await signUp(email, password);
                console.log('[Auth] Sign up successful');
            } else {
                await signIn(email, password);
                console.log('[Auth] Sign in successful');
            }

            setIsAuthDialogOpen(false);
            setEmail('');
            setPassword('');
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            console.error('[Auth] Error:', error.code, error.message);
            setError(getAuthErrorMessage(error.code || error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const getAuthErrorMessage = (code: string): string => {
        if (code.includes('auth/invalid-email')) {
            return t('auth.error.invalidEmail');
        }
        if (code.includes('auth/user-disabled')) {
            return t('auth.error.userDisabled');
        }
        if (code.includes('auth/user-not-found')) {
            return t('auth.error.userNotFound');
        }
        if (code.includes('auth/wrong-password')) {
            return t('auth.error.wrongPassword');
        }
        if (code.includes('auth/email-already-in-use')) {
            return t('auth.error.emailInUse');
        }
        if (code.includes('auth/weak-password')) {
            return t('auth.error.weakPassword');
        }
        if (code.includes('auth/invalid-credential')) {
            return t('auth.error.invalidCredential');
        }
        if (code.includes('auth/network-request-failed')) {
            return t('auth.error.networkFailed');
        }
        return t('auth.error.generic');
    };

    const buttonText = isSignUp ? t('auth.dialog.createAccount') : t('auth.dialog.signIn');

    return (
        <Box style={{ backgroundColor: 'var(--gray-2)', minHeight: '100vh' }}>

            <header
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--gray-5)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Container size="4">
                    <Flex align="center" justify="between" px="2" py="4">
                        <Heading size="6" style={{ color: 'var(--gray-12)' }} weight="bold">
                            {t('app.title')}
                        </Heading>
                        <Flex align="center" gap="4">
                            <LanguageSwitcher />
                            <Button
                                color={user ? undefined : 'blue'}
                                onClick={handleAuth}
                                variant={user ? 'soft' : 'solid'}
                            >
                                {user ? `${t('auth.signOut')} (${user.displayName || user.email || 'User'})` : t('auth.signIn')}
                            </Button>
                        </Flex>
                    </Flex>
                </Container>
            </header>

            <Box py="6">
                <Container size="4">
                    {children}
                </Container>
            </Box>

            <Dialog.Root onOpenChange={setIsAuthDialogOpen} open={isAuthDialogOpen}>
                <Dialog.Content style={{ maxWidth: 400 }}>
                    <Dialog.Title>{isSignUp ? t('auth.dialog.createAccount') : t('auth.dialog.signIn')}</Dialog.Title>
                    <Dialog.Description mb="4" size="2">
                        {isSignUp
                            ? t('auth.dialog.createDescription')
                            : t('auth.dialog.signInDescription')}
                    </Dialog.Description>

                    <form onSubmit={handleSubmit}>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" mb="1" size="2" weight="bold">
                                    {t('auth.label.email')}
                                </Text>
                                <TextField.Root
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.placeholder.email')}
                                    required
                                    type="email"
                                    value={email}
                                />
                            </Box>

                            <Box>
                                <Text as="label" mb="1" size="2" weight="bold">
                                    {t('auth.label.password')}
                                </Text>
                                <TextField.Root
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.placeholder.password')}
                                    required
                                    type="password"
                                    value={password}
                                />
                            </Box>

                            {error && (
                                <Text color="red" size="2">
                                    {error}
                                </Text>
                            )}

                            <Flex gap="3" mt="4">
                                <Button disabled={loading} style={{ flex: 1 }} type="submit">
                                    {loading ? t('auth.loading') : buttonText}
                                </Button>
                            </Flex>
                        </Flex>
                    </form>

                    <Flex justify="center" mt="4">
                        <Text size="2">
                            {isSignUp ? t('auth.link.alreadyHaveAccount') : t('auth.link.dontHaveAccount')}{' '}
                            <Text
                                as="span"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError('');
                                }}
                                style={{ color: 'var(--blue-9)', cursor: 'pointer' }}
                            >
                                {isSignUp ? t('auth.dialog.signIn') : t('auth.dialog.createAccount')}
                            </Text>
                        </Text>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </Box>
    );
}
