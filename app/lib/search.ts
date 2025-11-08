import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface SearchOptions {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
  caseSensitive?: boolean;
  fields?: string[];
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  took: number; // milliseconds
}

export interface IndexConfig {
  table: string;
  searchFields: string[];
  displayFields?: string[];
  filters?: Record<string, (value: any) => string>;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'recent';
  score: number;
}

class SearchSystem {
  private static instance: SearchSystem;
  private indexes: Map<string, IndexConfig> = new Map();
  private searchHistory: Map<string, string[]> = new Map();
  private readonly MAX_HISTORY = 10;

  private constructor() {}

  static getInstance(): SearchSystem {
    if (!SearchSystem.instance) {
      SearchSystem.instance = new SearchSystem();
    }
    return SearchSystem.instance;
  }

  // Register a search index
  registerIndex(name: string, config: IndexConfig): void {
    this.indexes.set(name, config);
  }

  // Search across an index
  async search<T = any>(
    indexName: string,
    options: SearchOptions
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();

    try {
      const index = this.indexes.get(indexName);
      if (!index) {
        throw new Error(`Index ${indexName} not found`);
      }

      // Build query
      let query = supabase.from(index.table).select('*', { count: 'exact' });

      // Apply search across fields
      if (options.query && options.query.trim()) {
        const searchQuery = options.fuzzy
          ? this.buildFuzzyQuery(options.query)
          : options.query;

        const searchConditions = index.searchFields
          .map(field => `${field}.ilike.%${searchQuery}%`)
          .join(',');

        query = query.or(searchConditions);
      }

      // Apply filters
      if (options.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(field, value);
            } else if (typeof value === 'object' && value.operator) {
              // Complex filter: { operator: 'gte', value: 100 }
              const op = value.operator;
              const val = value.value;
              
              switch (op) {
                case 'gte':
                  query = query.gte(field, val);
                  break;
                case 'lte':
                  query = query.lte(field, val);
                  break;
                case 'gt':
                  query = query.gt(field, val);
                  break;
                case 'lt':
                  query = query.lt(field, val);
                  break;
                case 'neq':
                  query = query.neq(field, val);
                  break;
                default:
                  query = query.eq(field, val);
              }
            } else {
              query = query.eq(field, value);
            }
          }
        }
      }

      // Apply sorting
      if (options.sort) {
        query = query.order(options.sort.field, {
          ascending: options.sort.direction === 'asc',
        });
      }

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) throw error;

      // Calculate metrics
      const took = Date.now() - startTime;
      const total = count || 0;
      const page = Math.floor(offset / limit) + 1;
      const hasMore = offset + limit < total;

      // Save to search history
      this.addToHistory(indexName, options.query);

      return {
        items: data as T[],
        total,
        page,
        pageSize: limit,
        hasMore,
        took,
      };
    } catch (error: any) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Multi-index search
  async searchMultiple<T = any>(
    indexNames: string[],
    options: SearchOptions
  ): Promise<Record<string, SearchResult<T>>> {
    const results: Record<string, SearchResult<T>> = {};

    await Promise.all(
      indexNames.map(async (indexName) => {
        try {
          results[indexName] = await this.search<T>(indexName, options);
        } catch (error) {
          console.error(`Error searching ${indexName}:`, error);
          results[indexName] = {
            items: [],
            total: 0,
            page: 1,
            pageSize: options.limit || 20,
            hasMore: false,
            took: 0,
          };
        }
      })
    );

    return results;
  }

  // Get search suggestions
  async getSuggestions(
    indexName: string,
    query: string,
    limit: number = 5
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    try {
      // Get recent searches
      const history = this.searchHistory.get(indexName) || [];
      const recentMatches = history
        .filter(h => h.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(text => ({
          text,
          type: 'recent' as const,
          score: 0.8,
        }));

      suggestions.push(...recentMatches);

      // Get popular searches
      const { data: popular } = await supabase
        .from('search_analytics')
        .select('query, count')
        .eq('index_name', indexName)
        .ilike('query', `%${query}%`)
        .order('count', { ascending: false })
        .limit(limit - suggestions.length);

      if (popular) {
        const popularSuggestions = popular.map(p => ({
          text: p.query,
          type: 'query' as const,
          score: Math.min(p.count / 100, 1),
        }));
        suggestions.push(...popularSuggestions);
      }

      // Sort by score and limit
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  // Build fuzzy query
  private buildFuzzyQuery(query: string): string {
    // Simple fuzzy search - add wildcards between characters
    return query.split('').join('%');
  }

  // Add to search history
  private addToHistory(indexName: string, query: string): void {
    if (!query || !query.trim()) return;

    const history = this.searchHistory.get(indexName) || [];
    
    // Remove if already exists
    const filtered = history.filter(h => h !== query);
    
    // Add to front
    filtered.unshift(query);
    
    // Limit size
    const limited = filtered.slice(0, this.MAX_HISTORY);
    
    this.searchHistory.set(indexName, limited);

    // Log to analytics
    this.logSearch(indexName, query);
  }

  // Log search for analytics
  private async logSearch(indexName: string, query: string): Promise<void> {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('search_analytics')
        .select('id, count')
        .eq('index_name', indexName)
        .eq('query', query)
        .single();

      if (existing) {
        // Increment count
        await supabase
          .from('search_analytics')
          .update({
            count: existing.count + 1,
            last_searched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase.from('search_analytics').insert({
          index_name: indexName,
          query,
          count: 1,
          last_searched_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  // Get search history
  getHistory(indexName: string): string[] {
    return this.searchHistory.get(indexName) || [];
  }

  // Clear search history
  clearHistory(indexName?: string): void {
    if (indexName) {
      this.searchHistory.delete(indexName);
    } else {
      this.searchHistory.clear();
    }
  }

  // Get popular searches
  async getPopularSearches(
    indexName: string,
    limit: number = 10
  ): Promise<Array<{ query: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, count')
        .eq('index_name', indexName)
        .order('count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }

  // Get search trends
  async getSearchTrends(
    indexName: string,
    days: number = 7
  ): Promise<Array<{ date: string; count: number; uniqueQueries: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, count, last_searched_at')
        .eq('index_name', indexName)
        .gte('last_searched_at', startDate.toISOString());

      if (error) throw error;

      // Group by date
      const grouped: Record<string, { count: number; queries: Set<string> }> = {};

      data?.forEach(item => {
        const date = new Date(item.last_searched_at).toISOString().split('T')[0];
        if (!grouped[date]) {
          grouped[date] = { count: 0, queries: new Set() };
        }
        grouped[date].count += item.count;
        grouped[date].queries.add(item.query);
      });

      return Object.entries(grouped).map(([date, stats]) => ({
        date,
        count: stats.count,
        uniqueQueries: stats.queries.size,
      }));
    } catch (error) {
      console.error('Error getting search trends:', error);
      return [];
    }
  }

  // Advanced full-text search (requires PostgreSQL full-text search)
  async fullTextSearch<T = any>(
    indexName: string,
    query: string,
    options: Omit<SearchOptions, 'query'> & { language?: string } = {}
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();

    try {
      const index = this.indexes.get(indexName);
      if (!index) {
        throw new Error(`Index ${indexName} not found`);
      }

      const language = options.language || 'english';

      // Use PostgreSQL full-text search
      const { data, error, count } = await supabase.rpc('full_text_search', {
        search_table: index.table,
        search_query: query,
        search_fields: index.searchFields,
        search_language: language,
        result_limit: options.limit || 20,
        result_offset: options.offset || 0,
      });

      if (error) throw error;

      const took = Date.now() - startTime;
      const total = count || 0;
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      return {
        items: data as T[],
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore: offset + limit < total,
        took,
      };
    } catch (error: any) {
      console.error('Full-text search error:', error);
      // Fallback to basic search
      return this.search<T>(indexName, { ...options, query });
    }
  }

  // Highlight search terms in text
  highlightMatches(text: string, query: string, tag: string = 'mark'): string {
    if (!query || !query.trim()) return text;

    const terms = query.split(/\s+/).filter(t => t.length > 2);
    let highlighted = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, `<${tag}>$1</${tag}>`);
    });

    return highlighted;
  }

  // Extract search snippet
  extractSnippet(
    text: string,
    query: string,
    maxLength: number = 200
  ): string {
    if (!query || !query.trim()) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const terms = query.toLowerCase().split(/\s+/);
    const lowerText = text.toLowerCase();

    // Find first match
    let matchIndex = -1;
    for (const term of terms) {
      const index = lowerText.indexOf(term);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
      }
    }

    if (matchIndex === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Extract snippet around match
    const start = Math.max(0, matchIndex - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);

    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}

// Export singleton instance
export const search = SearchSystem.getInstance();

// Pre-configured search indexes
export const SearchIndexes = {
  USERS: 'users',
  ESCROWS: 'escrows',
  TRANSACTIONS: 'transactions',
  PAYMENTS: 'payments',
  DISPUTES: 'disputes',
};

// Register default indexes
search.registerIndex(SearchIndexes.USERS, {
  table: 'users',
  searchFields: ['name', 'email', 'username'],
  displayFields: ['id', 'name', 'email', 'created_at'],
});

search.registerIndex(SearchIndexes.ESCROWS, {
  table: 'escrow_transactions',
  searchFields: ['title', 'description', 'id'],
  displayFields: ['id', 'title', 'amount', 'status', 'created_at'],
});

search.registerIndex(SearchIndexes.TRANSACTIONS, {
  table: 'transactions',
  searchFields: ['id', 'reference', 'description'],
  displayFields: ['id', 'amount', 'status', 'created_at'],
});

// Convenience functions
export const searchUsers = (options: SearchOptions) =>
  search.search(SearchIndexes.USERS, options);

export const searchEscrows = (options: SearchOptions) =>
  search.search(SearchIndexes.ESCROWS, options);

export const searchTransactions = (options: SearchOptions) =>
  search.search(SearchIndexes.TRANSACTIONS, options);

export const getSearchSuggestions = (indexName: string, query: string, limit?: number) =>
  search.getSuggestions(indexName, query, limit);

export const getSearchHistory = (indexName: string) =>
  search.getHistory(indexName);

// Example usage
export const exampleUsage = async () => {
  // Basic search
  const results = await searchUsers({
    query: 'john',
    limit: 10,
  });

  // Advanced search with filters
  const escrowResults = await searchEscrows({
    query: 'payment',
    filters: {
      status: 'active',
      amount: { operator: 'gte', value: 1000 },
    },
    sort: {
      field: 'created_at',
      direction: 'desc',
    },
    limit: 20,
  });

  // Multi-index search
  const multiResults = await search.searchMultiple(
    [SearchIndexes.USERS, SearchIndexes.ESCROWS],
    { query: 'john' }
  );

  // Get suggestions
  const suggestions = await getSearchSuggestions(SearchIndexes.USERS, 'jo', 5);

  // Get popular searches
  const popular = await search.getPopularSearches(SearchIndexes.ESCROWS, 10);
};

