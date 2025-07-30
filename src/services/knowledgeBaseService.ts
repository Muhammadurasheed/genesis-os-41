import { supabase } from '../lib/supabase';

export interface KnowledgeBase {
  id: string;
  owner_id: string;
  name: string;
  type: 'documents' | 'database' | 'api' | 'website';
  indexing_status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path?: string;
  file_metadata?: {
    original_name: string;
    size: number;
    mime_type: string;
  };
  chunk_count?: number;
  last_updated: string;
  error_message?: string;
  created_at: string;
}

export interface MemorySegment {
  id: string;
  knowledge_base_id: string;
  content: string;
  embedding: number[];
  chunk_index: number;
  importance_score: number;
  tags: string[];
  created_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity_score: number;
  knowledge_base: {
    id: string;
    name: string;
  };
  tags: string[];
}

class KnowledgeBaseService {
  async uploadFile(file: File, name?: string, type: string = 'documents'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name);
    formData.append('type', type);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-management/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();
    return result.knowledge_base_id;
  }

  async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-management/knowledge-bases`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch knowledge bases');
    }

    const result = await response.json();
    return result.knowledge_bases;
  }

  async getProcessingStatus(knowledgeBaseId: string): Promise<KnowledgeBase> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-management/process-status?id=${knowledgeBaseId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get processing status');
    }

    const result = await response.json();
    return result.status;
  }

  async searchKnowledge(
    query: string,
    knowledgeBaseIds?: string[],
    limit: number = 10
  ): Promise<SearchResult[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-management/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        knowledge_base_ids: knowledgeBaseIds,
        limit
      })
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const result = await response.json();
    return result.results;
  }

  async deleteKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/knowledge-management?id=${knowledgeBaseId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete knowledge base');
    }
  }

  // Frontend utility methods
  async waitForProcessing(knowledgeBaseId: string, timeoutMs: number = 300000): Promise<KnowledgeBase> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getProcessingStatus(knowledgeBaseId);
      
      if (status.indexing_status === 'completed') {
        return status;
      }
      
      if (status.indexing_status === 'failed') {
        throw new Error(`Processing failed: ${status.error_message}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Processing timeout - please check status manually');
  }

  async uploadAndWaitForProcessing(
    file: File,
    name?: string,
    type: string = 'documents'
  ): Promise<KnowledgeBase> {
    const knowledgeBaseId = await this.uploadFile(file, name, type);
    return this.waitForProcessing(knowledgeBaseId);
  }

  // Batch operations
  async uploadMultipleFiles(
    files: File[],
    type: string = 'documents'
  ): Promise<string[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, file.name, type)
    );
    
    return Promise.all(uploadPromises);
  }

  async searchMultipleKnowledgeBases(
    queries: string[],
    knowledgeBaseIds?: string[],
    limit: number = 10
  ): Promise<SearchResult[][]> {
    const searchPromises = queries.map(query =>
      this.searchKnowledge(query, knowledgeBaseIds, limit)
    );
    
    return Promise.all(searchPromises);
  }

  // Helper methods for file validation
  isValidFileType(file: File): boolean {
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedTypes.includes(file.type);
  }

  isValidFileSize(file: File, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.isValidFileType(file)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, CSV, JSON, XLS, or XLSX files.'
      };
    }
    
    if (!this.isValidFileSize(file)) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 100MB.'
      };
    }
    
    return { isValid: true };
  }

  // Analytics and insights
  async getKnowledgeBaseInsights(knowledgeBaseId: string) {
    const segments = await supabase
      .from('memory_segments')
      .select('importance_score, tags, created_at')
      .eq('knowledge_base_id', knowledgeBaseId);

    if (segments.error) throw segments.error;

    const data = segments.data || [];
    
    return {
      total_segments: data.length,
      avg_importance: data.reduce((sum: number, seg: any) => sum + seg.importance_score, 0) / data.length,
      top_tags: this.getTopTags(data.flatMap((seg: any) => seg.tags), 10),
      processing_date: data[0]?.created_at
    };
  }

  private getTopTags(tags: string[], limit: number): Array<{ tag: string; count: number }> {
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();