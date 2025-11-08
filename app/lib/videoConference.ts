import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum RoomStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELED = 'canceled',
}

export enum ParticipantRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  MODERATOR = 'moderator',
  SPEAKER = 'speaker',
  ATTENDEE = 'attendee',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  JOINED = 'joined',
  LEFT = 'left',
  REMOVED = 'removed',
}

export enum RecordingStatus {
  NOT_STARTED = 'not_started',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum StreamQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HD = 'hd',
  FULL_HD = 'full_hd',
}

export interface VideoRoom {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  type: 'meeting' | 'webinar' | 'broadcast' | 'interview';
  status: RoomStatus;
  settings: RoomSettings;
  security: SecuritySettings;
  maxParticipants: number;
  currentParticipants: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  recording?: RecordingInfo;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSettings {
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  autoRecord: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  waitingRoom: boolean;
  enableBreakoutRooms: boolean;
  maxDuration?: number;
  quality: StreamQuality;
  layout: 'grid' | 'speaker' | 'gallery';
}

export interface SecuritySettings {
  requirePassword: boolean;
  password?: string;
  requireApproval: boolean;
  allowAnonymous: boolean;
  restrictedDomains?: string[];
  endToEndEncryption: boolean;
}

export interface Participant {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  avatar?: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  audio: MediaState;
  video: MediaState;
  screenShare: MediaState;
  raisedHand: boolean;
  joinedAt: string;
  leftAt?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface MediaState {
  enabled: boolean;
  muted: boolean;
  deviceId?: string;
  quality?: StreamQuality;
}

export interface RecordingInfo {
  id: string;
  roomId: string;
  status: RecordingStatus;
  startedAt?: string;
  stoppedAt?: string;
  duration?: number;
  size?: number;
  url?: string;
  thumbnails?: string[];
  chapters?: RecordingChapter[];
}

export interface RecordingChapter {
  time: number;
  title: string;
  speaker?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'emoji' | 'system';
  replyTo?: string;
  attachments?: Attachment[];
  reactions?: Record<string, string[]>;
  timestamp: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface BreakoutRoom {
  id: string;
  parentRoomId: string;
  name: string;
  participants: string[];
  duration?: number;
  createdAt: string;
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  anonymous: boolean;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Whiteboard {
  id: string;
  roomId: string;
  name: string;
  data: any;
  locked: boolean;
  createdBy: string;
  updatedAt: string;
}

export interface StreamAnalytics {
  roomId: string;
  totalParticipants: number;
  peakParticipants: number;
  averageDuration: number;
  totalDuration: number;
  messageCount: number;
  screenShareCount: number;
  recordingDuration: number;
  qualityMetrics: {
    averageBitrate: number;
    packetLoss: number;
    jitter: number;
    latency: number;
  };
  engagement: {
    chatParticipation: number;
    pollParticipation: number;
    handsRaised: number;
  };
  timeline: Array<{
    timestamp: string;
    participants: number;
    event?: string;
  }>;
}

export interface LiveStream {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  streamKey: string;
  rtmpUrl: string;
  hlsUrl?: string;
  status: 'offline' | 'live' | 'ended';
  viewers: number;
  peakViewers: number;
  startedAt?: string;
  endedAt?: string;
}

export interface Transcript {
  id: string;
  roomId: string;
  language: string;
  segments: TranscriptSegment[];
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
}

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  speaker: string;
  text: string;
  confidence: number;
}

class VideoConferenceSystem {
  private static instance: VideoConferenceSystem;

  private constructor() {}

  static getInstance(): VideoConferenceSystem {
    if (!VideoConferenceSystem.instance) {
      VideoConferenceSystem.instance = new VideoConferenceSystem();
    }
    return VideoConferenceSystem.instance;
  }

  // Create room
  async createRoom(room: Omit<VideoRoom, 'id' | 'currentParticipants' | 'createdAt' | 'updatedAt'>): Promise<VideoRoom> {
    try {
      const roomData = {
        name: room.name,
        description: room.description,
        host_id: room.hostId,
        type: room.type,
        status: room.status,
        settings: room.settings,
        security: room.security,
        max_participants: room.maxParticipants,
        current_participants: 0,
        scheduled_start: room.scheduledStart,
        scheduled_end: room.scheduledEnd,
        actual_start: room.actualStart,
        actual_end: room.actualEnd,
        recording: room.recording,
        metadata: room.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('video_rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToVideoRoom(data);
    } catch (error: any) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  // Get room
  async getRoom(roomId: string): Promise<VideoRoom | null> {
    try {
      const { data, error } = await supabase
        .from('video_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) return null;

      return this.mapToVideoRoom(data);
    } catch (error) {
      console.error('Failed to get room:', error);
      return null;
    }
  }

  // Start room
  async startRoom(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_rooms')
        .update({
          status: RoomStatus.ACTIVE,
          actual_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      return !error;
    } catch (error) {
      console.error('Failed to start room:', error);
      return false;
    }
  }

  // End room
  async endRoom(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('video_rooms')
        .update({
          status: RoomStatus.ENDED,
          actual_end: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      // End all recordings
      await this.stopRecording(roomId);

      return !error;
    } catch (error) {
      console.error('Failed to end room:', error);
      return false;
    }
  }

  // Join room
  async joinRoom(roomId: string, userId: string, userName: string, role: ParticipantRole = ParticipantRole.ATTENDEE): Promise<Participant | null> {
    try {
      const room = await this.getRoom(roomId);

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.currentParticipants >= room.maxParticipants) {
        throw new Error('Room is full');
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .eq('status', ParticipantStatus.JOINED)
        .single();

      if (existing) {
        return this.mapToParticipant(existing);
      }

      const participantData = {
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        role,
        status: ParticipantStatus.JOINED,
        audio: {
          enabled: !room.settings.muteOnEntry,
          muted: room.settings.muteOnEntry,
        },
        video: {
          enabled: room.settings.videoOnEntry,
          muted: !room.settings.videoOnEntry,
        },
        screen_share: {
          enabled: false,
          muted: true,
        },
        raised_hand: false,
        joined_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('participants')
        .insert(participantData)
        .select()
        .single();

      if (error) throw error;

      // Update room participant count
      await this.updateParticipantCount(roomId, 1);

      // Send system message
      await this.sendSystemMessage(roomId, `${userName} joined the room`);

      return this.mapToParticipant(data);
    } catch (error: any) {
      console.error('Failed to join room:', error);
      return null;
    }
  }

  // Leave room
  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .eq('status', ParticipantStatus.JOINED)
        .single();

      if (!participant) return false;

      const duration = Math.floor(
        (Date.now() - new Date(participant.joined_at).getTime()) / 1000
      );

      await supabase
        .from('participants')
        .update({
          status: ParticipantStatus.LEFT,
          left_at: new Date().toISOString(),
          duration,
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      // Update room participant count
      await this.updateParticipantCount(roomId, -1);

      // Send system message
      await this.sendSystemMessage(roomId, `${participant.user_name} left the room`);

      return true;
    } catch (error) {
      console.error('Failed to leave room:', error);
      return false;
    }
  }

  // Get participants
  async getParticipants(roomId: string): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', ParticipantStatus.JOINED)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapToParticipant);
    } catch (error) {
      console.error('Failed to get participants:', error);
      return [];
    }
  }

  // Update media state
  async updateMediaState(roomId: string, userId: string, type: 'audio' | 'video' | 'screenShare', state: Partial<MediaState>): Promise<boolean> {
    try {
      const field = type === 'screenShare' ? 'screen_share' : type;

      await supabase
        .from('participants')
        .update({
          [field]: state,
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Failed to update media state:', error);
      return false;
    }
  }

  // Toggle raised hand
  async toggleRaisedHand(roomId: string, userId: string, raised: boolean): Promise<boolean> {
    try {
      await supabase
        .from('participants')
        .update({ raised_hand: raised })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Failed to toggle raised hand:', error);
      return false;
    }
  }

  // Start recording
  async startRecording(roomId: string): Promise<RecordingInfo | null> {
    try {
      const recordingData = {
        room_id: roomId,
        status: RecordingStatus.RECORDING,
        started_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('recordings')
        .insert(recordingData)
        .select()
        .single();

      if (error) throw error;

      // Update room
      await supabase
        .from('video_rooms')
        .update({
          recording: this.mapToRecordingInfo(data),
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      return this.mapToRecordingInfo(data);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      return null;
    }
  }

  // Stop recording
  async stopRecording(roomId: string): Promise<boolean> {
    try {
      const { data: recording } = await supabase
        .from('recordings')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', RecordingStatus.RECORDING)
        .single();

      if (!recording) return false;

      const duration = Math.floor(
        (Date.now() - new Date(recording.started_at).getTime()) / 1000
      );

      await supabase
        .from('recordings')
        .update({
          status: RecordingStatus.PROCESSING,
          stopped_at: new Date().toISOString(),
          duration,
        })
        .eq('id', recording.id);

      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return false;
    }
  }

  // Send message
  async sendMessage(roomId: string, senderId: string, senderName: string, content: string, type: 'text' | 'file' | 'emoji' = 'text'): Promise<ChatMessage> {
    try {
      const messageData = {
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        type,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToChatMessage(data);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Get messages
  async getMessages(roomId: string, limit: number = 100): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToChatMessage);
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  // Create poll
  async createPoll(poll: Omit<Poll, 'id' | 'createdAt'>): Promise<Poll> {
    try {
      const pollData = {
        room_id: poll.roomId,
        question: poll.question,
        options: poll.options,
        allow_multiple: poll.allowMultiple,
        anonymous: poll.anonymous,
        active: poll.active,
        created_by: poll.createdBy,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToPoll(data);
    } catch (error: any) {
      console.error('Failed to create poll:', error);
      throw error;
    }
  }

  // Vote on poll
  async votePoll(pollId: string, userId: string, optionIds: string[]): Promise<boolean> {
    try {
      await supabase.from('poll_votes').insert({
        poll_id: pollId,
        user_id: userId,
        option_ids: optionIds,
        voted_at: new Date().toISOString(),
      });

      // Update vote counts
      for (const optionId of optionIds) {
        await supabase.rpc('increment_poll_votes', {
          poll_id_param: pollId,
          option_id_param: optionId,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      return false;
    }
  }

  // Create breakout room
  async createBreakoutRoom(parentRoomId: string, name: string, participants: string[], duration?: number): Promise<BreakoutRoom> {
    try {
      const breakoutData = {
        parent_room_id: parentRoomId,
        name,
        participants,
        duration,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('breakout_rooms')
        .insert(breakoutData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToBreakoutRoom(data);
    } catch (error: any) {
      console.error('Failed to create breakout room:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(roomId: string): Promise<StreamAnalytics> {
    try {
      const { data: participants } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId);

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact' })
        .eq('room_id', roomId);

      const totalParticipants = participants?.length || 0;
      const completedParticipants = participants?.filter(p => p.duration !== null) || [];
      const averageDuration = completedParticipants.length > 0
        ? completedParticipants.reduce((sum, p) => sum + (p.duration || 0), 0) / completedParticipants.length
        : 0;

      return {
        roomId,
        totalParticipants,
        peakParticipants: 0,
        averageDuration,
        totalDuration: 0,
        messageCount: messages?.length || 0,
        screenShareCount: 0,
        recordingDuration: 0,
        qualityMetrics: {
          averageBitrate: 0,
          packetLoss: 0,
          jitter: 0,
          latency: 0,
        },
        engagement: {
          chatParticipation: 0,
          pollParticipation: 0,
          handsRaised: 0,
        },
        timeline: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private async updateParticipantCount(roomId: string, delta: number): Promise<void> {
    try {
      const { data: room } = await supabase
        .from('video_rooms')
        .select('current_participants')
        .eq('id', roomId)
        .single();

      if (room) {
        await supabase
          .from('video_rooms')
          .update({
            current_participants: Math.max(0, room.current_participants + delta),
            updated_at: new Date().toISOString(),
          })
          .eq('id', roomId);
      }
    } catch (error) {
      console.error('Failed to update participant count:', error);
    }
  }

  private async sendSystemMessage(roomId: string, content: string): Promise<void> {
    try {
      await supabase.from('chat_messages').insert({
        room_id: roomId,
        sender_id: 'system',
        sender_name: 'System',
        content,
        type: 'system',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send system message:', error);
    }
  }

  private mapToVideoRoom(data: any): VideoRoom {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      hostId: data.host_id,
      type: data.type,
      status: data.status,
      settings: data.settings,
      security: data.security,
      maxParticipants: data.max_participants,
      currentParticipants: data.current_participants,
      scheduledStart: data.scheduled_start,
      scheduledEnd: data.scheduled_end,
      actualStart: data.actual_start,
      actualEnd: data.actual_end,
      recording: data.recording,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToParticipant(data: any): Participant {
    return {
      id: data.id,
      roomId: data.room_id,
      userId: data.user_id,
      userName: data.user_name,
      avatar: data.avatar,
      role: data.role,
      status: data.status,
      audio: data.audio,
      video: data.video,
      screenShare: data.screen_share,
      raisedHand: data.raised_hand,
      joinedAt: data.joined_at,
      leftAt: data.left_at,
      duration: data.duration,
      metadata: data.metadata,
    };
  }

  private mapToRecordingInfo(data: any): RecordingInfo {
    return {
      id: data.id,
      roomId: data.room_id,
      status: data.status,
      startedAt: data.started_at,
      stoppedAt: data.stopped_at,
      duration: data.duration,
      size: data.size,
      url: data.url,
      thumbnails: data.thumbnails,
      chapters: data.chapters,
    };
  }

  private mapToChatMessage(data: any): ChatMessage {
    return {
      id: data.id,
      roomId: data.room_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      content: data.content,
      type: data.type,
      replyTo: data.reply_to,
      attachments: data.attachments,
      reactions: data.reactions,
      timestamp: data.timestamp,
    };
  }

  private mapToPoll(data: any): Poll {
    return {
      id: data.id,
      roomId: data.room_id,
      question: data.question,
      options: data.options,
      allowMultiple: data.allow_multiple,
      anonymous: data.anonymous,
      active: data.active,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  private mapToBreakoutRoom(data: any): BreakoutRoom {
    return {
      id: data.id,
      parentRoomId: data.parent_room_id,
      name: data.name,
      participants: data.participants,
      duration: data.duration,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const videoConference = VideoConferenceSystem.getInstance();

// Convenience functions
export const createVideoRoom = (room: any) => videoConference.createRoom(room);
export const getVideoRoom = (roomId: string) => videoConference.getRoom(roomId);
export const startVideoRoom = (roomId: string) => videoConference.startRoom(roomId);
export const joinVideoRoom = (roomId: string, userId: string, userName: string, role?: ParticipantRole) =>
  videoConference.joinRoom(roomId, userId, userName, role);
export const leaveVideoRoom = (roomId: string, userId: string) => videoConference.leaveRoom(roomId, userId);
export const getRoomParticipants = (roomId: string) => videoConference.getParticipants(roomId);
export const startRecording = (roomId: string) => videoConference.startRecording(roomId);
export const sendChatMessage = (roomId: string, senderId: string, senderName: string, content: string) =>
  videoConference.sendMessage(roomId, senderId, senderName, content);
export const createRoomPoll = (poll: any) => videoConference.createPoll(poll);
export const getStreamAnalytics = (roomId: string) => videoConference.getAnalytics(roomId);

