import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: 'web' | 'mobile' | 'tablet' | 'desktop';
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  active: boolean;
}

export interface SessionOptions {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: 'web' | 'mobile' | 'tablet' | 'desktop';
  ipAddress?: string;
  userAgent?: string;
  ttl?: number; // Time to live in milliseconds
  persistent?: boolean;
}

export interface SessionValidation {
  valid: boolean;
  session?: SessionData;
  reason?: 'expired' | 'invalid' | 'revoked' | 'not_found';
}

class SessionManager {
  private static instance: SessionManager;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly PERSISTENT_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly MAX_SESSIONS_PER_USER = 5;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Create a new session
  async create(options: SessionOptions): Promise<SessionData> {
    try {
      const token = this.generateToken();
      const ttl = options.persistent
        ? this.PERSISTENT_TTL
        : options.ttl || this.DEFAULT_TTL;

      const expiresAt = new Date(Date.now() + ttl);

      // Check existing sessions and enforce limit
      await this.enforceSessionLimit(options.userId);

      // Get location from IP
      const location = options.ipAddress
        ? await this.getLocationFromIP(options.ipAddress)
        : undefined;

      const sessionData = {
        user_id: options.userId,
        token,
        device_id: options.deviceId,
        device_name: options.deviceName,
        device_type: options.deviceType,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        location,
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        active: true,
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToSessionData(data);
    } catch (error: any) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  // Validate session
  async validate(token: string): Promise<SessionValidation> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('token', token)
        .eq('active', true)
        .single();

      if (error || !data) {
        return { valid: false, reason: 'not_found' };
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.revoke(token);
        return { valid: false, reason: 'expired' };
      }

      // Update last activity
      await this.updateActivity(token);

      return {
        valid: true,
        session: this.mapToSessionData(data),
      };
    } catch (error) {
      console.error('Failed to validate session:', error);
      return { valid: false, reason: 'invalid' };
    }
  }

  // Get session by token
  async get(token: string): Promise<SessionData | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapToSessionData(data);
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Update session activity
  async updateActivity(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          last_activity_at: new Date().toISOString(),
        })
        .eq('token', token);

      return !error;
    } catch (error) {
      console.error('Failed to update session activity:', error);
      return false;
    }
  }

  // Revoke a session
  async revoke(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('token', token);

      return !error;
    } catch (error) {
      console.error('Failed to revoke session:', error);
      return false;
    }
  }

  // Revoke all sessions for a user
  async revokeAll(userId: string, exceptToken?: string): Promise<number> {
    try {
      let query = supabase
        .from('sessions')
        .update({
          active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('active', true);

      if (exceptToken) {
        query = query.neq('token', exceptToken);
      }

      const { data, error } = await query.select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      return 0;
    }
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToSessionData);
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  // Clean up expired sessions
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          active: false,
          revoked_at: new Date().toISOString(),
        })
        .lt('expires_at', new Date().toISOString())
        .eq('active', true)
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      return 0;
    }
  }

  // Extend session expiry
  async extend(token: string, additionalTTL?: number): Promise<boolean> {
    try {
      const session = await this.get(token);

      if (!session) {
        return false;
      }

      const ttl = additionalTTL || this.DEFAULT_TTL;
      const newExpiresAt = new Date(Date.now() + ttl);

      const { error } = await supabase
        .from('sessions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('token', token);

      return !error;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }

  // Refresh session (create new token, revoke old)
  async refresh(oldToken: string): Promise<SessionData | null> {
    try {
      const oldSession = await this.get(oldToken);

      if (!oldSession) {
        return null;
      }

      // Revoke old session
      await this.revoke(oldToken);

      // Create new session
      return this.create({
        userId: oldSession.userId,
        deviceId: oldSession.deviceId,
        deviceName: oldSession.deviceName,
        deviceType: oldSession.deviceType,
        ipAddress: oldSession.ipAddress,
        userAgent: oldSession.userAgent,
      });
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
  }

  // Get session statistics
  async getStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    deviceTypes: Record<string, number>;
    locations: Array<{ country: string; count: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalSessions: data?.length || 0,
        activeSessions: data?.filter(s => s.active).length || 0,
        deviceTypes: {} as Record<string, number>,
        locations: [] as Array<{ country: string; count: number }>,
      };

      // Count device types
      data?.forEach(session => {
        const type = session.device_type || 'unknown';
        stats.deviceTypes[type] = (stats.deviceTypes[type] || 0) + 1;
      });

      // Count locations
      const locationCounts: Record<string, number> = {};
      data?.forEach(session => {
        if (session.location?.country) {
          locationCounts[session.location.country] =
            (locationCounts[session.location.country] || 0) + 1;
        }
      });

      stats.locations = Object.entries(locationCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      return stats;
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        deviceTypes: {},
        locations: [],
      };
    }
  }

  // Detect suspicious sessions
  async detectSuspicious(userId: string): Promise<SessionData[]> {
    const sessions = await this.getUserSessions(userId);
    const suspicious: SessionData[] = [];

    // Get unique locations
    const locations = new Set(
      sessions.map(s => s.location?.country).filter(Boolean)
    );

    // If sessions from multiple countries, flag them
    if (locations.size > 2) {
      suspicious.push(...sessions);
    }

    // Check for rapid location changes
    const sortedSessions = sessions.sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    );

    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const current = sortedSessions[i];
      const next = sortedSessions[i + 1];

      if (
        current.location?.country &&
        next.location?.country &&
        current.location.country !== next.location.country
      ) {
        const timeDiff =
          new Date(current.lastActivityAt).getTime() -
          new Date(next.lastActivityAt).getTime();

        // If location change within 1 hour, mark as suspicious
        if (timeDiff < 3600000) {
          if (!suspicious.find(s => s.id === current.id)) {
            suspicious.push(current);
          }
        }
      }
    }

    return suspicious;
  }

  // Enforce session limit per user
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Revoke oldest session
      const oldest = sessions[sessions.length - 1];
      await this.revoke(oldest.token);
    }
  }

  // Generate secure token
  private generateToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Get location from IP (mock implementation)
  private async getLocationFromIP(
    ipAddress: string
  ): Promise<{ country?: string; city?: string } | undefined> {
    try {
      // In production, use a service like ipapi.co, ipinfo.io, etc.
      // For now, return mock data
      return {
        country: 'US',
        city: 'San Francisco',
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return undefined;
    }
  }

  // Map database record to SessionData
  private mapToSessionData(data: any): SessionData {
    return {
      id: data.id,
      userId: data.user_id,
      token: data.token,
      deviceId: data.device_id,
      deviceName: data.device_name,
      deviceType: data.device_type,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      location: data.location,
      createdAt: data.created_at,
      lastActivityAt: data.last_activity_at,
      expiresAt: data.expires_at,
      active: data.active,
    };
  }

  // Get session history for audit
  async getHistory(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<SessionData[]> {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId);

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToSessionData);
    } catch (error) {
      console.error('Failed to get session history:', error);
      return [];
    }
  }

  // Check if session is from trusted device
  async isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      if (error) throw error;

      // Device is trusted if it has been used before
      return (count || 0) > 1;
    } catch (error) {
      console.error('Failed to check trusted device:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Middleware helper for Express/API routes
export const requireSession = () => {
  return async (req: any, res: any, next: any) => {
    const token =
      req.headers['authorization']?.replace('Bearer ', '') ||
      req.cookies?.session_token;

    if (!token) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const validation = await sessionManager.validate(token);

    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        reason: validation.reason,
      });
    }

    req.session = validation.session;
    req.user = { id: validation.session!.userId };

    next();
  };
};

// Convenience functions
export const createSession = (options: SessionOptions) =>
  sessionManager.create(options);

export const validateSession = (token: string) =>
  sessionManager.validate(token);

export const revokeSession = (token: string) =>
  sessionManager.revoke(token);

export const revokeAllSessions = (userId: string, exceptToken?: string) =>
  sessionManager.revokeAll(userId, exceptToken);

export const getUserSessions = (userId: string) =>
  sessionManager.getUserSessions(userId);

export const refreshSession = (token: string) =>
  sessionManager.refresh(token);

export const extendSession = (token: string, additionalTTL?: number) =>
  sessionManager.extend(token, additionalTTL);

