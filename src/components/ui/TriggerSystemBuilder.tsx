import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Globe, 
  Mail, 
  FileText, 
  Zap, 
  Settings, 
  Play, 
  Pause,
  Trash2,
  Database
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { HolographicButton } from './HolographicButton';

export interface TriggerDefinition {
  id: string;
  workflow_id: string;
  type: 'schedule' | 'webhook' | 'email' | 'file_watch' | 'database' | 'manual';
  config: TriggerConfig;
  status: 'active' | 'paused' | 'error';
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
}

export interface TriggerConfig {
  schedule?: ScheduleTriggerConfig;
  webhook?: WebhookTriggerConfig;
  email?: EmailTriggerConfig;
  file_watch?: FileWatchTriggerConfig;
  database?: DatabaseTriggerConfig;
}

interface ScheduleTriggerConfig {
  frequency: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  interval: number;
  time_zone: string;
  specific_times?: string[];
  days_of_week?: number[];
}

interface WebhookTriggerConfig {
  endpoint_url: string;
  authentication: 'none' | 'api_key' | 'signature';
  expected_payload_structure?: any;
  validation_rules?: any[];
}

interface EmailTriggerConfig {
  email_address: string;
  subject_filter?: string;
  sender_filter?: string;
  parse_attachments: boolean;
}

interface FileWatchTriggerConfig {
  directory_path: string;
  file_pattern: string;
  watch_type: 'created' | 'modified' | 'deleted';
}

interface DatabaseTriggerConfig {
  connection_string: string;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  conditions?: Record<string, any>;
}

interface TriggerSystemBuilderProps {
  workflowId: string;
  triggers: TriggerDefinition[];
  onTriggerCreate: (trigger: Omit<TriggerDefinition, 'id'>) => Promise<void>;
  onTriggerUpdate: (id: string, updates: Partial<TriggerDefinition>) => Promise<void>;
  onTriggerDelete: (id: string) => Promise<void>;
  onTriggerTest: (id: string) => Promise<void>;
}

export const TriggerSystemBuilder: React.FC<TriggerSystemBuilderProps> = ({
  workflowId,
  triggers,
  onTriggerCreate,
  onTriggerUpdate,
  onTriggerDelete,
  onTriggerTest
}) => {
  const [selectedTriggerType, setSelectedTriggerType] = useState<TriggerDefinition['type'] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // Note: editingTrigger state reserved for future edit functionality

  const triggerTypes = [
    {
      type: 'schedule' as const,
      icon: Calendar,
      name: 'Schedule',
      description: 'Run workflow at specific times or intervals',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'webhook' as const,
      icon: Globe,
      name: 'Webhook',
      description: 'Trigger from external HTTP requests',
      color: 'from-green-500 to-emerald-500'
    },
    {
      type: 'email' as const,
      icon: Mail,
      name: 'Email',
      description: 'Process incoming emails automatically',
      color: 'from-purple-500 to-violet-500'
    },
    {
      type: 'file_watch' as const,
      icon: FileText,
      name: 'File Watch',
      description: 'Monitor file system changes',
      color: 'from-orange-500 to-red-500'
    },
    {
      type: 'database' as const,
      icon: Database,
      name: 'Database',
      description: 'React to database changes',
      color: 'from-pink-500 to-rose-500'
    },
    {
      type: 'manual' as const,
      icon: Zap,
      name: 'Manual',
      description: 'Start workflow manually',
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  const handleCreateTrigger = useCallback(async (config: TriggerConfig) => {
    if (!selectedTriggerType) return;

    const newTrigger: Omit<TriggerDefinition, 'id'> = {
      workflow_id: workflowId,
      type: selectedTriggerType,
      config,
      status: 'active',
      execution_count: 0
    };

    await onTriggerCreate(newTrigger);
    setIsCreating(false);
    setSelectedTriggerType(null);
  }, [selectedTriggerType, workflowId, onTriggerCreate]);

  const renderTriggerConfig = () => {
    if (!selectedTriggerType) return null;

    switch (selectedTriggerType) {
      case 'schedule':
        return <ScheduleTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      case 'webhook':
        return <WebhookTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      case 'email':
        return <EmailTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      case 'file_watch':
        return <FileWatchTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      case 'database':
        return <DatabaseTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      case 'manual':
        return <ManualTriggerBuilder onSave={handleCreateTrigger} onCancel={() => setIsCreating(false)} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trigger System</h2>
          <p className="text-gray-400">Configure when and how your workflow executes</p>
        </div>
        <HolographicButton
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          glow
        >
          Add Trigger
        </HolographicButton>
      </div>

      {/* Existing Triggers */}
      <div className="grid gap-4">
        {triggers.map((trigger) => (
          <TriggerCard
            key={trigger.id}
            trigger={trigger}
            onEdit={() => {/* Edit functionality coming soon */}}
            onDelete={onTriggerDelete}
            onTest={onTriggerTest}
            onToggle={(status) => onTriggerUpdate(trigger.id, { status })}
          />
        ))}
      </div>

      {/* Create New Trigger */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Trigger Type Selection */}
          {!selectedTriggerType && (
            <GlassCard variant="medium" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Choose Trigger Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {triggerTypes.map((triggerType) => {
                  const IconComponent = triggerType.icon;
                  return (
                    <motion.button
                      key={triggerType.type}
                      onClick={() => setSelectedTriggerType(triggerType.type)}
                      className={`p-4 rounded-lg bg-gradient-to-br ${triggerType.color} bg-opacity-20 border border-white/10 hover:bg-opacity-30 transition-all`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="w-8 h-8 text-white mb-2" />
                      <h4 className="font-semibold text-white">{triggerType.name}</h4>
                      <p className="text-xs text-gray-300 mt-1">{triggerType.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Trigger Configuration */}
          {selectedTriggerType && renderTriggerConfig()}
        </motion.div>
      )}
    </div>
  );
};

// Trigger Card Component
const TriggerCard: React.FC<{
  trigger: TriggerDefinition;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onToggle: (status: 'active' | 'paused') => void;
}> = ({ trigger, onEdit, onDelete, onTest, onToggle }) => {
  const triggerType = triggerTypes.find(t => t.type === trigger.type);
  const IconComponent = triggerType?.icon || Zap;

  return (
    <GlassCard variant="medium" className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${triggerType?.color || 'from-gray-500 to-gray-600'} bg-opacity-20`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{triggerType?.name}</h4>
            <p className="text-sm text-gray-400">
              Executions: {trigger.execution_count} | Status: {trigger.status}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTest(trigger.id)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Play className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onToggle(trigger.status === 'active' ? 'paused' : 'active')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {trigger.status === 'active' ? 
              <Pause className="w-4 h-4 text-white" /> : 
              <Play className="w-4 h-4 text-white" />
            }
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onDelete(trigger.id)}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

// Individual Trigger Builders
const ScheduleTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState<ScheduleTriggerConfig>({
    frequency: 'days',
    interval: 1,
    time_zone: 'UTC',
    specific_times: ['09:00']
  });

  return (
    <GlassCard variant="medium" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Schedule Configuration</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
            <select
              value={config.frequency}
              onChange={(e) => setConfig({...config, frequency: e.target.value as any})}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interval</label>
            <input
              type="number"
              min="1"
              value={config.interval}
              onChange={(e) => setConfig({...config, interval: parseInt(e.target.value)})}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
            />
          </div>
        </div>
        
        <div className="flex space-x-4">
          <HolographicButton onClick={() => onSave({ schedule: config })} glow>
            Create Trigger
          </HolographicButton>
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

const WebhookTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [config, setConfig] = useState<WebhookTriggerConfig>({
    endpoint_url: `https://api.genesis.ai/webhook/${Math.random().toString(36).substr(2, 9)}`,
    authentication: 'none'
  });

  return (
    <GlassCard variant="medium" className="p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Webhook Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint URL</label>
          <input
            type="text"
            value={config.endpoint_url}
            onChange={(e) => setConfig({...config, endpoint_url: e.target.value})}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
            readOnly
          />
          <p className="text-xs text-gray-400 mt-1">This URL will be auto-generated</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Authentication</label>
          <select
            value={config.authentication}
            onChange={(e) => setConfig({...config, authentication: e.target.value as any})}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
          >
            <option value="none">None</option>
            <option value="api_key">API Key</option>
            <option value="signature">Signature</option>
          </select>
        </div>
        
        <div className="flex space-x-4">
          <HolographicButton onClick={() => onSave({ webhook: config })} glow>
            Create Trigger
          </HolographicButton>
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

// Placeholder builders for other trigger types
const EmailTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onCancel }) => (
  <GlassCard variant="medium" className="p-6">
    <h3 className="text-xl font-semibold text-white mb-4">Email Trigger Configuration</h3>
    <p className="text-gray-400 mb-4">Email trigger configuration coming soon...</p>
    <div className="flex space-x-4">
      <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
        Cancel
      </button>
    </div>
  </GlassCard>
);

const FileWatchTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onCancel }) => (
  <GlassCard variant="medium" className="p-6">
    <h3 className="text-xl font-semibold text-white mb-4">File Watch Configuration</h3>
    <p className="text-gray-400 mb-4">File watch trigger configuration coming soon...</p>
    <div className="flex space-x-4">
      <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
        Cancel
      </button>
    </div>
  </GlassCard>
);

const DatabaseTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onCancel }) => (
  <GlassCard variant="medium" className="p-6">
    <h3 className="text-xl font-semibold text-white mb-4">Database Trigger Configuration</h3>
    <p className="text-gray-400 mb-4">Database trigger configuration coming soon...</p>
    <div className="flex space-x-4">
      <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
        Cancel
      </button>
    </div>
  </GlassCard>
);

const ManualTriggerBuilder: React.FC<{
  onSave: (config: TriggerConfig) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => (
  <GlassCard variant="medium" className="p-6">
    <h3 className="text-xl font-semibold text-white mb-4">Manual Trigger Configuration</h3>
    <p className="text-gray-400 mb-4">Manual triggers execute when you click "Run" manually.</p>
    <div className="flex space-x-4">
      <HolographicButton onClick={() => onSave({})}>
        Create Manual Trigger
      </HolographicButton>
      <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
        Cancel
      </button>
    </div>
  </GlassCard>
);

const triggerTypes = [
  {
    type: 'schedule' as const,
    icon: Calendar,
    name: 'Schedule',
    description: 'Run workflow at specific times or intervals',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'webhook' as const,
    icon: Globe,
    name: 'Webhook',
    description: 'Trigger from external HTTP requests',
    color: 'from-green-500 to-emerald-500'
  },
  {
    type: 'email' as const,
    icon: Mail,
    name: 'Email',
    description: 'Process incoming emails automatically',
    color: 'from-purple-500 to-violet-500'
  },
  {
    type: 'file_watch' as const,
    icon: FileText,
    name: 'File Watch',
    description: 'Monitor file system changes',
    color: 'from-orange-500 to-red-500'
  },
  {
    type: 'database' as const,
    icon: Database,
    name: 'Database',
    description: 'React to database changes',
    color: 'from-pink-500 to-rose-500'
  },
  {
    type: 'manual' as const,
    icon: Zap,
    name: 'Manual',
    description: 'Start workflow manually',
    color: 'from-yellow-500 to-amber-500'
  }
];
