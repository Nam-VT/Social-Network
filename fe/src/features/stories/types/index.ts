export type MediaType = 'IMAGE' | 'VIDEO' | 'TEXT';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS';

export interface StoryViewResponse {
  username: string;
  userFullName: string;
  userAvatar?: string;
  reactionType?: string;
  viewedAt: string;
}

export interface StoryResponse {
  id: number;
  authorId: number;
  username: string;
  userFullName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string;
  bgColor?: string;
  visibility: Visibility;
  createdAt: string;
  expiresAt: string;
  isViewed: boolean;
  viewCount: number;
  views: StoryViewResponse[];
  isArchived: boolean;
  archiveVisibility?: Visibility;
}

export interface StoryGroupResponse {
  userId: number;
  username: string;
  userFullName: string;
  userAvatar?: string;
  stories: StoryResponse[];
}

export interface StoryCreateRequest {
  mediaUrl: string;
  mediaType: MediaType;
  caption?: string;
  bgColor?: string;
  visibility?: Visibility;
  durationHours?: number;
}

export interface StoryReplyRequest {
  content: string;
  mediaUrl?: string;
}
