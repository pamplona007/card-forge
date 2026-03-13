import { useQueryClient } from '@tanstack/react-query';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react';

import type { ZombicideCardData } from '../games/zombicide/editors/ZombicideCardEditor';

import { auth, db } from './config';

export type LikedProject = {
  cards: ZombicideCardData[];
  description: string;
  gameId: string;
  id: string;
  isPublic: boolean;
  likedAt: Date;
  name: string;
  projectId: string;
  updatedAt: Date;
  userId: string;
};

export type Project = {
  cards: ZombicideCardData[];
  createdAt: Date;
  description: string;
  gameId: string;
  id: string;
  isPublic: boolean;
  likesCount?: number;
  name: string;
  remixedFrom?: string;
  updatedAt: Date;
  userId: string;
};

type FirebaseContextType = {
  createProject: (project: Omit<Project, 'createdAt' | 'id' | 'updatedAt'>) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchPopularProjectsByGame: (gameId: string, days: number) => Promise<Project[]>;
  fetchProjectById: (projectId: string) => Promise<null | Project>;
  fetchProjectsByUser: (userId: string) => Promise<Project[]>;
  fetchPublicProjectsByGame: (gameId: string) => Promise<Project[]>;
  fetchUserLikes: (userId: string) => Promise<LikedProject[]>;
  fetchUserProjectsByGame: (gameId: string) => Promise<Project[]>;
  likeProject: (project: LikedProject | Project) => Promise<void>;
  loading: boolean;
  logOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  unlikeProject: (projectId: string) => Promise<void>;
  updateCard: (projectId: string, card: ZombicideCardData) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  user: null | User;
};

export const FirebaseContext = createContext<FirebaseContextType>({
    createProject: async () => '',
    deleteProject: async () => {},
    fetchPopularProjectsByGame: async () => [],
    fetchProjectById: async () => null,
    fetchProjectsByUser: async () => [],
    fetchPublicProjectsByGame: async () => [],
    fetchUserLikes: async () => [],
    fetchUserProjectsByGame: async () => [],
    likeProject: async () => {},
    loading: true,
    logOut: async () => {},
    signIn: async () => {},
    signUp: async () => {},
    unlikeProject: async () => {},
    updateCard: async () => {},
    updateProject: async () => {},
    user: null,
});

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<null | User>(null);
    const [loading, setLoading] = useState(true);

    const queryClient = useQueryClient();

    useEffect(() => {
        console.log('[FirebaseContext] Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                console.log('[FirebaseContext] User authenticated:', currentUser.uid, currentUser.email);

                queryClient.clear();
            } else {
                console.log('[FirebaseContext] User not authenticated');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [queryClient]);

    const signIn = async (email: string, password: string) => {
        try {
            console.log('[FirebaseContext] Attempting sign in with:', email);
            await signInWithEmailAndPassword(auth, email, password);
            console.log('[FirebaseContext] Sign in successful for:', email);
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('[FirebaseContext] Sign in error:', err.code, err.message);
            throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            console.log('[FirebaseContext] Attempting sign up with:', email);
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('[FirebaseContext] Sign up successful for:', email);
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('[FirebaseContext] Sign up error:', err.code, err.message);
            throw error;
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const createProject = async (project: Omit<Project, 'createdAt' | 'id' | 'updatedAt'>): Promise<string> => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const now = new Date();
            const { cards, ...projectMetadata } = project;
            const docRef = await addDoc(
                collection(db, 'projects'),
                { ...projectMetadata, createdAt: now, updatedAt: now, userId: user.uid },
            );

            if (cards && 0 < cards.length) {
                const batch = writeBatch(db);
                for (const card of cards) {
                    const cardRef = doc(db, 'projects', docRef.id, 'cards', card.id);
                    batch.set(cardRef, card);
                }
                await batch.commit();
            }

            queryClient.invalidateQueries({ queryKey: ['projects'] });
            return docRef.id;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const updateCard = async (projectId: string, card: ZombicideCardData): Promise<void> => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const batch = writeBatch(db);
            batch.set(
                doc(db, 'projects', projectId, 'cards', card.id),
                card,
            );
            batch.update(
                doc(db, 'projects', projectId),
                { updatedAt: new Date() },
            );
            await batch.commit();
        } catch (error) {
            console.error('Error updating card:', error);
            throw error;
        }
    };

    const updateProject = async (project: Project) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const { cards, ...projectMetadata } = project;
            const projectRef = doc(db, 'projects', project.id);
            await updateDoc(projectRef, { ...projectMetadata, updatedAt: new Date() });

            const cardsRef = collection(db, 'projects', project.id, 'cards');
            const existingSnap = await getDocs(cardsRef);
            const existingIds = new Set(existingSnap.docs.map((d) => d.id));
            const currentIds = new Set(cards.map((c) => c.id));

            const batch = writeBatch(db);
            for (const card of cards) {
                const cardRef = doc(db, 'projects', project.id, 'cards', card.id);
                batch.set(cardRef, card);
            }
            for (const existingId of existingIds) {
                if (!currentIds.has(existingId)) {
                    batch.delete(doc(db, 'projects', project.id, 'cards', existingId));
                }
            }
            await batch.commit();

            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    const likeProject = async (project: LikedProject | Project): Promise<void> => {
        if (!user) {
            throw new Error('User not authenticated');
        }
        try {
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', user.uid, 'likes', project.id), {
                description: project.description,
                gameId: project.gameId,
                isPublic: project.isPublic,
                likedAt: serverTimestamp(),
                name: project.name,
                updatedAt: project.updatedAt,
                userId: project.userId,
            });
            batch.set(doc(db, 'likes', `${project.id}_${user.uid}`), {
                gameId: project.gameId,
                likedAt: serverTimestamp(),
                projectId: project.id,
                userId: user.uid,
            });
            batch.update(doc(db, 'projects', project.id), {
                likesCount: increment(1),
            });
            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['likes', user.uid] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) {
            console.error('Error liking project:', error);
            throw error;
        }
    };

    const unlikeProject = async (projectId: string): Promise<void> => {
        if (!user) {
            throw new Error('User not authenticated');
        }
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', user.uid, 'likes', projectId));
            batch.delete(doc(db, 'likes', `${projectId}_${user.uid}`));
            batch.update(doc(db, 'projects', projectId), {
                likesCount: increment(-1),
            });
            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['likes'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) {
            console.error('Error unliking project:', error);
            throw error;
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const cardsRef = collection(db, 'projects', projectId, 'cards');
            const cardsSnap = await getDocs(cardsRef);
            if (0 < cardsSnap.size) {
                const batch = writeBatch(db);
                cardsSnap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }

            const projectRef = doc(db, 'projects', projectId);
            await deleteDoc(projectRef);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    const fetchPublicProjectsByGame = async (gameId: string): Promise<Project[]> => {
        try {
            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, where('gameId', '==', gameId), where('isPublic', '==', true));
            const querySnapshot = await getDocs(q);
            const projectsData: Project[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const cardsSnap = await getDocs(collection(db, 'projects', doc.id, 'cards'));
                const cards = cardsSnap.docs.slice(0, 5).map((d) => d.data() as ZombicideCardData);
                return {
                    cards,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || gameId,
                    id: doc.id,
                    isPublic: data.isPublic ?? true,
                    likesCount: data.likesCount ?? 0,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId || '',
                };
            }));
            return projectsData;
        } catch (error) {
            console.error('Error fetching public projects:', error);
            return [];
        }
    };

    const fetchUserProjectsByGame = async (gameId: string): Promise<Project[]> => {
        if (!user) {
            return [];
        }

        try {
            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, where('gameId', '==', gameId), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const projectsData: Project[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const cardsSnap = await getDocs(collection(db, 'projects', doc.id, 'cards'));
                const cards = cardsSnap.docs.slice(0, 5).map((d) => d.data() as ZombicideCardData);
                return {
                    cards: cards,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || gameId,
                    id: doc.id,
                    isPublic: data.isPublic ?? false,
                    likesCount: data.likesCount ?? 0,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: user.uid,
                };
            }));
            return projectsData;
        } catch (error) {
            console.error('Error fetching user projects:', error);
            return [];
        }
    };

    const fetchProjectsByUser = async (userId: string): Promise<Project[]> => {
        try {
            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            return Promise.all(querySnapshot.docs.map(async (d) => {
                const data = d.data();
                const cardsSnap = await getDocs(collection(db, 'projects', d.id, 'cards'));
                const cards = cardsSnap.docs.slice(0, 5).map((c) => c.data() as ZombicideCardData);
                return {
                    cards,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || '',
                    id: d.id,
                    isPublic: data.isPublic ?? false,
                    likesCount: data.likesCount ?? 0,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId || '',
                };
            }));
        } catch (error) {
            console.error('Error fetching projects by user:', error);
            return [];
        }
    };

    const fetchUserLikes = async (userId: string): Promise<LikedProject[]> => {
        try {
            const snap = await getDocs(collection(db, 'users', userId, 'likes'));
            return Promise.all(snap.docs.map(async (d) => {
                const data = d.data();
                const cardsSnap = await getDocs(collection(db, 'projects', d.id, 'cards'));
                const cards = cardsSnap.docs.slice(0, 5).map((c) => c.data() as ZombicideCardData);

                return {
                    cards: cards,
                    createdAt: data.likedAt?.toDate ? data.likedAt.toDate() : new Date(),
                    description: data.description ?? '',
                    gameId: data.gameId ?? '',
                    id: d.id,
                    isPublic: data.isPublic ?? true,
                    likedAt: data.likedAt?.toDate ? data.likedAt.toDate() : new Date(),
                    name: data.name ?? '',
                    projectId: d.id,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId ?? '',
                };
            }));
        } catch (error) {
            console.error('Error fetching user likes:', error);
            return [];
        }
    };

    const fetchPopularProjectsByGame = async (gameId: string, days: number): Promise<Project[]> => {
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            const snap = await getDocs(query(
                collection(db, 'likes'),
                where('gameId', '==', gameId),
                where('likedAt', '>=', cutoff),
            ));

            const countMap = new Map<string, number>();
            snap.docs.forEach((d) => {
                const projectId = d.data().projectId as string;
                countMap.set(projectId, (countMap.get(projectId) || 0) + 1);
            });

            if (0 === countMap.size) {
                return [];
            }

            const sortedIds = [...countMap.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([id]) => id);

            const projects = await Promise.all(
                sortedIds.map(async (projectId) => {
                    const projectSnap = await getDoc(doc(db, 'projects', projectId));
                    if (!projectSnap.exists()) {
                        return null;
                    }
                    const data = projectSnap.data();
                    if (!data.isPublic || data.gameId !== gameId) {
                        return null;
                    }
                    const cardsSnap = await getDocs(collection(db, 'projects', projectId, 'cards'));
                    const cards = cardsSnap.docs.slice(0, 5).map((d) => d.data() as ZombicideCardData);
                    return {
                        cards,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                        description: data.description,
                        gameId: data.gameId,
                        id: projectId,
                        isPublic: true,
                        likesCount: data.likesCount ?? 0,
                        name: data.name,
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                        userId: data.userId || '',
                    } as Project;
                }),
            );

            return projects.filter((p): p is Project => null !== p);
        } catch (error) {
            console.error('Error fetching popular projects:', error);
            return [];
        }
    };

    const fetchProjectById = useCallback(async (projectId: string): Promise<null | Project> => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                return null;
            }

            const data = projectSnap.data();
            const cardsSnap = await getDocs(collection(db, 'projects', projectId, 'cards'));
            const cards = cardsSnap.docs.map((d) => d.data() as ZombicideCardData);

            return {
                cards,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                description: data.description,
                gameId: data.gameId || '',
                id: projectSnap.id,
                isPublic: data.isPublic ?? false,
                likesCount: data.likesCount ?? 0,
                name: data.name,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                userId: data.userId || '',
            };
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    }, []);

    const contextValue: FirebaseContextType = {
        createProject,
        deleteProject,
        fetchPopularProjectsByGame,
        fetchProjectById,
        fetchProjectsByUser,
        fetchPublicProjectsByGame,
        fetchUserLikes,
        fetchUserProjectsByGame,
        likeProject,
        loading,
        logOut,
        signIn,
        signUp,
        unlikeProject,
        updateCard,
        updateProject,
        user,
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
};
