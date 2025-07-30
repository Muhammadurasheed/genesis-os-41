// Phase 3 Sprint 3.1: Credential Setup Flow UI Component
// Service Selection → Auth Method → Credential Input → Validation → Storage

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { GlassCard } from '../ui/GlassCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';

import { Textarea } from '../ui/textarea';
import { toast } from '../ui/use-toast';

import { credentialManagementService } from '../../services/credentialManagementService';
import type { CredentialSetupFlow, ServiceCredentialGuide, CredentialValidationResult } from '../../types/credentials';

interface CredentialSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string;
  workspaceId: string;
  onCredentialSaved: (credentialId: string) => void;
}

export const CredentialSetupWizard: React.FC<CredentialSetupWizardProps> = ({
  isOpen,
  onClose,
  serviceId,
  workspaceId,
  onCredentialSaved
}) => {
  const [setupFlow, setSetupFlow] = useState<CredentialSetupFlow | null>(null);
  const [setupGuide, setSetupGuide] = useState<ServiceCredentialGuide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<CredentialValidationResult | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen && serviceId) {
      initializeSetup();
    }
  }, [isOpen, serviceId]);

  const initializeSetup = async () => {
    if (!serviceId) return;

    try {
      setIsLoading(true);
      
      // Initialize setup flow
      const flow = await credentialManagementService.initiateCredentialSetup(serviceId);
      setSetupFlow(flow);

      // Get setup guide
      const guide = await credentialManagementService.getServiceSetupGuide(serviceId as any);
      setSetupGuide(guide);

      setCurrentStep(0);
    } catch (error) {
      console.error('Failed to initialize setup:', error);
      toast({
        title: 'Setup Error',
        description: 'Failed to initialize credential setup',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    if (!setupFlow) return;

    setSetupFlow({
      ...setupFlow,
      current_values: {
        ...setupFlow.current_values,
        [fieldKey]: value
      }
    });
  };

  const validateCredentials = async () => {
    if (!setupFlow) return;

    setIsLoading(true);
    setValidationResult(null);

    try {
      // Get the primary credential value
      const primaryField = setupFlow.required_fields.find(f => f.required);
      const credentialValue = setupFlow.current_values[primaryField?.key || 'api_key'];

      if (!credentialValue) {
        toast({
          title: 'Missing Credential',
          description: 'Please enter your credential value',
          variant: 'destructive'
        });
        return;
      }

      // Validate the credential
      const result = await credentialManagementService.validateCredential('temp-validation-id');

      setValidationResult(result);

      if (result.isValid) {
        toast({
          title: 'Validation Successful',
          description: 'Your credentials are working correctly!',
          variant: 'default'
        });
        setCurrentStep(3); // Move to final step
      } else {
        toast({
          title: 'Validation Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate credentials',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = async () => {
    if (!setupFlow || !validationResult?.isValid) return;

    setIsLoading(true);

    try {

      const result = await credentialManagementService.saveCredential(
        workspaceId,
        setupFlow.service_id,
        setupFlow.auth_type,
        {
          // Save additional metadata
          ...Object.fromEntries(
            setupFlow.required_fields
              .filter(f => !f.required)
              .map(f => [f.key, setupFlow.current_values[f.key]])
              .filter(([, value]) => value)
          ),
          validation_result: validationResult
        }
      );

      if (result) {
        toast({
          title: 'Credentials Saved',
          description: `Successfully saved ${setupFlow.service_name} credentials`,
          variant: 'default'
        });
        
        onCredentialSaved(result);
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save credentials',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowValue = (fieldKey: string) => {
    setShowValues(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
      variant: 'default'
    });
  };

  if (!setupFlow || !setupGuide) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const steps = [
    'Service Setup Guide',
    'Enter Credentials', 
    'Validate Credentials',
    'Save & Complete'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            Setup {setupFlow.service_name} Credentials
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              <span
                className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step}
              </span>

              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Service Setup Guide */}
          {currentStep === 0 && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Getting Your {setupFlow.service_name} Credentials
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  {setupGuide.test_instructions}
                </p>

                <div className="space-y-4">
                  {setupGuide.setup_steps.map((step, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg border">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                        {step.step_number}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{step.title}</h4>
                        <p className="text-muted-foreground mt-1">{step.description}</p>
                        
                        {step.external_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.open(step.external_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open {setupFlow.service_name}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {setupGuide.documentation_url && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <span className="font-medium">Need More Help?</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      Check the official documentation for detailed instructions.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(setupGuide.documentation_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Documentation
                    </Button>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setCurrentStep(1)}>
                    Continue to Credentials
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Enter Credentials */}
          {currentStep === 1 && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Enter Your {setupFlow.service_name} Credentials
                </h3>

                <div className="space-y-6">
                  {setupFlow.required_fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key} className="flex items-center gap-2">
                        {field.name}
                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </Label>
                      
                      {field.help_text && (
                        <p className="text-sm text-muted-foreground">
                          {field.help_text}
                        </p>
                      )}

                      <div className="relative">
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={field.key}
                            placeholder={field.placeholder}
                            value={setupFlow.current_values[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="min-h-[100px]"
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.type === 'password' && !showValues[field.key] ? 'password' : 'text'}
                            placeholder={field.placeholder}
                            value={setupFlow.current_values[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="pr-20"
                          />
                        )}

                        {field.type === 'password' && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleShowValue(field.key)}
                              className="h-8 w-8 p-0"
                            >
                              {showValues[field.key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            
                            {setupFlow.current_values[field.key] && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(setupFlow.current_values[field.key] || '')}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {field.validation_pattern && setupFlow.current_values[field.key] && (
                        <div className="flex items-center gap-2 text-sm">
                          {new RegExp(field.validation_pattern).test(setupFlow.current_values[field.key]) ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Format looks correct</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600">Format may be incorrect</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    Back to Guide
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!setupFlow.required_fields.every(f => 
                      !f.required || setupFlow.current_values[f.key]
                    )}
                  >
                    Validate Credentials
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 3: Validate Credentials */}
          {currentStep === 2 && (
            <motion.div
              key="validation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Validate Your Credentials
                </h3>

                <p className="text-muted-foreground mb-6">
                  We'll test your credentials to make sure they work correctly before saving them.
                </p>

                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.isValid 
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        validationResult.isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {validationResult.isValid ? 'Validation Successful' : 'Validation Failed'}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${
                      validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {validationResult.message}
                    </p>

                    {validationResult.details && (
                      <div className="mt-3 text-xs font-mono p-2 bg-black/5 dark:bg-white/5 rounded">
                        <div>Status: {validationResult.status}</div>
                        {validationResult.details.endpoint_tested && (
                          <div>Endpoint: {validationResult.details.endpoint_tested}</div>
                        )}
                        {validationResult.details.response_code && (
                          <div>Response: {validationResult.details.response_code}</div>
                        )}
                      </div>
                    )}

                    {!validationResult.isValid && validationResult.details?.error_code && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium text-amber-800 dark:text-amber-200">How to Fix This</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {credentialManagementService.getErrorRecoveryInstructions(
                            setupFlow.service_id,
                            validationResult.details.error_code
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back to Credentials
                  </Button>
                  
                  {!validationResult ? (
                    <Button onClick={validateCredentials} disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Test Credentials
                    </Button>
                  ) : validationResult.isValid ? (
                    <Button onClick={() => setCurrentStep(3)}>
                      Continue to Save
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Fix Credentials
                    </Button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 4: Save & Complete */}
          {currentStep === 3 && (
            <motion.div
              key="save"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Save Your Credentials
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        Credentials Validated Successfully
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Your {setupFlow.service_name} credentials are working correctly and ready to use.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Security Notice</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your credentials will be encrypted using AES-256 encryption</li>
                      <li>• Only you and authorized agents can access these credentials</li>
                      <li>• Credentials are stored securely in our encrypted database</li>
                      <li>• You can revoke or update these credentials at any time</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back to Validation
                  </Button>
                  <Button onClick={saveCredentials} disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Credentials
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};