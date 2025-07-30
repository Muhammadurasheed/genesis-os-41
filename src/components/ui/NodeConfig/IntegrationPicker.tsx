
import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import { GlassCard } from '../GlassCard';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

const mockIntegrations: Integration[] = [
  { id: 'slack', name: 'Slack', description: 'Team communication', icon: '💬', category: 'Communication' },
  { id: 'gmail', name: 'Gmail', description: 'Email management', icon: '📧', category: 'Communication' },
  { id: 'shopify', name: 'Shopify', description: 'E-commerce platform', icon: '🛍️', category: 'E-commerce' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: '💳', category: 'Finance' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM and marketing', icon: '🎯', category: 'CRM' },
];

interface IntegrationPickerProps {
  onSelect: (integration: Integration) => void;
  selectedIntegrations: string[];
}

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({ onSelect, selectedIntegrations }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIntegrations = mockIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <GlassCard variant="medium" className="w-full max-w-md p-4">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredIntegrations.map((integration) => (
          <button
            key={integration.id}
            onClick={() => onSelect(integration)}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{integration.icon}</span>
              <div className="text-left">
                <h4 className="text-white font-medium">{integration.name}</h4>
                <p className="text-gray-400 text-sm">{integration.description}</p>
              </div>
            </div>
            {selectedIntegrations.includes(integration.id) && (
              <Check className="w-5 h-5 text-green-400" />
            )}
          </button>
        ))}
      </div>
    </GlassCard>
  );
};
