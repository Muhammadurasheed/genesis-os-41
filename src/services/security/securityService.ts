/**
 * Security & Compliance Service
 * Phase 3: Agent Intelligence - Security Infrastructure
 */

import CryptoJS from 'crypto-js';

interface SecurityConfig {
  rateLimits: {
    api: number;
    simulation: number;
    deployment: number;
  };
  encryption: {
    algorithm: string;
    keySize: number;
  };
  compliance: {
    dataRetention: number; // days
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface SecurityAuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  metadata: Record<string, any>;
}

class SecurityService {
  private config: SecurityConfig;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private auditLogs: SecurityAuditLog[] = [];
  private encryptionKey: string;

  constructor() {
    this.config = {
      rateLimits: {
        api: 100, // requests per minute
        simulation: 10, // simulations per hour
        deployment: 5   // deployments per hour
      },
      encryption: {
        algorithm: 'AES',
        keySize: 256
      },
      compliance: {
        dataRetention: 90,
        auditLevel: 'comprehensive'
      }
    };

    this.encryptionKey = this.generateEncryptionKey();
    this.startCleanupTask();
  }

  // Rate Limiting
  checkRateLimit(userId: string, action: 'api' | 'simulation' | 'deployment'): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const limit = this.config.rateLimits[action];
    const windowMs = action === 'api' ? 60000 : 3600000; // 1min for API, 1hr for others

    const entry = this.rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      });
      this.logSecurityEvent(userId, 'rate_limit_check', action, 'success', { count: 1 });
      return true;
    }

    if (entry.count >= limit) {
      entry.blocked = true;
      this.logSecurityEvent(userId, 'rate_limit_exceeded', action, 'blocked', { 
        count: entry.count, 
        limit 
      });
      return false;
    }

    entry.count++;
    this.logSecurityEvent(userId, 'rate_limit_check', action, 'success', { count: entry.count });
    return true;
  }

  getRateLimitStatus(userId: string, action: 'api' | 'simulation' | 'deployment'): {
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } {
    const key = `${userId}:${action}`;
    const entry = this.rateLimitStore.get(key);
    const limit = this.config.rateLimits[action];

    if (!entry) {
      return { remaining: limit, resetTime: 0, blocked: false };
    }

    return {
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
      blocked: entry.blocked
    };
  }

  // Data Encryption
  encryptSensitiveData(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  decryptSensitiveData(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // API Key Validation
  validateApiKey(apiKey: string, service: string): boolean {
    if (!apiKey || apiKey.length < 20) {
      return false;
    }

    // Service-specific validation patterns
    const patterns = {
      elevenlabs: /^[a-f0-9]{32}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      tavus: /^[a-zA-Z0-9_-]{20,}$/,
      slack: /^xoxb-[0-9]{11,}-[0-9]{11,}-[a-zA-Z0-9]{24}$/
    };

    const pattern = patterns[service as keyof typeof patterns];
    return pattern ? pattern.test(apiKey) : apiKey.length >= 20;
  }

  // Security Audit Logging
  logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    outcome: 'success' | 'failure' | 'blocked',
    metadata: Record<string, any> = {}
  ): void {
    const auditLog: SecurityAuditLog = {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      userId,
      action,
      resource,
      outcome,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        ip: 'client-side', // Would be populated by backend
        timestamp_iso: new Date().toISOString()
      }
    };

    this.auditLogs.push(auditLog);

    // Log to console for development
    const level = outcome === 'blocked' || outcome === 'failure' ? 'warn' : 'info';
    console[level](`🔒 Security Event: ${action} on ${resource} - ${outcome}`, auditLog);

    // Trim logs if they exceed retention policy
    this.trimAuditLogs();
  }

  // Compliance & Reporting
  getSecurityReport(startDate?: Date, endDate?: Date): {
    summary: {
      totalEvents: number;
      successfulEvents: number;
      failedEvents: number;
      blockedEvents: number;
    };
    topActions: Array<{ action: string; count: number }>;
    rateLimit: {
      violations: number;
      topUsers: Array<{ userId: string; violations: number }>;
    };
    logs: SecurityAuditLog[];
  } {
    const start = startDate?.getTime() || 0;
    const end = endDate?.getTime() || Date.now();

    const filteredLogs = this.auditLogs.filter(
      log => log.timestamp >= start && log.timestamp <= end
    );

    const summary = {
      totalEvents: filteredLogs.length,
      successfulEvents: filteredLogs.filter(log => log.outcome === 'success').length,
      failedEvents: filteredLogs.filter(log => log.outcome === 'failure').length,
      blockedEvents: filteredLogs.filter(log => log.outcome === 'blocked').length
    };

    const actionCounts = new Map<string, number>();
    const rateLimitViolations = new Map<string, number>();

    filteredLogs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      
      if (log.action === 'rate_limit_exceeded') {
        rateLimitViolations.set(log.userId, (rateLimitViolations.get(log.userId) || 0) + 1);
      }
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Array.from(rateLimitViolations.entries())
      .map(([userId, violations]) => ({ userId, violations }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 5);

    return {
      summary,
      topActions,
      rateLimit: {
        violations: filteredLogs.filter(log => log.action === 'rate_limit_exceeded').length,
        topUsers
      },
      logs: filteredLogs
    };
  }

  // Data Sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  validateWorkflowSecurity(workflow: any): {
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for sensitive data exposure
    const workflowStr = JSON.stringify(workflow);
    if (/password|secret|key|token/i.test(workflowStr)) {
      issues.push('Potential sensitive data detected in workflow configuration');
      recommendations.push('Use environment variables for sensitive configuration');
    }

    // Check for unsafe URLs
    if (/http:\/\/(?!localhost)/i.test(workflowStr)) {
      issues.push('Insecure HTTP URLs detected');
      recommendations.push('Use HTTPS URLs for external services');
    }

    // Check for code injection patterns
    if (/eval\(|function\(|new Function/i.test(workflowStr)) {
      issues.push('Potential code injection detected');
      recommendations.push('Avoid dynamic code execution in workflows');
    }

    return {
      isSecure: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Private Methods
  private generateEncryptionKey(): string {
    // In production, this should come from secure key management
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimAuditLogs(): void {
    const retentionMs = this.config.compliance.dataRetention * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);
  }

  private startCleanupTask(): void {
    // Clean up expired entries every hour
    setInterval(() => {
      const now = Date.now();
      
      // Clean rate limit entries
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
      
      // Clean audit logs
      this.trimAuditLogs();
    }, 3600000); // 1 hour
  }
}

// Create singleton instance
const securityService = new SecurityService();

export { securityService, type SecurityConfig, type SecurityAuditLog };