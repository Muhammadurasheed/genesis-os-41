/**
 * Enhanced Agent Marketplace with Publishing & Template Sharing
 * Phase 3: Agent Intelligence - Marketplace Foundation
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Star, 
  Eye, 
  Code,
  Shield
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/Card';
import { HolographicButton } from '../ui/HolographicButton';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    reputation: number;
  };
  category: string;
  tags: string[];
  pricing: {
    type: 'free' | 'premium' | 'enterprise';
    price?: number;
  };
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    forks: number;
  };
  preview: {
    thumbnail: string;
    screenshots: string[];
    demoUrl?: string;
  };
  technical: {
    version: string;
    compatibility: string[];
    requirements: string[];
    integrations: string[];
  };
  metadata: {
    publishedAt: string;
    updatedAt: string;
    size: string;
    complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  workflow?: any; // Workflow JSON
}

const mockAgentTemplates: AgentTemplate[] = [
  {
    id: '1',
    name: 'E-commerce Customer Support Suite',
    description: 'Complete customer support automation with order tracking, returns, and live chat escalation.',
    author: {
      id: 'user1',
      name: 'Sarah Mitchell',
      avatar: '/api/placeholder/40/40',
      verified: true,
      reputation: 4.8
    },
    category: 'Customer Service',
    tags: ['e-commerce', 'support', 'automation', 'chat'],
    pricing: { type: 'premium', price: 99.99 },
    stats: {
      downloads: 2847,
      rating: 4.7,
      reviews: 156,
      forks: 23
    },
    preview: {
      thumbnail: '/api/placeholder/300/200',
      screenshots: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
      demoUrl: 'https://demo.genesis.ai/ecommerce-support'
    },
    technical: {
      version: '2.1.0',
      compatibility: ['Shopify', 'WooCommerce', 'BigCommerce'],
      requirements: ['API Keys', 'Webhook URLs'],
      integrations: ['Slack', 'Zendesk', 'Stripe']
    },
    metadata: {
      publishedAt: '2024-01-15',
      updatedAt: '2024-03-10',
      size: '2.3 MB',
      complexity: 'intermediate'
    }
  },
  {
    id: '2',
    name: 'Content Marketing Automation',
    description: 'AI-powered content creation, scheduling, and social media management across platforms.',
    author: {
      id: 'user2',
      name: 'Alex Rodriguez',
      avatar: '/api/placeholder/40/40',
      verified: true,
      reputation: 4.9
    },
    category: 'Marketing',
    tags: ['content', 'social-media', 'scheduling', 'seo'],
    pricing: { type: 'free' },
    stats: {
      downloads: 5432,
      rating: 4.6,
      reviews: 289,
      forks: 67
    },
    preview: {
      thumbnail: '/api/placeholder/300/200',
      screenshots: ['/api/placeholder/600/400']
    },
    technical: {
      version: '1.5.2',
      compatibility: ['Twitter API', 'LinkedIn API', 'Instagram API'],
      requirements: ['Social Media Tokens'],
      integrations: ['Buffer', 'Hootsuite', 'Canva']
    },
    metadata: {
      publishedAt: '2024-02-01',
      updatedAt: '2024-03-15',
      size: '1.8 MB',
      complexity: 'beginner'
    }
  }
];

export const AgentMarketplace: React.FC = () => {
  const [templates] = useState<AgentTemplate[]>(mockAgentTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'recent' | 'price'>('popularity');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates
    .filter(template => {
      const searchMatch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const categoryMatch = selectedCategory === 'All' || template.category === selectedCategory;
      return searchMatch && categoryMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.stats.downloads - a.stats.downloads;
        case 'rating':
          return b.stats.rating - a.stats.rating;
        case 'recent':
          return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
        case 'price':
          const aPrice = a.pricing.price || 0;
          const bPrice = b.pricing.price || 0;
          return aPrice - bPrice;
        default:
          return 0;
      }
    });

  const handleInstallTemplate = (template: AgentTemplate) => {
    toast.success(`Installing ${template.name}...`, {
      description: 'This will add the agent template to your workspace'
    });
    
    // Simulate installation
    setTimeout(() => {
      toast.success('Template installed successfully!', {
        description: 'You can now customize and deploy this agent'
      });
    }, 2000);
  };

  const handlePreviewTemplate = (template: AgentTemplate) => {
    toast.success(`Previewing ${template.name}...`, {
      description: 'Opening template preview'
    });
  };

  const renderPricingBadge = (pricing: AgentTemplate['pricing']) => {
    switch (pricing.type) {
      case 'free':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400">Free</Badge>;
      case 'premium':
        return <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-400">${pricing.price}</Badge>;
      case 'enterprise':
        return <Badge variant="outline" className="bg-gold-500/20 text-gold-400 border-gold-400">Enterprise</Badge>;
    }
  };

  const renderComplexityBadge = (complexity: AgentTemplate['metadata']['complexity']) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400 border-green-400',
      intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-400',
      advanced: 'bg-orange-500/20 text-orange-400 border-orange-400',
      expert: 'bg-red-500/20 text-red-400 border-red-400'
    };
    
    return (
      <Badge variant="outline" className={colors[complexity]}>
        {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Agent Marketplace</h1>
              <p className="text-gray-300">Discover, share, and deploy AI agent templates</p>
            </div>
            
            <div className="flex items-center gap-3">
              <HolographicButton variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </HolographicButton>
              
              <HolographicButton variant="primary" glow>
                <Upload className="w-4 h-4 mr-2" />
                Publish Agent
              </HolographicButton>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents, categories, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="recent">Recently Updated</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>

          {/* Category Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group"
          >
            <Card className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 h-full">
              <CardContent className="p-0">
                {/* Template Thumbnail */}
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={template.preview.thumbnail} 
                    alt={template.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {renderPricingBadge(template.pricing)}
                    {renderComplexityBadge(template.metadata.complexity)}
                  </div>
                  
                  {template.author.verified && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Template Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={template.author.avatar} 
                        alt={template.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-gray-300 text-sm">{template.author.name}</span>
                      <div className="flex items-center text-yellow-400 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        {template.author.reputation}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-white/5 text-gray-400 border-gray-600">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white/5 text-gray-400 border-gray-600">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {template.stats.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {template.stats.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Code className="w-3 h-3" />
                          {template.stats.forks}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleInstallTemplate(template)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Install
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria or browse different categories</p>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};