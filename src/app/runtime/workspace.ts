import { createMemorySession } from '@/store/memory-session'
import { createWorkspaceRuntime } from './create-workspace'

/** The page's only session implementation choice; all consumers share this runtime. */
export const workspace = createWorkspaceRuntime(createMemorySession())
