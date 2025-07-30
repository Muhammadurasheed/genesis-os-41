// Phase 3 Sprint 3.1: Credential Management Dashboard
// Complete credential management interface with security-first approach

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle, 
  AlertCircle,
  Clock,
  Key,
  Search,
  MoreHorizontal,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/Card';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/badge';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import { CredentialSetupWizard } from './CredentialSetupWizard';
import { integrationService, INTEGRATIONS } from '../../services/integrationService';
import { credentialManagementService } from '../../services/credentialManagementService';
import { PRIORITY_INTEGRATIONS } from '../../types/credentials';
import type { CredentialDefinition } from '../../types/credentials';

interface CredentialManagementDashboardProps {
  workspaceId: string;
}

export const CredentialManagementDashboard: React.FC<CredentialManagementDashboardProps> = ({
  workspaceId
}) => {
  const [credentials, setCredentials] = useState<CredentialDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCredentials();
  }, [workspaceId]);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      const data = await credentialManagementService.listCredentials(workspaceId);
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credentials',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredential = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsSetupWizardOpen(true);
  };

  const handleCredentialSaved = () => {
    loadCredentials(); // Refresh the list
    toast({
      title: 'Success',
      description: 'Credential saved successfully',
      variant: 'default'
    });
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    try {
      await credentialManagementService.deleteCredential(credentialId);
      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      toast({
        title: 'Deleted',
        description: 'Credential deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete credential',
        variant: 'destructive'
      });
    }
  };

  const handleRevalidateCredential = async (credential: CredentialDefinition) => {
    // In a real implementation, this would re-validate the credential
    toast({
      title: 'Revalidating',
      description: `Revalidating ${credential.service_name} credentials...`,
      variant: 'default'
    });
  };

  const toggleShowValue = (credentialId: string) => {
    setShowValues(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      verified: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-amber-600' },
      expired: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      invalid: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || credential.status === filterStatus;
    const matchesType = filterType === 'all' || credential.credential_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const priorityServices = INTEGRATIONS.filter(integration => 
    PRIORITY_INTEGRATIONS.includes(integration.id as any)
  );

  const usedServiceIds = new Set(credentials.map(c => c.service_name));
  const availableServices = priorityServices.filter(service => !usedServiceIds.has(service.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Credential Management</h2>
          <p className="text-muted-foreground">
            Securely manage your API credentials and integrations
          </p>
        </div>

        <Button 
          onClick={() => setIsSetupWizardOpen(true)}
          className="w-fit"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="api_key">API Key</SelectItem>
            <SelectItem value="oauth">OAuth</SelectItem>
            <SelectItem value="basic_auth">Basic Auth</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Setup - Priority Integrations */}
      {availableServices.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Quick Setup - Priority Integrations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableServices.slice(0, 8).map((service) => (
              <motion.div
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-dashed"
                  onClick={() => handleAddCredential(service.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <div className="h-6 w-6 bg-primary/20 rounded" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{service.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {availableServices.length > 8 && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setIsSetupWizardOpen(true)}
            >
              View All Available Services ({availableServices.length - 8} more)
            </Button>
          )}
        </GlassCard>
      )}

      {/* Credentials List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-6 bg-muted rounded w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCredentials.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {credentials.length === 0 ? 'No Credentials Added' : 'No Matching Credentials'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {credentials.length === 0 
                ? 'Add your first credential to start connecting with external services'
                : 'Try adjusting your search or filters to find what you\'re looking for'
              }
            </p>
            {credentials.length === 0 && (
              <Button onClick={() => setIsSetupWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Credential
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCredentials.map((credential) => {
              const integration = integrationService.getIntegrationById(credential.service_name);
              
              return (
                <motion.div
                  key={credential.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                >
                  <Card className="p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-4">
                      {/* Service Icon */}
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <div className="h-6 w-6 bg-primary/20 rounded" />
                      </div>

                      {/* Service Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {integration?.name || credential.service_name}
                          </h3>
                          {getStatusBadge(credential.status)}
                          <Badge variant="outline" className="text-xs">
                            {credential.credential_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {integration?.description || `${credential.service_name} integration`}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {new Date(credential.created_at).toLocaleDateString()}</span>
                            <span>Last verified: {new Date(credential.last_verified).toLocaleDateString()}</span>
                            {credential.metadata?.usage_count && (
                              <span>Used: {credential.metadata.usage_count} times</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credential Value (masked) */}
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-muted-foreground">
                          {showValues[credential.id] 
                            ? credential.encrypted_value.slice(0, 20) + '...'
                            : '•'.repeat(20)
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowValue(credential.id)}
                          className="h-8 w-8 p-0"
                        >
                          {showValues[credential.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRevalidateCredential(credential)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Revalidate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAddCredential(credential.service_name)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Update
                          </DropdownMenuItem>
                          {integration?.actions && integration.actions.length > 0 && (
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Test Integration
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCredential(credential.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Setup Wizard */}
      <CredentialSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => {
          setIsSetupWizardOpen(false);
          setSelectedServiceId('');
        }}
        serviceId={selectedServiceId}
        workspaceId={workspaceId}
        onCredentialSaved={handleCredentialSaved}
      />
    </div>
  );
};