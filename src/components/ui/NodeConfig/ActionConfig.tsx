
import React, { useState } from 'react';
import { Mail, MessageSquare, Database, Webhook, Code2, Send } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { HolographicButton } from '../HolographicButton';

interface ActionConfigProps {
  nodeData: any;
  onUpdate: (data: any) => void;
}

export const ActionConfig: React.FC<ActionConfigProps> = ({ nodeData, onUpdate }) => {
  const [actionType, setActionType] = useState(nodeData?.actionType || 'email');
  const [config, setConfig] = useState({
    recipient: nodeData?.recipient || '',
    subject: nodeData?.subject || '',
    message: nodeData?.message || '',
    ...nodeData
  });

  const actionTypes = [
    { id: 'email', name: 'Send Email', icon: Mail },
    { id: 'webhook', name: 'Call Webhook', icon: Webhook },
    { id: 'database', name: 'Database Query', icon: Database },
    { id: 'message', name: 'Send Message', icon: MessageSquare },
    { id: 'custom', name: 'Custom Script', icon: Code2 },
  ];

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({ ...nodeData, actionType, ...newConfig });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setActionType(newType);
    onUpdate({ ...nodeData, actionType: newType, ...config });
  };

  return (
    <GlassCard variant="medium" className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Action Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Action Type
          </label>
          <select
            value={actionType}
            onChange={handleTypeChange}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            {actionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {actionType === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Recipient
              </label>
              <input
                type="email"
                value={config.recipient}
                onChange={(e) => handleConfigChange('recipient', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Subject
              </label>
              <input
                type="text"
                value={config.subject}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="Email subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Message
              </label>
              <textarea
                value={config.message}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="Email message content"
              />
            </div>
          </>
        )}

        {actionType === 'webhook' && (
          <>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                placeholder="https://api.example.com/webhook"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Method
              </label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <HolographicButton variant="primary" size="sm">
            <Send className="w-4 h-4 mr-2" />
            Save Configuration
          </HolographicButton>
        </div>
      </div>
    </GlassCard>
  );
};
