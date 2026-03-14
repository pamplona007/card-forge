import { useQuery } from '@tanstack/react-query';

import type { FetchProjectsOptions, Project } from '../firebase/context';

import { useFirebase } from './useFirebase';

export const useProjects = (options: FetchProjectsOptions, enabled = true) => {
    const { fetchProjects } = useFirebase();

    return useQuery<Project[]>({
        enabled,
        queryFn: () => fetchProjects(options),
        queryKey: ['projects', options],
    });
};
