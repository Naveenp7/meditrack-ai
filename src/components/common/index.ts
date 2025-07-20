// Export all common components for easier imports
export { default as Navigation } from './Navigation';
export { default as Loading } from './Loading';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as PageContainer } from './PageContainer';
export { default as NotificationCard } from './NotificationCard';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as FileUpload } from './FileUpload';
export { default as SearchInput } from './SearchInput';
export { default as StatsCard } from './StatsCard';
export { default as AppointmentCard } from './AppointmentCard';
export { default as MedicalRecordCard } from './MedicalRecordCard';

// Also export types from components
export type { NotificationType, NotificationData } from './NotificationCard';
export type { FileWithPreview } from './FileUpload';
export type { SearchResult } from './SearchInput';