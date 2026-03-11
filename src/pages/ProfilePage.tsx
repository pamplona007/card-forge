import { Avatar, Box, Button, Callout, Card, Container, Flex, Heading, Separator, Text, TextField } from '@radix-ui/themes';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    updateProfile,
} from 'firebase/auth';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { auth } from '../firebase/config';
import { useFirebase } from '../hooks/useFirebase';
import { resizeToDataUrl } from '../utils/imageUtils';

type StatusMessage = { text: string; type: 'error' | 'success' };

export default function ProfilePage() {
    const { user } = useFirebase();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Profile section state
    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    const [avatarPreview, setAvatarPreview] = useState<null | string>(user?.photoURL ?? null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<null | StatusMessage>(null);

    // Email section state
    const [newEmail, setNewEmail] = useState(user?.email ?? '');
    const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailMessage, setEmailMessage] = useState<null | StatusMessage>(null);

    // Password section state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<null | StatusMessage>(null);

    if (!user) {
        navigate('/');
        return null;
    }

    const initials = (user.displayName || user.email || 'U')
        .split(/[\s@]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0].toUpperCase())
        .join('');

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setAvatarFile(file);
        const preview = await resizeToDataUrl(file, 128);
        setAvatarPreview(preview);
    };

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) {
            return;
        }
        setProfileSaving(true);
        setProfileMessage(null);
        try {
            let photoURL = auth.currentUser.photoURL ?? undefined;
            if (avatarFile) {
                photoURL = await resizeToDataUrl(avatarFile, 128);
            }
            await updateProfile(auth.currentUser, {
                displayName: displayName.trim() || null,
                photoURL: photoURL ?? null,
            });
            setAvatarFile(null);
            setProfileMessage({ text: t('profile.success.profileUpdated'), type: 'success' });
        } catch {
            setProfileMessage({ text: t('profile.error.generic'), type: 'error' });
        } finally {
            setProfileSaving(false);
        }
    };

    const handleUpdateEmail = async (e: FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !user.email) {
            return;
        }
        setEmailSaving(true);
        setEmailMessage(null);
        try {
            const credential = EmailAuthProvider.credential(user.email, emailCurrentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updateEmail(auth.currentUser, newEmail.trim());
            setEmailCurrentPassword('');
            setEmailMessage({ text: t('profile.success.emailUpdated'), type: 'success' });
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? '';
            if (code.includes('wrong-password') || code.includes('invalid-credential')) {
                setEmailMessage({ text: t('auth.error.wrongPassword'), type: 'error' });
            } else if (code.includes('email-already-in-use')) {
                setEmailMessage({ text: t('auth.error.emailInUse'), type: 'error' });
            } else if (code.includes('invalid-email')) {
                setEmailMessage({ text: t('auth.error.invalidEmail'), type: 'error' });
            } else {
                setEmailMessage({ text: t('profile.error.generic'), type: 'error' });
            }
        } finally {
            setEmailSaving(false);
        }
    };

    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !user.email) {
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: t('profile.error.passwordMismatch'), type: 'error' });
            return;
        }
        setPasswordSaving(true);
        setPasswordMessage(null);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordMessage({ text: t('profile.success.passwordUpdated'), type: 'success' });
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? '';
            if (code.includes('wrong-password') || code.includes('invalid-credential')) {
                setPasswordMessage({ text: t('auth.error.wrongPassword'), type: 'error' });
            } else if (code.includes('weak-password')) {
                setPasswordMessage({ text: t('auth.error.weakPassword'), type: 'error' });
            } else {
                setPasswordMessage({ text: t('profile.error.generic'), type: 'error' });
            }
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <Box>
            <Container size="2">
                <Flex direction="column" gap="6" py="6">
                    <Box>
                        <Heading mb="1" size="7">{t('profile.title')}</Heading>
                        <Text color="gray" size="2">{t('profile.description')}</Text>
                    </Box>

                    {/* ── Profile section ── */}
                    <Card>
                        <form onSubmit={handleSaveProfile}>
                            <Flex direction="column" gap="4" p="2">
                                <Heading size="4">{t('profile.section.identity')}</Heading>
                                <Separator size="4" />

                                <Flex align="center" gap="4">
                                    <Box onClick={() => avatarInputRef.current?.click()} style={{ cursor: 'pointer', flexShrink: 0 }}>
                                        {avatarPreview
                                            ? (
                                                <Avatar
                                                    fallback={initials}
                                                    radius="full"
                                                    size="6"
                                                    src={avatarPreview}
                                                    style={{ outline: '2px solid var(--accent-8)' }}
                                                />
                                            )
                                            : (
                                                <Avatar
                                                    fallback={initials}
                                                    radius="full"
                                                    size="6"
                                                    style={{ outline: '2px solid var(--gray-5)' }}
                                                />
                                            )}
                                    </Box>
                                    <Flex direction="column" gap="1">
                                        <Button
                                            onClick={() => avatarInputRef.current?.click()}
                                            size="2"
                                            type="button"
                                            variant="soft"
                                        >
                                            {t('profile.button.uploadPicture')}
                                        </Button>
                                        <Text color="gray" size="1">{t('profile.label.pictureHint')}</Text>
                                    </Flex>
                                    <input
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        ref={avatarInputRef}
                                        style={{ display: 'none' }}
                                        type="file"
                                    />
                                </Flex>

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.displayName')}
                                    </Text>
                                    <TextField.Root
                                        mt="1"
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder={t('profile.placeholder.displayName')}
                                        value={displayName}
                                    />
                                </Box>

                                {profileMessage && (
                                    <Callout.Root color={'success' === profileMessage.type ? 'green' : 'red'} size="1">
                                        <Callout.Text>{profileMessage.text}</Callout.Text>
                                    </Callout.Root>
                                )}

                                <Flex justify="end">
                                    <Button disabled={profileSaving} type="submit">
                                        {profileSaving ? t('auth.loading') : t('profile.button.saveProfile')}
                                    </Button>
                                </Flex>
                            </Flex>
                        </form>
                    </Card>

                    {/* ── Email section ── */}
                    <Card>
                        <form onSubmit={handleUpdateEmail}>
                            <Flex direction="column" gap="4" p="2">
                                <Heading size="4">{t('profile.section.email')}</Heading>
                                <Separator size="4" />

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.newEmail')}
                                    </Text>
                                    <TextField.Root
                                        mt="1"
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder={t('profile.placeholder.email')}
                                        required
                                        type="email"
                                        value={newEmail}
                                    />
                                </Box>

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.currentPassword')}
                                    </Text>
                                    <TextField.Root
                                        autoComplete="current-password"
                                        mt="1"
                                        onChange={(e) => setEmailCurrentPassword(e.target.value)}
                                        placeholder={t('profile.placeholder.currentPassword')}
                                        required
                                        type="password"
                                        value={emailCurrentPassword}
                                    />
                                </Box>

                                {emailMessage && (
                                    <Callout.Root color={'success' === emailMessage.type ? 'green' : 'red'} size="1">
                                        <Callout.Text>{emailMessage.text}</Callout.Text>
                                    </Callout.Root>
                                )}

                                <Flex justify="end">
                                    <Button disabled={emailSaving} type="submit">
                                        {emailSaving ? t('auth.loading') : t('profile.button.saveEmail')}
                                    </Button>
                                </Flex>
                            </Flex>
                        </form>
                    </Card>

                    {/* ── Password section ── */}
                    <Card>
                        <form onSubmit={handleUpdatePassword}>
                            <Flex direction="column" gap="4" p="2">
                                <Heading size="4">{t('profile.section.password')}</Heading>
                                <Separator size="4" />

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.currentPassword')}
                                    </Text>
                                    <TextField.Root
                                        autoComplete="current-password"
                                        mt="1"
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder={t('profile.placeholder.currentPassword')}
                                        required
                                        type="password"
                                        value={currentPassword}
                                    />
                                </Box>

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.newPassword')}
                                    </Text>
                                    <TextField.Root
                                        autoComplete="new-password"
                                        mt="1"
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t('profile.placeholder.newPassword')}
                                        required
                                        type="password"
                                        value={newPassword}
                                    />
                                </Box>

                                <Box>
                                    <Text as="label" mb="1" size="2" weight="bold">
                                        {t('profile.label.confirmPassword')}
                                    </Text>
                                    <TextField.Root
                                        autoComplete="new-password"
                                        mt="1"
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t('profile.placeholder.confirmPassword')}
                                        required
                                        type="password"
                                        value={confirmPassword}
                                    />
                                </Box>

                                {passwordMessage && (
                                    <Callout.Root color={'success' === passwordMessage.type ? 'green' : 'red'} size="1">
                                        <Callout.Text>{passwordMessage.text}</Callout.Text>
                                    </Callout.Root>
                                )}

                                <Flex justify="end">
                                    <Button disabled={passwordSaving} type="submit">
                                        {passwordSaving ? t('auth.loading') : t('profile.button.savePassword')}
                                    </Button>
                                </Flex>
                            </Flex>
                        </form>
                    </Card>
                </Flex>
            </Container>
        </Box>
    );
}
