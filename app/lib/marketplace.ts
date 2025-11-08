import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD = 'sold',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  REMOVED = 'removed',
}

export enum ListingType {
  PRODUCT = 'product',
  SERVICE = 'service',
  DIGITAL = 'digital',
  RENTAL = 'rental',
  AUCTION = 'auction',
}

export enum Condition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ShippingType {
  FREE = 'free',
  FLAT_RATE = 'flat_rate',
  CALCULATED = 'calculated',
  LOCAL_PICKUP = 'local_pickup',
  DIGITAL = 'digital',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

export interface Listing {
  id: string;
  sellerId: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  condition?: Condition;
  quantity: number;
  images: string[];
  videos?: string[];
  specifications?: Record<string, any>;
  tags: string[];
  location: Location;
  shipping: ShippingOptions;
  status: ListingStatus;
  views: number;
  favorites: number;
  sold: number;
  featured: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  country: string;
  city: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ShippingOptions {
  type: ShippingType;
  flatRate?: number;
  freeShippingThreshold?: number;
  handling: {
    min: number;
    max: number;
  };
  carriers?: string[];
  international: boolean;
  excludedCountries?: string[];
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  price: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shipping: ShippingAddress;
  tracking?: TrackingInfo;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  url?: string;
  status: string;
  updates: Array<{
    timestamp: string;
    status: string;
    location?: string;
  }>;
}

export interface Review {
  id: string;
  listingId: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  response?: {
    comment: string;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfile {
  userId: string;
  businessName?: string;
  description?: string;
  logo?: string;
  banner?: string;
  verified: boolean;
  rating: number;
  totalReviews: number;
  totalSales: number;
  joinedAt: string;
  responseTime?: number;
  responseRate?: number;
  policies: {
    returns?: string;
    shipping?: string;
    payment?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  active: boolean;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: Condition[];
  location?: {
    country?: string;
    radius?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  shipping?: ShippingType[];
  sortBy?: 'recent' | 'price_low' | 'price_high' | 'popular' | 'relevant';
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  counterOffer?: {
    amount: number;
    message?: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceAnalytics {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  topSellers: Array<{
    sellerId: string;
    sales: number;
    revenue: number;
  }>;
  trends: Array<{
    date: string;
    listings: number;
    orders: number;
    revenue: number;
  }>;
}

class MarketplaceSystem {
  private static instance: MarketplaceSystem;

  private constructor() {}

  static getInstance(): MarketplaceSystem {
    if (!MarketplaceSystem.instance) {
      MarketplaceSystem.instance = new MarketplaceSystem();
    }
    return MarketplaceSystem.instance;
  }

  // Create listing
  async createListing(listing: Omit<Listing, 'id' | 'views' | 'favorites' | 'sold' | 'createdAt' | 'updatedAt'>): Promise<Listing> {
    try {
      const listingData = {
        seller_id: listing.sellerId,
        type: listing.type,
        title: listing.title,
        description: listing.description,
        category: listing.category,
        subcategory: listing.subcategory,
        price: listing.price,
        currency: listing.currency,
        condition: listing.condition,
        quantity: listing.quantity,
        images: listing.images,
        videos: listing.videos,
        specifications: listing.specifications,
        tags: listing.tags,
        location: listing.location,
        shipping: listing.shipping,
        status: listing.status,
        featured: listing.featured,
        published_at: listing.publishedAt,
        expires_at: listing.expiresAt,
        views: 0,
        favorites: 0,
        sold: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single();

      if (error) throw error;

      // Index for search
      await this.indexListing(data.id);

      return this.mapToListing(data);
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      throw error;
    }
  }

  // Get listing
  async getListing(listingId: string): Promise<Listing | null> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error || !data) return null;

      // Increment views
      await this.incrementViews(listingId);

      return this.mapToListing(data);
    } catch (error) {
      console.error('Failed to get listing:', error);
      return null;
    }
  }

  // Search listings
  async searchListings(filters: SearchFilters, limit: number = 20, offset: number = 0): Promise<Listing[]> {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', ListingStatus.ACTIVE);

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }

      if (filters.condition && filters.condition.length > 0) {
        query = query.in('condition', filters.condition);
      }

      if (filters.location?.country) {
        query = query.eq('location->>country', filters.location.country);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToListing);
    } catch (error) {
      console.error('Failed to search listings:', error);
      return [];
    }
  }

  // Create order
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const listing = await this.getListing(order.listingId);

      if (!listing) {
        throw new Error('Listing not found');
      }

      if (listing.quantity < order.quantity) {
        throw new Error('Insufficient quantity available');
      }

      const orderData = {
        listing_id: order.listingId,
        buyer_id: order.buyerId,
        seller_id: order.sellerId,
        quantity: order.quantity,
        price: order.price,
        shipping_cost: order.shippingCost,
        tax: order.tax,
        total_amount: order.totalAmount,
        currency: order.currency,
        status: OrderStatus.PENDING,
        shipping: order.shipping,
        tracking: order.tracking,
        notes: order.notes,
        metadata: order.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Update listing quantity
      await this.updateListingQuantity(order.listingId, -order.quantity);

      return this.mapToOrder(data);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Get order
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) return null;

      return this.mapToOrder(data);
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus, tracking?: TrackingInfo): Promise<boolean> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (tracking) {
        updates.tracking = tracking;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // If delivered, update sold count
      if (status === OrderStatus.DELIVERED) {
        const order = await this.getOrder(orderId);
        if (order) {
          await this.incrementSoldCount(order.listingId, order.quantity);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  }

  // Create review
  async createReview(review: Omit<Review, 'id' | 'helpful' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    try {
      const reviewData = {
        listing_id: review.listingId,
        order_id: review.orderId,
        reviewer_id: review.reviewerId,
        reviewee_id: review.revieweeId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        verified: review.verified,
        helpful: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      // Update seller rating
      await this.updateSellerRating(review.revieweeId);

      return this.mapToReview(data);
    } catch (error: any) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  // Get reviews
  async getReviews(listingId: string, limit: number = 20): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToReview);
    } catch (error) {
      console.error('Failed to get reviews:', error);
      return [];
    }
  }

  // Get seller profile
  async getSellerProfile(userId: string): Promise<SellerProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) return null;

      // Get stats
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId);

      const totalSales = listings?.reduce((sum, l) => sum + l.sold, 0) || 0;
      const totalReviews = reviews?.length || 0;
      const rating = totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0;

      return {
        userId: profile.user_id,
        businessName: profile.business_name,
        description: profile.description,
        logo: profile.logo,
        banner: profile.banner,
        verified: profile.verified,
        rating,
        totalReviews,
        totalSales,
        joinedAt: profile.created_at,
        responseTime: profile.response_time,
        responseRate: profile.response_rate,
        policies: profile.policies,
      };
    } catch (error) {
      console.error('Failed to get seller profile:', error);
      return null;
    }
  }

  // Add to favorites
  async addToFavorites(userId: string, listingId: string): Promise<boolean> {
    try {
      await supabase.from('favorites').insert({
        user_id: userId,
        listing_id: listingId,
        created_at: new Date().toISOString(),
      });

      // Increment favorites count
      await supabase.rpc('increment_favorites', { listing_id_param: listingId });

      return true;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId: string, listingId: string): Promise<boolean> {
    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      await supabase.rpc('decrement_favorites', { listing_id_param: listingId });

      return true;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    }
  }

  // Create offer
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer> {
    try {
      const offerData = {
        listing_id: offer.listingId,
        buyer_id: offer.buyerId,
        amount: offer.amount,
        message: offer.message,
        status: offer.status,
        expires_at: offer.expiresAt,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToOffer(data);
    } catch (error: any) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  // Get categories
  async getCategories(parentId?: string): Promise<Category[]> {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('active', true);

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      query = query.order('order', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToCategory);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  // Get analytics
  async getAnalytics(days: number = 30): Promise<MarketplaceAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: listings } = await supabase
        .from('listings')
        .select('*');

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const activeListings = listings?.filter(l => l.status === ListingStatus.ACTIVE).length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const averageOrderValue = orders?.length ? totalRevenue / orders.length : 0;

      // Calculate conversion rate (orders / views)
      const totalViews = listings?.reduce((sum, l) => sum + l.views, 0) || 0;
      const conversionRate = totalViews > 0 ? (orders?.length || 0) / totalViews * 100 : 0;

      return {
        totalListings: listings?.length || 0,
        activeListings,
        totalOrders: orders?.length || 0,
        totalRevenue,
        averageOrderValue,
        conversionRate,
        topCategories: [],
        topSellers: [],
        trends: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalListings: 0,
        activeListings: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        topCategories: [],
        topSellers: [],
        trends: [],
      };
    }
  }

  // Helper methods
  private async indexListing(listingId: string): Promise<void> {
    try {
      // Index for search engine
      await supabase.rpc('index_listing_for_search', { listing_id_param: listingId });
    } catch (error) {
      console.error('Failed to index listing:', error);
    }
  }

  private async incrementViews(listingId: string): Promise<void> {
    try {
      await supabase.rpc('increment_listing_views', { listing_id_param: listingId });
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }

  private async updateListingQuantity(listingId: string, delta: number): Promise<void> {
    try {
      const { data: listing } = await supabase
        .from('listings')
        .select('quantity')
        .eq('id', listingId)
        .single();

      if (listing) {
        const newQuantity = listing.quantity + delta;
        await supabase
          .from('listings')
          .update({ 
            quantity: newQuantity,
            status: newQuantity <= 0 ? ListingStatus.SOLD : listing.status,
          })
          .eq('id', listingId);
      }
    } catch (error) {
      console.error('Failed to update listing quantity:', error);
    }
  }

  private async incrementSoldCount(listingId: string, quantity: number): Promise<void> {
    try {
      await supabase.rpc('increment_sold_count', { 
        listing_id_param: listingId,
        quantity_param: quantity,
      });
    } catch (error) {
      console.error('Failed to increment sold count:', error);
    }
  }

  private async updateSellerRating(sellerId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', sellerId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from('seller_profiles')
          .update({ rating: avgRating })
          .eq('user_id', sellerId);
      }
    } catch (error) {
      console.error('Failed to update seller rating:', error);
    }
  }

  private mapToListing(data: any): Listing {
    return {
      id: data.id,
      sellerId: data.seller_id,
      type: data.type,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      price: data.price,
      currency: data.currency,
      condition: data.condition,
      quantity: data.quantity,
      images: data.images,
      videos: data.videos,
      specifications: data.specifications,
      tags: data.tags,
      location: data.location,
      shipping: data.shipping,
      status: data.status,
      views: data.views,
      favorites: data.favorites,
      sold: data.sold,
      featured: data.featured,
      publishedAt: data.published_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToOrder(data: any): Order {
    return {
      id: data.id,
      listingId: data.listing_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      quantity: data.quantity,
      price: data.price,
      shippingCost: data.shipping_cost,
      tax: data.tax,
      totalAmount: data.total_amount,
      currency: data.currency,
      status: data.status,
      shipping: data.shipping,
      tracking: data.tracking,
      notes: data.notes,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToReview(data: any): Review {
    return {
      id: data.id,
      listingId: data.listing_id,
      orderId: data.order_id,
      reviewerId: data.reviewer_id,
      revieweeId: data.reviewee_id,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      images: data.images,
      helpful: data.helpful,
      verified: data.verified,
      response: data.response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToOffer(data: any): Offer {
    return {
      id: data.id,
      listingId: data.listing_id,
      buyerId: data.buyer_id,
      amount: data.amount,
      message: data.message,
      status: data.status,
      counterOffer: data.counter_offer,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }

  private mapToCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      parentId: data.parent_id,
      order: data.order,
      active: data.active,
    };
  }
}

// Export singleton instance
export const marketplace = MarketplaceSystem.getInstance();

// Convenience functions
export const createListing = (listing: any) => marketplace.createListing(listing);
export const getListing = (listingId: string) => marketplace.getListing(listingId);
export const searchListings = (filters: SearchFilters, limit?: number, offset?: number) =>
  marketplace.searchListings(filters, limit, offset);
export const createOrder = (order: any) => marketplace.createOrder(order);
export const getOrder = (orderId: string) => marketplace.getOrder(orderId);
export const createReview = (review: any) => marketplace.createReview(review);
export const getSellerProfile = (userId: string) => marketplace.getSellerProfile(userId);
export const addToFavorites = (userId: string, listingId: string) => marketplace.addToFavorites(userId, listingId);
export const createOffer = (offer: any) => marketplace.createOffer(offer);
export const getMarketplaceAnalytics = (days?: number) => marketplace.getAnalytics(days);

