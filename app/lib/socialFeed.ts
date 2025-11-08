import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
  POLL = 'poll',
  TRANSACTION = 'transaction',
  MILESTONE = 'milestone',
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  CONNECTIONS = 'connections',
  PRIVATE = 'private',
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  CELEBRATE = 'celebrate',
  SUPPORT = 'support',
  INSIGHTFUL = 'insightful',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  content: string;
  media?: MediaAttachment[];
  visibility: PostVisibility;
  status: ContentStatus;
  tags?: string[];
  mentions?: string[];
  metadata?: Record<string, any>;
  engagementCount: {
    reactions: number;
    comments: number;
    shares: number;
    views: number;
  };
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
  size: number;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  reactions: Record<ReactionType, number>;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  type: ReactionType;
  createdAt: string;
}

export interface Feed {
  id: string;
  userId: string;
  name: string;
  filters: FeedFilters;
  sortBy: 'recent' | 'popular' | 'trending' | 'relevant';
  createdAt: string;
}

export interface FeedFilters {
  types?: PostType[];
  authors?: string[];
  tags?: string[];
  visibility?: PostVisibility[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface FeedItem {
  post: Post;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  userReaction?: ReactionType;
  userBookmarked?: boolean;
  isFollowing?: boolean;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  collectionId?: string;
  notes?: string;
  createdAt: string;
}

export interface BookmarkCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  itemCount: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface Poll {
  id: string;
  postId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  endsAt?: string;
  totalVotes: number;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface UserVote {
  userId: string;
  pollId: string;
  optionIds: string[];
  votedAt: string;
}

export interface TrendingTopic {
  tag: string;
  postCount: number;
  engagementScore: number;
  growth: number;
  posts: Post[];
}

export interface ContentAnalytics {
  postId: string;
  views: number;
  uniqueViews: number;
  reactions: Record<ReactionType, number>;
  comments: number;
  shares: number;
  bookmarks: number;
  engagementRate: number;
  topReactions: Array<{
    type: ReactionType;
    count: number;
  }>;
  demographics?: {
    countries: Record<string, number>;
    devices: Record<string, number>;
  };
  timeline: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
}

class SocialFeedSystem {
  private static instance: SocialFeedSystem;

  private constructor() {}

  static getInstance(): SocialFeedSystem {
    if (!SocialFeedSystem.instance) {
      SocialFeedSystem.instance = new SocialFeedSystem();
    }
    return SocialFeedSystem.instance;
  }

  // Create post
  async createPost(post: Omit<Post, 'id' | 'engagementCount' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    try {
      const postData = {
        author_id: post.authorId,
        type: post.type,
        content: post.content,
        media: post.media,
        visibility: post.visibility,
        status: post.status,
        tags: post.tags,
        mentions: post.mentions,
        metadata: post.metadata,
        published_at: post.publishedAt,
        scheduled_for: post.scheduledFor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Notify mentions
      if (post.mentions && post.mentions.length > 0) {
        await this.notifyMentions(data.id, post.mentions);
      }

      // Index tags
      if (post.tags && post.tags.length > 0) {
        await this.indexTags(data.id, post.tags);
      }

      return this.mapToPost(data);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  // Get post
  async getPost(postId: string, viewerId?: string): Promise<FeedItem | null> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error || !post) return null;

      // Increment view count
      await this.incrementViews(postId, viewerId);

      const { data: author } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, verified')
        .eq('id', post.author_id)
        .single();

      let userReaction: ReactionType | undefined;
      let userBookmarked = false;
      let isFollowing = false;

      if (viewerId) {
        const { data: reaction } = await supabase
          .from('reactions')
          .select('type')
          .eq('user_id', viewerId)
          .eq('target_id', postId)
          .eq('target_type', 'post')
          .single();

        userReaction = reaction?.type;

        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', viewerId)
          .eq('post_id', postId)
          .single();

        userBookmarked = !!bookmark;

        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', viewerId)
          .eq('following_id', post.author_id)
          .single();

        isFollowing = !!follow;
      }

      return {
        post: this.mapToPost(post),
        author: {
          id: author?.id || post.author_id,
          name: author?.full_name || 'Unknown',
          avatar: author?.avatar_url,
          verified: author?.verified,
        },
        userReaction,
        userBookmarked,
        isFollowing,
      };
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  }

  // Get feed
  async getFeed(
    userId: string,
    filters?: FeedFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<FeedItem[]> {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', ContentStatus.PUBLISHED);

      // Apply filters
      if (filters?.types) {
        query = query.in('type', filters.types);
      }

      if (filters?.authors) {
        query = query.in('author_id', filters.authors);
      }

      if (filters?.tags) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.visibility) {
        query = query.in('visibility', filters.visibility);
      } else {
        // Default visibility filter
        query = query.in('visibility', [
          PostVisibility.PUBLIC,
          PostVisibility.FOLLOWERS,
          PostVisibility.CONNECTIONS,
        ]);
      }

      if (filters?.dateRange?.start) {
        query = query.gte('published_at', filters.dateRange.start);
      }

      if (filters?.dateRange?.end) {
        query = query.lte('published_at', filters.dateRange.end);
      }

      query = query
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: posts, error } = await query;

      if (error) throw error;

      if (!posts || posts.length === 0) return [];

      // Get authors
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: authors } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, verified')
        .in('id', authorIds);

      const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

      // Get user reactions
      const postIds = posts.map(p => p.id);
      const { data: reactions } = await supabase
        .from('reactions')
        .select('target_id, type')
        .eq('user_id', userId)
        .in('target_id', postIds)
        .eq('target_type', 'post');

      const reactionMap = new Map(reactions?.map(r => [r.target_id, r.type]) || []);

      // Get bookmarks
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      const bookmarkSet = new Set(bookmarks?.map(b => b.post_id) || []);

      // Get following
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', authorIds);

      const followingSet = new Set(following?.map(f => f.following_id) || []);

      return posts.map(post => {
        const author = authorMap.get(post.author_id);

        return {
          post: this.mapToPost(post),
          author: {
            id: author?.id || post.author_id,
            name: author?.full_name || 'Unknown',
            avatar: author?.avatar_url,
            verified: author?.verified,
          },
          userReaction: reactionMap.get(post.id),
          userBookmarked: bookmarkSet.has(post.id),
          isFollowing: followingSet.has(post.author_id),
        };
      });
    } catch (error) {
      console.error('Failed to get feed:', error);
      return [];
    }
  }

  // Add reaction
  async addReaction(userId: string, targetId: string, targetType: 'post' | 'comment', type: ReactionType): Promise<boolean> {
    try {
      // Remove existing reaction
      await supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      // Add new reaction
      await supabase.from('reactions').insert({
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        type,
        created_at: new Date().toISOString(),
      });

      // Update engagement count
      await this.updateEngagementCount(targetId, targetType);

      return true;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      return false;
    }
  }

  // Remove reaction
  async removeReaction(userId: string, targetId: string, targetType: 'post' | 'comment'): Promise<boolean> {
    try {
      await supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      await this.updateEngagementCount(targetId, targetType);

      return true;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      return false;
    }
  }

  // Add comment
  async addComment(comment: Omit<Comment, 'id' | 'reactions' | 'replyCount' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    try {
      const commentData = {
        post_id: comment.postId,
        author_id: comment.authorId,
        content: comment.content,
        parent_id: comment.parentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      // Update post comment count
      await this.updateEngagementCount(comment.postId, 'post');

      // Update parent comment reply count
      if (comment.parentId) {
        await this.updateReplyCount(comment.parentId);
      }

      return this.mapToComment(data);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  // Get comments
  async getComments(postId: string, parentId?: string, limit: number = 50): Promise<Comment[]> {
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId);

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      query = query
        .order('created_at', { ascending: true })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToComment);
    } catch (error) {
      console.error('Failed to get comments:', error);
      return [];
    }
  }

  // Bookmark post
  async bookmarkPost(userId: string, postId: string, collectionId?: string, notes?: string): Promise<Bookmark> {
    try {
      const bookmarkData = {
        user_id: userId,
        post_id: postId,
        collection_id: collectionId,
        notes,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmarkData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToBookmark(data);
    } catch (error: any) {
      console.error('Failed to bookmark post:', error);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, postId: string): Promise<boolean> {
    try {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      return true;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      return false;
    }
  }

  // Get bookmarks
  async getBookmarks(userId: string, collectionId?: string): Promise<FeedItem[]> {
    try {
      let query = supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId);

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data: bookmarks, error } = await query;

      if (error) throw error;

      if (!bookmarks || bookmarks.length === 0) return [];

      const postIds = bookmarks.map(b => b.post_id);

      // Get posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (!posts) return [];

      // Get authors
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: authors } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, verified')
        .in('id', authorIds);

      const authorMap = new Map(authors?.map(a => [a.id, a]) || []);

      return posts.map(post => {
        const author = authorMap.get(post.author_id);

        return {
          post: this.mapToPost(post),
          author: {
            id: author?.id || post.author_id,
            name: author?.full_name || 'Unknown',
            avatar: author?.avatar_url,
            verified: author?.verified,
          },
          userBookmarked: true,
        };
      });
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return [];
    }
  }

  // Get trending topics
  async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_topics', { limit_count: limit });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get trending topics:', error);
      return [];
    }
  }

  // Get analytics
  async getAnalytics(postId: string): Promise<ContentAnalytics> {
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!post) {
        throw new Error('Post not found');
      }

      // Get reactions
      const { data: reactions } = await supabase
        .from('reactions')
        .select('type')
        .eq('target_id', postId)
        .eq('target_type', 'post');

      const reactionCounts: Record<ReactionType, number> = {
        [ReactionType.LIKE]: 0,
        [ReactionType.LOVE]: 0,
        [ReactionType.CELEBRATE]: 0,
        [ReactionType.SUPPORT]: 0,
        [ReactionType.INSIGHTFUL]: 0,
      };

      reactions?.forEach((r: any) => {
        reactionCounts[r.type as ReactionType]++;
      });

      const topReactions = Object.entries(reactionCounts)
        .map(([type, count]) => ({ type: type as ReactionType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Get comments
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      // Get shares
      const { count: shareCount } = await supabase
        .from('post_shares')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      // Get bookmarks
      const { count: bookmarkCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      const totalReactions = reactions?.length || 0;
      const views = post.view_count || 0;
      const uniqueViews = post.unique_view_count || 0;

      const engagementRate = views > 0
        ? ((totalReactions + (commentCount || 0) + (shareCount || 0)) / views) * 100
        : 0;

      return {
        postId,
        views,
        uniqueViews,
        reactions: reactionCounts,
        comments: commentCount || 0,
        shares: shareCount || 0,
        bookmarks: bookmarkCount || 0,
        engagementRate,
        topReactions,
        timeline: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private async notifyMentions(postId: string, mentions: string[]): Promise<void> {
    try {
      const notifications = mentions.map(userId => ({
        user_id: userId,
        type: 'mention',
        data: { postId },
        created_at: new Date().toISOString(),
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify mentions:', error);
    }
  }

  private async indexTags(postId: string, tags: string[]): Promise<void> {
    try {
      const tagRecords = tags.map(tag => ({
        post_id: postId,
        tag: tag.toLowerCase(),
        created_at: new Date().toISOString(),
      }));

      await supabase.from('post_tags').insert(tagRecords);
    } catch (error) {
      console.error('Failed to index tags:', error);
    }
  }

  private async incrementViews(postId: string, viewerId?: string): Promise<void> {
    try {
      // Increment total views
      await supabase.rpc('increment_post_views', { post_id_param: postId });

      // Track unique view if viewer is provided
      if (viewerId) {
        const { data: existingView } = await supabase
          .from('post_views')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', viewerId)
          .single();

        if (!existingView) {
          await supabase.from('post_views').insert({
            post_id: postId,
            user_id: viewerId,
            viewed_at: new Date().toISOString(),
          });

          await supabase.rpc('increment_unique_views', { post_id_param: postId });
        }
      }
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }

  private async updateEngagementCount(targetId: string, targetType: 'post' | 'comment'): Promise<void> {
    try {
      const { count } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      if (targetType === 'post') {
        await supabase
          .from('posts')
          .update({ reaction_count: count || 0 })
          .eq('id', targetId);
      }
    } catch (error) {
      console.error('Failed to update engagement count:', error);
    }
  }

  private async updateReplyCount(commentId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', commentId);

      await supabase
        .from('comments')
        .update({ reply_count: count || 0 })
        .eq('id', commentId);
    } catch (error) {
      console.error('Failed to update reply count:', error);
    }
  }

  private mapToPost(data: any): Post {
    return {
      id: data.id,
      authorId: data.author_id,
      type: data.type,
      content: data.content,
      media: data.media,
      visibility: data.visibility,
      status: data.status,
      tags: data.tags,
      mentions: data.mentions,
      metadata: data.metadata,
      engagementCount: {
        reactions: data.reaction_count || 0,
        comments: data.comment_count || 0,
        shares: data.share_count || 0,
        views: data.view_count || 0,
      },
      publishedAt: data.published_at,
      scheduledFor: data.scheduled_for,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToComment(data: any): Comment {
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      content: data.content,
      parentId: data.parent_id,
      reactions: data.reactions || {},
      replyCount: data.reply_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToBookmark(data: any): Bookmark {
    return {
      id: data.id,
      userId: data.user_id,
      postId: data.post_id,
      collectionId: data.collection_id,
      notes: data.notes,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const socialFeed = SocialFeedSystem.getInstance();

// Convenience functions
export const createPost = (post: any) => socialFeed.createPost(post);
export const getPost = (postId: string, viewerId?: string) => socialFeed.getPost(postId, viewerId);
export const getFeed = (userId: string, filters?: FeedFilters, limit?: number, offset?: number) =>
  socialFeed.getFeed(userId, filters, limit, offset);
export const addReaction = (userId: string, targetId: string, targetType: 'post' | 'comment', type: ReactionType) =>
  socialFeed.addReaction(userId, targetId, targetType, type);
export const addComment = (comment: any) => socialFeed.addComment(comment);
export const getComments = (postId: string, parentId?: string, limit?: number) =>
  socialFeed.getComments(postId, parentId, limit);
export const bookmarkPost = (userId: string, postId: string, collectionId?: string, notes?: string) =>
  socialFeed.bookmarkPost(userId, postId, collectionId, notes);
export const getTrendingTopics = (limit?: number) => socialFeed.getTrendingTopics(limit);
export const getContentAnalytics = (postId: string) => socialFeed.getAnalytics(postId);

