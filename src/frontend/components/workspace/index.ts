// Base Workspace Components
export { WorkspaceCard } from './WorkspaceCard';
export { ComingSoonCard } from './ComingSoonCard';
export { WorkspaceGrid } from './WorkspaceGrid';
export { WorkspaceSelector } from './WorkspaceSelector';

// Re-export workspace types for convenience
export type {
  Workspace,
  WorkspaceId,
  WorkspaceAccessLevel,
  WorkspacePermission,
  UserWorkspaceAccess,
  WorkspaceStats,
  WorkspaceFeature,
  WorkspaceColor,
  WorkspaceCardProps,
  WorkspaceGridProps,
  ComingSoonCardProps
} from '../../types/workspace'; 