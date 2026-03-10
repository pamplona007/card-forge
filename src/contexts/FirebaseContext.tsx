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
    updateDoc,
    where,
} from 'firebase/firestore';
import {
    getDownloadURL,
    ref,
    uploadBytes,
} from 'firebase/storage';
import { createContext, type ReactNode, useEffect, useState } from 'react';

import { auth, db, storage } from '../firebase/config';

export type Project = {
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
  fetchProjectById: (projectId: string) => Promise<null | Project>;
  fetchPublicProjectsByGame: (gameId: string) => Promise<Project[]>;
  fetchUserProjectsByGame: (gameId: string) => Promise<Project[]>;
  loading: boolean;
  logOut: () => Promise<void>;
  projects: Project[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
  user: null | User;
};

// eslint-disable-next-line react-refresh/only-export-components
export const FirebaseContext = createContext<FirebaseContextType>({
    createProject: async () => '',
    deleteProject: async () => {},
    fetchProjectById: async () => null,
    fetchPublicProjectsByGame: async () => [],
    fetchUserProjectsByGame: async () => [],
    loading: true,
    logOut: async () => {},
    projects: [],
    signIn: async () => {},
    signUp: async () => {},
    updateProject: async () => {},
    uploadImage: async () => '',
    user: null,
});

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<null | User>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async (userId: string) => {
        try {
            const projectsRef = collection(db, 'users', userId, 'projects');
            const querySnapshot = await getDocs(projectsRef);
            const projectsData: Project[] = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
                updatedAt: doc.data().updatedAt.toDate(),
            })) as Project[];
            setProjects(projectsData);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    useEffect(() => {
        console.log('[FirebaseContext] Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                console.log('[FirebaseContext] User authenticated:', currentUser.uid, currentUser.email);

                await fetchProjects(currentUser.uid);
            } else {
                console.log('[FirebaseContext] User not authenticated');
                setProjects([]);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

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
            const projectData = {
                ...project,
                createdAt: now,
                updatedAt: now,
            };
            const docRef = await addDoc(
                collection(db, 'users', user.uid, 'projects'),
                projectData,
            );
            setProjects((prev) => [...prev, { id: docRef.id, ...projectData }]);
            return docRef.id;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const updateProject = async (project: Project) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const projectRef = doc(db, 'users', user.uid, 'projects', project.id);
            const updatedData = {
                ...project,
                updatedAt: new Date(),
            };
            await updateDoc(projectRef, updatedData);
            setProjects((prev) => prev.map((p) => (p.id === project.id ? updatedData : p)));
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    const deleteProject = async (projectId: string) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
            await deleteDoc(projectRef);
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    const uploadImage = async (file: File, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image:', error);
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
            const projectsRef = collection(db, 'users', user.uid, 'projects');
            const q = query(projectsRef, where('gameId', '==', gameId));
            const querySnapshot = await getDocs(q);
            const projectsData: Project[] = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
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

    const fetchProjectById = async (projectId: string): Promise<null | Project> => {
        if (!user) {
            return null;
        }

        try {
            const userProjectRef = doc(db, 'users', user.uid, 'projects', projectId);
            const userProjectSnap = await getDoc(userProjectRef);

            if (userProjectSnap.exists()) {
                const data = userProjectSnap.data();
                return {
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || '',
                    id: userProjectSnap.id,
                    isPublic: data.isPublic ?? false,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: user.uid,
                };
            }

            const publicProjectRef = doc(db, 'projects', projectId);
            const publicProjectSnap = await getDoc(publicProjectRef);

            if (publicProjectSnap.exists()) {
                const data = publicProjectSnap.data();
                return {
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    description: data.description,
                    gameId: data.gameId || '',
                    id: publicProjectSnap.id,
                    isPublic: data.isPublic ?? true,
                    name: data.name,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
                    userId: data.userId || '',
                };
            }

            return null;
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    };

    const contextValue: FirebaseContextType = {
        createProject,
        deleteProject,
        fetchProjectById,
        fetchPublicProjectsByGame,
        fetchUserProjectsByGame,
        loading,
        logOut,
        projects,
        signIn,
        signUp,
        updateProject,
        uploadImage,
        user,
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    );
};
