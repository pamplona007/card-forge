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
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react';

import type { ZombicideCardData } from '../components/editors/zombicide/ZombicideCardEditor';

import { auth, db } from '../firebase/config';

export type LikedProject = {
  description: string;
  gameId: string;
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
  name: string;
  updatedAt: Date;
  userId: string;
};

type FirebaseContextType = {
  createProject: (project: Omit<Project, 'createdAt' | 'id' | 'updatedAt'>) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchLikedProjects: () => Promise<LikedProject[]>;
  fetchProjectById: (projectId: string) => Promise<null | Project>;
  fetchPublicProjectsByGame: (gameId: string) => Promise<Project[]>;
  fetchUserProjectsByGame: (gameId: string) => Promise<Project[]>;
  likeProject: (project: Project) => Promise<void>;
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
    fetchLikedProjects: async () => [],
    fetchProjectById: async () => null,
    fetchPublicProjectsByGame: async () => [],
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

    const likeProject = async (project: Project): Promise<void> => {
        if (!user) {
            throw new Error('User not authenticated');
        }
        try {
            const likeRef = doc(db, 'users', user.uid, 'likes', project.id);
            await setDoc(likeRef, {
                description: project.description,
                gameId: project.gameId,
                isPublic: project.isPublic,
                likedAt: serverTimestamp(),
                name: project.name,
                projectId: project.id,
                updatedAt: project.updatedAt,
                userId: project.userId,
            });
            queryClient.invalidateQueries({ queryKey: ['likes'] });
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
            await deleteDoc(doc(db, 'users', user.uid, 'likes', projectId));
            queryClient.invalidateQueries({ queryKey: ['likes'] });
        } catch (error) {
            console.error('Error unliking project:', error);
            throw error;
        }
    };

    const fetchLikedProjects = async (): Promise<LikedProject[]> => {
        if (!user) {
            return [];
        }
        try {
            const snap = await getDocs(collection(db, 'users', user.uid, 'likes'));
            return snap.docs.map((d) => {
                const data = d.data();
                return {
                    description: data.description ?? '',
                    gameId: data.gameId ?? '',
                    isPublic: data.isPublic ?? true,
                    likedAt: data.likedAt?.toDate ? data.likedAt.toDate() : new Date(),
                    name: data.name ?? '',
                    projectId: d.id,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId ?? '',
                };
            });
        } catch (error) {
            console.error('Error fetching liked projects:', error);
            return [];
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
            const projectsData: Project[] = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    cards: [],
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || gameId,
                    id: doc.id,
                    isPublic: data.isPublic ?? true,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId || '',
                };
            });
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
            const projectsData: Project[] = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    cards: [],
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || gameId,
                    id: doc.id,
                    isPublic: data.isPublic ?? false,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: user.uid,
                };
            });
            return projectsData;
        } catch (error) {
            console.error('Error fetching user projects:', error);
            return [];
        }
    };

    const fetchProjectById = useCallback(async (projectId: string): Promise<null | Project> => {
        if (!user) {
            return null;
        }

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
                name: data.name,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                userId: data.userId || '',
            };
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    }, [user]);

    const contextValue: FirebaseContextType = {
        createProject,
        deleteProject,
        fetchLikedProjects,
        fetchProjectById,
        fetchPublicProjectsByGame,
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
