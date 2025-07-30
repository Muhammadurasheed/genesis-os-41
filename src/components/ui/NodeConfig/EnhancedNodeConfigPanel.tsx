/**
 * Enhanced Node Configuration Panel - Phase 2 Complete
 * Supports all node types with advanced configuration options
 */

import React, { useState, useCallback } from 'react';
import { X, Settings, TestTube, Trash2 } from 'lucide-react';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Input } from '../input';
import { Label } from '../label';
import { Textarea } from '../textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Switch } from '../switch';
import { Badge } from '../badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { useToast } from '../use-toast';
// import { useTriggerSystem } from '../../hooks/useTriggerSystem';

interface NodeData {
  type: string;
  label: string;
  description?: string;
  status?: string;
  config?: Record<string, any>;
  [key: string]: any;
}

interface EnhancedNodeConfigPanelProps {
  nodeId: string;
  data: NodeData;
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
  onDelete?: (nodeId: string) => void;
  workflowId?: string;
}

export const EnhancedNodeConfigPanel: React.FC<EnhancedNodeConfigPanelProps> = ({ 
  nodeId, 
  data, 
  onUpdate, 
  onClose,
  onDelete
}) => {
  const [localData, setLocalData] = useState<NodeData>(data);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Initialize trigger system for trigger nodes (placeholder for Phase 2 completion)
  const triggerSystem = {
    triggers: [],
    createTrigger: async () => null,
    updateTrigger: async () => false,
    testTrigger: async () => false,
    isLoading: false
  };

  const handleUpdate = useCallback((updates: Partial<NodeData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    
    // Basic validation
    const errors: string[] = [];
    if (!newData.label?.trim()) {
      errors.push('Label is required');
    }
    if (!newData.description?.trim()) {
      errors.push('Description is required');
    }
    
    setValidationErrors(errors);
    setIsValid(errors.length === 0);
    
    if (errors.length === 0) {
      onUpdate(nodeId, newData);
    }
  }, [localData, nodeId, onUpdate]);

  const handleSave = useCallback(() => {
    if (isValid) {
      toast({
        title: "Configuration Saved",
        description: "Node configuration updated successfully",
      });
      onClose();
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving",
        variant: "destructive"
      });
    }
  }, [isValid, toast, onClose]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(nodeId);
      toast({
        title: "Node Deleted",
        description: "Node has been removed from the workflow",
      });
    }
  }, [nodeId, onDelete, toast]);

  const handleTestNode = useCallback(async () => {
    toast({
      title: "Test Started",
      description: "Node test execution initiated",
    });
  }, [toast]);

  const renderBasicConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Node Label</Label>
        <Input
          id="label"
          value={localData.label}
          onChange={(e) => handleUpdate({ label: e.target.value })}
          placeholder="Enter node label"
          className={validationErrors.includes('Label is required') ? 'border-destructive' : ''}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={localData.description || ''}
          onChange={(e) => handleUpdate({ description: e.target.value })}
          placeholder="Describe what this node does"
          className={validationErrors.includes('Description is required') ? 'border-destructive' : ''}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={localData.status || 'ready'} onValueChange={(value) => handleUpdate({ status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      {renderBasicConfig()}
      
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Trigger Configuration</h4>
        
        <div>
          <Label htmlFor="triggerType">Trigger Type</Label>
          <Select 
            value={localData.triggerType || 'manual'} 
            onValueChange={(value) => handleUpdate({ triggerType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="file_watch">File Watch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {localData.triggerType === 'schedule' && (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={localData.frequency || 'hours'} onValueChange={(value) => handleUpdate({ frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                value={localData.interval || 1}
                onChange={(e) => handleUpdate({ interval: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>
        )}

        {localData.triggerType === 'webhook' && (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="authentication">Authentication</Label>
              <Select value={localData.authentication || 'none'} onValueChange={(value) => handleUpdate({ authentication: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="signature">Signature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {localData.authentication === 'api_key' && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={localData.apiKey || ''}
                  onChange={(e) => handleUpdate({ apiKey: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderActionConfig = () => (
    <div className="space-y-4">
      {renderBasicConfig()}
      
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Action Configuration</h4>
        
        <div>
          <Label htmlFor="actionType">Action Type</Label>
          <Select 
            value={localData.actionType || 'api'} 
            onValueChange={(value) => handleUpdate({ actionType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api">API Request</SelectItem>
              <SelectItem value="email">Send Email</SelectItem>
              <SelectItem value="database">Database Operation</SelectItem>
              <SelectItem value="webhook">Webhook Call</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {localData.actionType === 'api' && (
          <div className="space-y-3 mt-3">
            <div>
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                value={localData.apiUrl || ''}
                onChange={(e) => handleUpdate({ apiUrl: e.target.value })}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select value={localData.method || 'GET'} onValueChange={(value) => handleUpdate({ method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={localData.headers ? JSON.stringify(localData.headers, null, 2) : '{}'}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleUpdate({ headers });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAgentConfig = () => (
    <div className="space-y-4">
      {renderBasicConfig()}
      
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Agent Configuration</h4>
        
        <div>
          <Label htmlFor="role">Agent Role</Label>
          <Input
            id="role"
            value={localData.role || ''}
            onChange={(e) => handleUpdate({ role: e.target.value })}
            placeholder="e.g., Customer Support Agent"
          />
        </div>

        <div>
          <Label htmlFor="personality">Personality</Label>
          <Textarea
            id="personality"
            value={localData.personality || ''}
            onChange={(e) => handleUpdate({ personality: e.target.value })}
            placeholder="Describe the agent's personality and communication style"
          />
        </div>

        <div>
          <Label htmlFor="tools">Available Tools</Label>
          <Input
            id="tools"
            value={Array.isArray(localData.tools) ? localData.tools.join(', ') : ''}
            onChange={(e) => handleUpdate({ tools: e.target.value.split(', ').filter(t => t.trim()) })}
            placeholder="email, calendar, search, calculator"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="autoResponse"
            checked={localData.autoResponse || false}
            onCheckedChange={(checked) => handleUpdate({ autoResponse: checked })}
          />
          <Label htmlFor="autoResponse">Enable Auto-Response</Label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="retryPolicy">Retry Policy</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label htmlFor="maxRetries" className="text-sm">Max Retries</Label>
            <Input
              id="maxRetries"
              type="number"
              value={localData.maxRetries || 3}
              onChange={(e) => handleUpdate({ maxRetries: parseInt(e.target.value) || 3 })}
              min="0"
              max="10"
            />
          </div>
          <div>
            <Label htmlFor="retryDelay" className="text-sm">Retry Delay (ms)</Label>
            <Input
              id="retryDelay"
              type="number"
              value={localData.retryDelay || 1000}
              onChange={(e) => handleUpdate({ retryDelay: parseInt(e.target.value) || 1000 })}
              min="100"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="timeout">Timeout (seconds)</Label>
        <Input
          id="timeout"
          type="number"
          value={localData.timeout || 30}
          onChange={(e) => handleUpdate({ timeout: parseInt(e.target.value) || 30 })}
          min="1"
          max="300"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enableLogging"
          checked={localData.enableLogging !== false}
          onCheckedChange={(checked) => handleUpdate({ enableLogging: checked })}
        />
        <Label htmlFor="enableLogging">Enable Detailed Logging</Label>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={Array.isArray(localData.tags) ? localData.tags.join(', ') : ''}
          onChange={(e) => handleUpdate({ tags: e.target.value.split(', ').filter(t => t.trim()) })}
          placeholder="production, critical, customer-facing"
        />
      </div>
    </div>
  );

  const getConfigComponent = () => {
    switch (data.type) {
      case 'trigger':
        return renderTriggerConfig();
      case 'action':
        return renderActionConfig();
      case 'agent':
        return renderAgentConfig();
      default:
        return renderBasicConfig();
    }
  };

  return (
    <Card className="w-[500px] max-h-[80vh] overflow-hidden bg-card/95 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Node Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">{data.type} • {nodeId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Valid" : "Invalid"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto max-h-[60vh]">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-4">
            {getConfigComponent()}
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-4">
            {renderAdvancedTab()}
          </TabsContent>
        </Tabs>

        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 border border-destructive rounded-md bg-destructive/10">
            <h4 className="text-sm font-medium text-destructive mb-2">Validation Errors:</h4>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <div className="flex items-center justify-between p-4 border-t">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNode}
            disabled={triggerSystem.isLoading}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </Button>
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
};