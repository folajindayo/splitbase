import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  GENERAL = 'general',
  OTHER = 'other',
}

export enum MessageType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  SYSTEM = 'system',
  NOTE = 'note',
}

export enum SatisfactionRating {
  VERY_DISSATISFIED = 1,
  DISSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

export interface Ticket {
  id: string;
  number: string;
  customerId: string;
  assignedTo?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  tags: string[];
  attachments: Attachment[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  firstResponseTime?: number;
  resolutionTime?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  attachments?: Attachment[];
  isInternal: boolean;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'supervisor' | 'agent';
  specialties: TicketCategory[];
  active: boolean;
  onlineStatus: 'online' | 'away' | 'offline';
  maxTickets: number;
  currentTickets: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: string[];
  categories: TicketCategory[];
  active: boolean;
  createdAt: string;
}

export interface SLA {
  id: string;
  name: string;
  priority: TicketPriority;
  firstResponseTime: number;
  resolutionTime: number;
  businessHoursOnly: boolean;
  active: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    event: 'ticket_created' | 'ticket_updated' | 'message_received' | 'sla_breach';
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  actions: Array<{
    type: 'assign' | 'prioritize' | 'tag' | 'notify' | 'close';
    params: Record<string, any>;
  }>;
  active: boolean;
  order: number;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category?: TicketCategory;
  tags: string[];
  usageCount: number;
  createdBy: string;
  active: boolean;
  createdAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  relatedArticles: string[];
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSatisfaction {
  id: string;
  ticketId: string;
  customerId: string;
  rating: SatisfactionRating;
  comment?: string;
  createdAt: string;
}

export interface SupportAnalytics {
  totalTickets: number;
  openTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore: number;
  firstContactResolution: number;
  byCategory: Record<TicketCategory, number>;
  byPriority: Record<TicketPriority, number>;
  byStatus: Record<TicketStatus, number>;
  topAgents: Array<{
    agentId: string;
    name: string;
    ticketsResolved: number;
    averageRating: number;
  }>;
  trends: Array<{
    date: string;
    tickets: number;
    resolved: number;
    satisfaction: number;
  }>;
}

class SupportSystem {
  private static instance: SupportSystem;

  private constructor() {}

  static getInstance(): SupportSystem {
    if (!SupportSystem.instance) {
      SupportSystem.instance = new SupportSystem();
    }
    return SupportSystem.instance;
  }

  // Create ticket
  async createTicket(ticket: Omit<Ticket, 'id' | 'number' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    try {
      // Generate ticket number
      const number = await this.generateTicketNumber();

      const ticketData = {
        number,
        customer_id: ticket.customerId,
        assigned_to: ticket.assignedTo,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        tags: ticket.tags,
        attachments: ticket.attachments,
        metadata: ticket.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      // Auto-assign if not assigned
      if (!ticket.assignedTo) {
        await this.autoAssignTicket(data.id);
      }

      // Run automation rules
      await this.runAutomation('ticket_created', data.id);

      return this.mapToTicket(data);
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      throw error;
    }
  }

  // Get ticket
  async getTicket(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error || !data) return null;

      return this.mapToTicket(data);
    } catch (error) {
      console.error('Failed to get ticket:', error);
      return null;
    }
  }

  // List tickets
  async listTickets(filters: {
    customerId?: string;
    assignedTo?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    limit?: number;
  } = {}): Promise<Ticket[]> {
    try {
      let query = supabase.from('support_tickets').select('*');

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToTicket);
    } catch (error) {
      console.error('Failed to list tickets:', error);
      return [];
    }
  }

  // Update ticket
  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.status !== undefined) {
        updateData.status = updates.status;
        if (updates.status === TicketStatus.RESOLVED) {
          updateData.resolved_at = new Date().toISOString();
        }
        if (updates.status === TicketStatus.CLOSED) {
          updateData.closed_at = new Date().toISOString();
        }
      }
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Run automation rules
      await this.runAutomation('ticket_updated', ticketId);

      return this.mapToTicket(data);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      return null;
    }
  }

  // Add message
  async addMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    try {
      const messageData = {
        ticket_id: message.ticketId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        type: message.type,
        content: message.content,
        attachments: message.attachments,
        is_internal: message.isInternal,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update ticket's first response time if this is first agent response
      if (message.type === MessageType.AGENT) {
        await this.updateFirstResponseTime(message.ticketId);
      }

      // Run automation rules
      await this.runAutomation('message_received', message.ticketId);

      return this.mapToMessage(data);
    } catch (error: any) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  // Get messages
  async getMessages(ticketId: string, includeInternal: boolean = false): Promise<Message[]> {
    try {
      let query = supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId);

      if (!includeInternal) {
        query = query.eq('is_internal', false);
      }

      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToMessage);
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  // Assign ticket
  async assignTicket(ticketId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: agentId,
          status: TicketStatus.IN_PROGRESS,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      // Add system message
      await this.addMessage({
        ticketId,
        senderId: 'system',
        senderName: 'System',
        type: MessageType.SYSTEM,
        content: 'Ticket assigned to agent',
        isInternal: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      return false;
    }
  }

  // Auto-assign ticket
  async autoAssignTicket(ticketId: string): Promise<boolean> {
    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) return false;

      // Find available agents with matching specialty
      const { data: agents } = await supabase
        .from('support_agents')
        .select('*')
        .eq('active', true)
        .contains('specialties', [ticket.category])
        .eq('online_status', 'online');

      if (!agents || agents.length === 0) return false;

      // Find agent with lowest current load
      const agent = agents.reduce((min, a) => 
        a.current_tickets < min.current_tickets ? a : min
      );

      if (agent.current_tickets >= agent.max_tickets) return false;

      await this.assignTicket(ticketId, agent.id);

      return true;
    } catch (error) {
      console.error('Failed to auto-assign ticket:', error);
      return false;
    }
  }

  // Get agents
  async getAgents(activeOnly: boolean = true): Promise<Agent[]> {
    try {
      let query = supabase.from('support_agents').select('*');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToAgent);
    } catch (error) {
      console.error('Failed to get agents:', error);
      return [];
    }
  }

  // Create canned response
  async createCannedResponse(response: Omit<CannedResponse, 'id' | 'usageCount' | 'createdAt'>): Promise<CannedResponse> {
    try {
      const responseData = {
        title: response.title,
        content: response.content,
        category: response.category,
        tags: response.tags,
        usage_count: 0,
        created_by: response.createdBy,
        active: response.active,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('canned_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToCannedResponse(data);
    } catch (error: any) {
      console.error('Failed to create canned response:', error);
      throw error;
    }
  }

  // Get canned responses
  async getCannedResponses(category?: TicketCategory): Promise<CannedResponse[]> {
    try {
      let query = supabase
        .from('canned_responses')
        .select('*')
        .eq('active', true);

      if (category) {
        query = query.eq('category', category);
      }

      query = query.order('usage_count', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToCannedResponse);
    } catch (error) {
      console.error('Failed to get canned responses:', error);
      return [];
    }
  }

  // Search knowledge base
  async searchKnowledgeBase(query: string, limit: number = 10): Promise<KnowledgeBaseArticle[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('views', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToKnowledgeBaseArticle);
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      return [];
    }
  }

  // Submit satisfaction rating
  async submitSatisfaction(satisfaction: Omit<CustomerSatisfaction, 'id' | 'createdAt'>): Promise<CustomerSatisfaction> {
    try {
      const satisfactionData = {
        ticket_id: satisfaction.ticketId,
        customer_id: satisfaction.customerId,
        rating: satisfaction.rating,
        comment: satisfaction.comment,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('customer_satisfaction')
        .insert(satisfactionData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToCustomerSatisfaction(data);
    } catch (error: any) {
      console.error('Failed to submit satisfaction:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(days: number = 30): Promise<SupportAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: satisfaction } = await supabase
        .from('customer_satisfaction')
        .select('rating')
        .gte('created_at', startDate.toISOString());

      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => 
        t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS
      ).length || 0;

      // Calculate average response time
      const ticketsWithResponse = tickets?.filter(t => t.first_response_time !== null) || [];
      const averageResponseTime = ticketsWithResponse.length > 0
        ? ticketsWithResponse.reduce((sum, t) => sum + (t.first_response_time || 0), 0) / ticketsWithResponse.length
        : 0;

      // Calculate average resolution time
      const resolvedTickets = tickets?.filter(t => t.resolution_time !== null) || [];
      const averageResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => sum + (t.resolution_time || 0), 0) / resolvedTickets.length
        : 0;

      // Calculate satisfaction score
      const satisfactionScore = satisfaction && satisfaction.length > 0
        ? satisfaction.reduce((sum: number, s: any) => sum + s.rating, 0) / satisfaction.length
        : 0;

      // Calculate by category
      const byCategory: Record<TicketCategory, number> = {} as any;
      tickets?.forEach(t => {
        byCategory[t.category as TicketCategory] = (byCategory[t.category as TicketCategory] || 0) + 1;
      });

      // Calculate by priority
      const byPriority: Record<TicketPriority, number> = {} as any;
      tickets?.forEach(t => {
        byPriority[t.priority as TicketPriority] = (byPriority[t.priority as TicketPriority] || 0) + 1;
      });

      // Calculate by status
      const byStatus: Record<TicketStatus, number> = {} as any;
      tickets?.forEach(t => {
        byStatus[t.status as TicketStatus] = (byStatus[t.status as TicketStatus] || 0) + 1;
      });

      return {
        totalTickets,
        openTickets,
        averageResponseTime,
        averageResolutionTime,
        satisfactionScore,
        firstContactResolution: 0,
        byCategory,
        byPriority,
        byStatus,
        topAgents: [],
        trends: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        satisfactionScore: 0,
        firstContactResolution: 0,
        byCategory: {} as any,
        byPriority: {} as any,
        byStatus: {} as any,
        topAgents: [],
        trends: [],
      };
    }
  }

  // Helper methods
  private async generateTicketNumber(): Promise<string> {
    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true });

    return `TICKET-${String((count || 0) + 1).padStart(6, '0')}`;
  }

  private async updateFirstResponseTime(ticketId: string): Promise<void> {
    try {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('created_at, first_response_time')
        .eq('id', ticketId)
        .single();

      if (!ticket || ticket.first_response_time) return;

      const responseTime = Math.floor(
        (Date.now() - new Date(ticket.created_at).getTime()) / 1000
      );

      await supabase
        .from('support_tickets')
        .update({ first_response_time: responseTime })
        .eq('id', ticketId);
    } catch (error) {
      console.error('Failed to update first response time:', error);
    }
  }

  private async runAutomation(event: string, ticketId: string): Promise<void> {
    try {
      // Simplified automation - in production, fetch and execute rules
      console.log(`Running automation for ${event} on ticket ${ticketId}`);
    } catch (error) {
      console.error('Failed to run automation:', error);
    }
  }

  private mapToTicket(data: any): Ticket {
    return {
      id: data.id,
      number: data.number,
      customerId: data.customer_id,
      assignedTo: data.assigned_to,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: data.status,
      tags: data.tags,
      attachments: data.attachments,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at,
      closedAt: data.closed_at,
      firstResponseTime: data.first_response_time,
      resolutionTime: data.resolution_time,
    };
  }

  private mapToMessage(data: any): Message {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      type: data.type,
      content: data.content,
      attachments: data.attachments,
      isInternal: data.is_internal,
      createdAt: data.created_at,
    };
  }

  private mapToAgent(data: any): Agent {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      role: data.role,
      specialties: data.specialties,
      active: data.active,
      onlineStatus: data.online_status,
      maxTickets: data.max_tickets,
      currentTickets: data.current_tickets,
    };
  }

  private mapToCannedResponse(data: any): CannedResponse {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      usageCount: data.usage_count,
      createdBy: data.created_by,
      active: data.active,
      createdAt: data.created_at,
    };
  }

  private mapToKnowledgeBaseArticle(data: any): KnowledgeBaseArticle {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      views: data.views,
      helpful: data.helpful,
      notHelpful: data.not_helpful,
      relatedArticles: data.related_articles,
      status: data.status,
      authorId: data.author_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToCustomerSatisfaction(data: any): CustomerSatisfaction {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      customerId: data.customer_id,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const support = SupportSystem.getInstance();

// Convenience functions
export const createSupportTicket = (ticket: any) => support.createTicket(ticket);
export const getSupportTicket = (ticketId: string) => support.getTicket(ticketId);
export const listSupportTickets = (filters?: any) => support.listTickets(filters);
export const updateSupportTicket = (ticketId: string, updates: any) => support.updateTicket(ticketId, updates);
export const addTicketMessage = (message: any) => support.addMessage(message);
export const getTicketMessages = (ticketId: string, includeInternal?: boolean) => 
  support.getMessages(ticketId, includeInternal);
export const assignSupportTicket = (ticketId: string, agentId: string) => support.assignTicket(ticketId, agentId);
export const getSupportAgents = (activeOnly?: boolean) => support.getAgents(activeOnly);
export const createCannedResponse = (response: any) => support.createCannedResponse(response);
export const getCannedResponses = (category?: TicketCategory) => support.getCannedResponses(category);
export const searchKnowledgeBase = (query: string, limit?: number) => support.searchKnowledgeBase(query, limit);
export const submitCustomerSatisfaction = (satisfaction: any) => support.submitSatisfaction(satisfaction);
export const getSupportAnalytics = (days?: number) => support.getAnalytics(days);

