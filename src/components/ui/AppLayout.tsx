import { Avatar, Box, Button, Container, Dialog, DropdownMenu, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useFirebase } from '../../hooks/useFirebase';

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
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();

    const handleAuth = async () => {
        setIsAuthDialogOpen(true);
    };

    const userInitials = user
        ? (user.displayName || user.email || 'U')
            .split(/[\s@]/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0].toUpperCase())
            .join('')
        : '';

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
                <Container px={'4'} size="4">
                    <Flex align="center" justify="between" py="4">
                        <Heading size="6" style={{ color: 'var(--gray-12)' }} weight="bold">
                            {t('app.title')}
                        </Heading>
                        <Flex align="center" gap="4">
                            {user
                                ? (
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <Button style={{ gap: '8px', paddingInline: '8px' }} variant="ghost">
                                                <Avatar
                                                    fallback={userInitials}
                                                    radius="full"
                                                    size="2"
                                                    src={user.photoURL ?? undefined}
                                                />
                                                <Text size="2" weight="medium">
                                                    {user.displayName || user.email}
                                                </Text>
                                            </Button>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            <DropdownMenu.Label>
                                                <Text color="gray" size="1">{user.email}</Text>
                                            </DropdownMenu.Label>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item onClick={() => navigate(`/user/${user.uid}`)}>
                                                {t('userProfile.nav.myProfile')}
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item onClick={() => navigate('/profile')}>
                                                {t('profile.nav.myProfile')}
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Sub>
                                                <DropdownMenu.SubTrigger>
                                                    {t('app.language')}
                                                </DropdownMenu.SubTrigger>
                                                <DropdownMenu.SubContent>
                                                    <DropdownMenu.Item onClick={() => i18n.changeLanguage('en')}>
                                                        <Flex align="center" gap="2">
                                                            <Text>EN</Text>
                                                            {'en' === (i18n.language || i18n.resolvedLanguage) && <Text color="blue">✓</Text>}
                                                        </Flex>
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Item onClick={() => i18n.changeLanguage('pt-BR')}>
                                                        <Flex align="center" gap="2">
                                                            <Text>PT</Text>
                                                            {'pt-BR' === (i18n.language || i18n.resolvedLanguage) && <Text color="blue">✓</Text>}
                                                        </Flex>
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.SubContent>
                                            </DropdownMenu.Sub>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item color="red" onClick={logOut}>
                                                {t('auth.signOut')}
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                )
                                : (
                                    <Button color="blue" onClick={handleAuth} variant="solid">
                                        {t('auth.signIn')}
                                    </Button>
                                )}
                        </Flex>
                    </Flex>
                </Container>
            </header>

            <Box py="6">
                <Container p={'4'} size="4">
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
