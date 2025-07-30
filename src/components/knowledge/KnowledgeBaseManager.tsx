import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

import { toast } from 'sonner';
import { 
  Upload, 
  File, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  Database,
  Globe,
  FileText
} from 'lucide-react';
import { knowledgeBaseService, KnowledgeBase, SearchResult } from '../../services/knowledgeBaseService';

interface KnowledgeBaseManagerProps {
  onKnowledgeBaseSelect?: (id: string) => void;
  selectedKnowledgeBaseIds?: string[];
  showSearch?: boolean;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  onKnowledgeBaseSelect,
  selectedKnowledgeBaseIds = [],
  showSearch = true
}) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const bases = await knowledgeBaseService.getKnowledgeBases();
      setKnowledgeBases(bases);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      toast.error('Failed to load knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validation = knowledgeBaseService.validateFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const successfulUploads: string[] = [];

    try {
      for (const file of selectedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        try {
          const knowledgeBaseId = await knowledgeBaseService.uploadFile(file);
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
          
          // Wait for processing to complete
          await knowledgeBaseService.waitForProcessing(knowledgeBaseId);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
          successfulUploads.push(file.name);
          toast.success(`${file.name} uploaded and processed successfully`);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Error state
        }
      }

      if (successfulUploads.length > 0) {
        await loadKnowledgeBases(); // Refresh the list
        setSelectedFiles([]);
        setUploadProgress({});
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await knowledgeBaseService.searchKnowledge(
        searchQuery,
        selectedKnowledgeBaseIds.length > 0 ? selectedKnowledgeBaseIds : undefined,
        20
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, selectedKnowledgeBaseIds]);

  const handleDelete = async (knowledgeBaseId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      return;
    }

    try {
      await knowledgeBaseService.deleteKnowledgeBase(knowledgeBaseId);
      toast.success('Knowledge base deleted successfully');
      await loadKnowledgeBases();
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      toast.error('Failed to delete knowledge base');
    }
  };

  const getStatusIcon = (status: KnowledgeBase['indexing_status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: KnowledgeBase['type']) => {
    switch (type) {
      case 'documents':
        return <FileText className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'website':
        return <Globe className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: KnowledgeBase['indexing_status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading knowledge bases...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Knowledge Files
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select Files</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.json,.xls,.xlsx"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: PDF, DOC, DOCX, TXT, CSV, JSON, XLS, XLSX (max 100MB each)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Selected Files:</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Upload Progress:</h4>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{fileName}</span>
                    <span>{progress === -1 ? 'Failed' : `${progress}%`}</span>
                  </div>
                  <Progress 
                    value={progress === -1 ? 100 : progress} 
                    className={progress === -1 ? 'bg-red-200' : ''}
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading and Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Search Section */}
      {showSearch && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Knowledge
          </h3>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Search across your knowledge bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Search Results:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{result.knowledge_base.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(result.similarity_score * 100).toFixed(1)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.content}
                    </p>
                    {result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Knowledge Bases List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Your Knowledge Bases ({knowledgeBases.length})
        </h3>

        {knowledgeBases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No knowledge bases yet</p>
            <p className="text-sm">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedKnowledgeBaseIds.includes(kb.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                } ${onKnowledgeBaseSelect ? 'cursor-pointer' : ''}`}
                onClick={() => onKnowledgeBaseSelect?.(kb.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(kb.type)}
                    <div>
                      <h4 className="font-medium">{kb.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {kb.chunk_count ? `${kb.chunk_count} chunks` : 'Processing...'}
                        {kb.file_metadata && (
                          <> • {(kb.file_metadata.size / 1024 / 1024).toFixed(2)} MB</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(kb.indexing_status)}>
                      {getStatusIcon(kb.indexing_status)}
                      <span className="ml-1 capitalize">{kb.indexing_status}</span>
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(kb.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {kb.indexing_status === 'failed' && kb.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    Error: {kb.error_message}
                  </div>
                )}

                <div className="mt-2 text-xs text-muted-foreground">
                  Created: {new Date(kb.created_at).toLocaleDateString()}
                  {kb.last_updated && (
                    <> • Updated: {new Date(kb.last_updated).toLocaleDateString()}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default KnowledgeBaseManager;