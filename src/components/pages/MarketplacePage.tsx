import React, { useState } from 'react';
import { Search, Star, Download, Eye, Heart } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  previewImage: string;
  price: number;
  category: string;
}

const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: '1',
    title: 'AI-Powered Content Generator',
    description: 'Generate high-quality content for your blog or website using AI.',
    author: 'InnovateTech',
    rating: 4.5,
    downloads: 1250,
    previewImage: '/api/placeholder/256/144',
    price: 49.99,
    category: 'Content Creation'
  },
  {
    id: '2',
    title: 'Automated Social Media Manager',
    description: 'Schedule and manage your social media posts with ease.',
    author: 'SocialAI',
    rating: 4.2,
    downloads: 875,
    previewImage: '/api/placeholder/256/144',
    price: 29.99,
    category: 'Social Media'
  },
  {
    id: '3',
    title: 'Smart Email Marketing Tool',
    description: 'Send personalized email campaigns to your subscribers.',
    author: 'EmailPro',
    rating: 4.8,
    downloads: 1520,
    previewImage: '/api/placeholder/256/144',
    price: 79.99,
    category: 'Email Marketing'
  },
  {
    id: '4',
    title: 'Advanced SEO Analyzer',
    description: 'Analyze your website\'s SEO performance and get recommendations.',
    author: 'SEOMaster',
    rating: 4.0,
    downloads: 640,
    previewImage: '/api/placeholder/256/144',
    price: 39.99,
    category: 'SEO'
  },
  {
    id: '5',
    title: 'AI-Driven Customer Support',
    description: 'Provide instant customer support with an AI-powered chatbot.',
    author: 'SupportGenius',
    rating: 4.6,
    downloads: 980,
    previewImage: '/api/placeholder/256/144',
    price: 59.99,
    category: 'Customer Support'
  },
  {
    id: '6',
    title: 'Predictive Analytics Dashboard',
    description: 'Visualize your data and make informed decisions with predictive analytics.',
    author: 'DataInsights',
    rating: 4.3,
    downloads: 760,
    previewImage: '/api/placeholder/256/144',
    price: 69.99,
    category: 'Analytics'
  }
];

export const MarketplacePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(mockMarketplaceItems.map(item => item.category))];

  const filteredItems = mockMarketplaceItems.filter(item => {
    const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'All' || item.category === categoryFilter;
    return searchMatch && categoryMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">AI Marketplace</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for AI tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute top-1/2 right-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <HolographicButton variant="primary" glow>
              <Download className="w-4 h-4 mr-2" />
              Upload Your AI
            </HolographicButton>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-4 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm ${
                categoryFilter === category
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Marketplace Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <GlassCard key={item.id} variant="medium" className="p-6">
            <img src={item.previewImage} alt={item.title} className="rounded-lg mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-gray-400 mb-4">{item.description}</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className={`w-4 h-4 ${index < item.rating ? '' : 'text-gray-500'}`} />
                  ))}
                  <span className="text-gray-400 ml-2">({item.rating.toFixed(1)})</span>
                </div>
                <p className="text-gray-400 text-sm">By {item.author}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${item.price.toFixed(2)}</p>
                <p className="text-gray-400 text-sm">{item.downloads} downloads</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <HolographicButton variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </HolographicButton>
              <HolographicButton variant="primary" glow>
                <Heart className="w-4 h-4 mr-2" />
                Add to Wishlist
              </HolographicButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
