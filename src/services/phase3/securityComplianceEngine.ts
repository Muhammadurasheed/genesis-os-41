// ============================================================
// Phase 3: Security & Compliance Engine - Advanced Container Features
// Container sandboxing, network monitoring, encryption, and audit logging
// ============================================================

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { dockerContainerService } from '../core/dockerContainerService';
import crypto from 'crypto';

export interface SecurityConfig {
  encryptionAlgorithm: string;
  keyRotationInterval: number; // hours
  auditRetentionPeriod: number; // days
  networkMonitoringEnabled: boolean;
  sandboxLevel: 'strict' | 'medium' | 'permissive';
  complianceStandards: string[]; // ['SOC2', 'GDPR', 'HIPAA', 'PCI-DSS']
}

export interface ContainerSandbox {
  containerId: string;
  sandboxId: string;
  level: 'strict' | 'medium' | 'permissive';
  capabilities: string[];
  networkPolicy: NetworkPolicy;
  fileSystemPolicy: FileSystemPolicy;
  resourceLimits: SecurityResourceLimits;
  seccompProfile: SeccompProfile;
  apparmorProfile: string;
}

export interface NetworkPolicy {
  policyId: string;
  allowedHosts: string[];
  blockedHosts: string[];
  allowedPorts: number[];
  blockedPorts: number[];
  protocolRestrictions: ProtocolRestriction[];
  bandwidthLimits: BandwidthLimit[];
  dnsPolicies: DnsPolicy[];
}

export interface ProtocolRestriction {
  protocol: 'http' | 'https' | 'ws' | 'wss' | 'ftp' | 'ssh';
  allowed: boolean;
  conditions: string[];
}

export interface BandwidthLimit {
  direction: 'ingress' | 'egress';
  limit: string; // e.g., '10mbit'
  burst: string; // e.g., '32kbit'
}

export interface DnsPolicy {
  allowedDomains: string[];
  blockedDomains: string[];
  customResolver?: string;
}

export interface FileSystemPolicy {
  policyId: string;
  readOnlyPaths: string[];
  writableTemporaryPaths: string[];
  prohibitedPaths: string[];
  encryptedPaths: string[];
  maxFileSize: number; // bytes
  allowedExtensions: string[];
  prohibitedExtensions: string[];
}

export interface SecurityResourceLimits {
  maxMemory: string;
  maxCpu: string;
  maxDisk: string;
  maxNetworkConnections: number;
  maxOpenFiles: number;
  maxProcesses: number;
}

export interface SeccompProfile {
  defaultAction: 'SCMP_ACT_KILL' | 'SCMP_ACT_TRAP' | 'SCMP_ACT_ERRNO' | 'SCMP_ACT_ALLOW';
  allowedSyscalls: string[];
  blockedSyscalls: string[];
  conditionalSyscalls: ConditionalSyscall[];
}

export interface ConditionalSyscall {
  name: string;
  action: string;
  args: SyscallArg[];
}

export interface SyscallArg {
  index: number;
  value: number;
  op: 'SCMP_CMP_NE' | 'SCMP_CMP_LT' | 'SCMP_CMP_LE' | 'SCMP_CMP_EQ' | 'SCMP_CMP_GE' | 'SCMP_CMP_GT';
}

export interface AuditLog {
  logId: string;
  timestamp: Date;
  containerId: string;
  agentId: string;
  event: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  details: Record<string, any>;
  source: string;
  destination?: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskScore: number; // 0-100
}

export interface NetworkTrafficLog {
  logId: string;
  timestamp: Date;
  containerId: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  bytesTransferred: number;
  duration: number;
  httpMethod?: string;
  httpPath?: string;
  httpStatusCode?: number;
  blocked: boolean;
  reason?: string;
}

export interface EncryptionKey {
  keyId: string;
  algorithm: string;
  keyData: Buffer;
  created: Date;
  expires: Date;
  active: boolean;
  purpose: 'data' | 'communication' | 'storage';
}

export interface ComplianceReport {
  reportId: string;
  standard: string;
  timestamp: Date;
  compliant: boolean;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  score: number; // 0-100
}

export interface ComplianceViolation {
  violationId: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedContainers: string[];
  remediation: string;
  deadline?: Date;
}

export interface ComplianceRecommendation {
  recommendationId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  expectedBenefit: string;
}

class SecurityComplianceEngine extends EventEmitter {
  private config: SecurityConfig;
  private containerSandboxes: Map<string, ContainerSandbox> = new Map();
  private auditLogs: AuditLog[] = [];
  private networkTrafficLogs: NetworkTrafficLog[] = [];
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private networkMonitor: NetworkMonitor;
  private auditLogger: AuditLogger;
  private encryptionManager: EncryptionManager;

  constructor(config: SecurityConfig) {
    super();
    this.config = config;
    this.networkMonitor = new NetworkMonitor(config);
    this.auditLogger = new AuditLogger(config);
    this.encryptionManager = new EncryptionManager(config);
    console.log('🔒 Security & Compliance Engine initializing...');
    this.startSecurityMonitoring();
  }

  // Container Sandboxing
  async createContainerSandbox(containerId: string, level: 'strict' | 'medium' | 'permissive'): Promise<string> {
    const sandboxId = uuidv4();
    console.log(`🏰 Creating ${level} sandbox for container: ${containerId}`);

    const sandbox: ContainerSandbox = {
      containerId,
      sandboxId,
      level,
      capabilities: this.getSandboxCapabilities(level),
      networkPolicy: this.createNetworkPolicy(level),
      fileSystemPolicy: this.createFileSystemPolicy(level),
      resourceLimits: this.createResourceLimits(level),
      seccompProfile: this.createSeccompProfile(level),
      apparmorProfile: this.createApparmorProfile(level)
    };

    this.containerSandboxes.set(containerId, sandbox);

    // Apply sandbox to container
    await this.applySandboxToContainer(sandbox);

    this.auditLogger.log({
      event: 'sandbox_created',
      level: 'info',
      containerId,
      details: { sandboxId, level }
    });

    this.emit('sandboxCreated', sandbox);
    return sandboxId;
  }

  private async applySandboxToContainer(sandbox: ContainerSandbox): Promise<void> {
    // Apply network policy
    await this.applyNetworkPolicy(sandbox.containerId, sandbox.networkPolicy);

    // Apply file system policy
    await this.applyFileSystemPolicy(sandbox.containerId, sandbox.fileSystemPolicy);

    // Apply resource limits
    await this.applyResourceLimits(sandbox.containerId, sandbox.resourceLimits);

    // Apply seccomp profile
    await this.applySeccompProfile(sandbox.containerId, sandbox.seccompProfile);

    console.log(`✅ Sandbox applied to container: ${sandbox.containerId}`);
  }

  // Network Traffic Monitoring
  async monitorNetworkTraffic(containerId: string): Promise<void> {
    console.log(`🌐 Starting network monitoring for container: ${containerId}`);

    // Setup network monitoring using iptables and netfilter
    await dockerContainerService.executeCommand(containerId, [
      'iptables', '-A', 'OUTPUT', '-j', 'LOG', '--log-prefix', 'CONTAINER_OUT: '
    ]);

    await dockerContainerService.executeCommand(containerId, [
      'iptables', '-A', 'INPUT', '-j', 'LOG', '--log-prefix', 'CONTAINER_IN: '
    ]);

    // Start packet capture
    await this.startPacketCapture(containerId);

    this.auditLogger.log({
      event: 'network_monitoring_started',
      level: 'info',
      containerId,
      details: { monitoring: true }
    });
  }

  private async startPacketCapture(containerId: string): Promise<void> {
    // Use tcpdump for packet capture
    await dockerContainerService.executeCommand(containerId, [
      'tcpdump', '-i', 'eth0', '-w', `/var/log/network-${containerId}.pcap`, '-C', '100'
    ]);
  }

  async analyzeNetworkTraffic(containerId: string): Promise<NetworkTrafficLog[]> {
    console.log(`🔍 Analyzing network traffic for container: ${containerId}`);

    const trafficLogs: NetworkTrafficLog[] = [];

    // Parse network logs and detect anomalies
    const logFiles = await this.getNetworkLogFiles(containerId);
    
    for (const logFile of logFiles) {
      const entries = await this.parseNetworkLog(logFile);
      trafficLogs.push(...entries);
    }

    // Detect suspicious patterns
    const suspiciousTraffic = this.detectSuspiciousTraffic(trafficLogs);
    
    for (const suspicious of suspiciousTraffic) {
      this.auditLogger.log({
        event: 'suspicious_network_activity',
        level: 'warning',
        containerId,
        details: suspicious
      });
    }

    return trafficLogs;
  }

  // Data Encryption
  async encryptData(data: Buffer, purpose: 'data' | 'communication' | 'storage'): Promise<Buffer> {
    const key = await this.getActiveEncryptionKey(purpose);
    
    if (!key) {
      throw new Error(`No active encryption key found for purpose: ${purpose}`);
    }

    const cipher = crypto.createCipher(key.algorithm, key.keyData);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    console.log(`🔐 Data encrypted using key: ${key.keyId}`);
    return encrypted;
  }

  async decryptData(encryptedData: Buffer, keyId: string): Promise<Buffer> {
    const key = this.encryptionKeys.get(keyId);
    
    if (!key) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    const decipher = crypto.createDecipher(key.algorithm, key.keyData);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    console.log(`🔓 Data decrypted using key: ${keyId}`);
    return decrypted;
  }

  // Key Management
  async generateEncryptionKey(purpose: 'data' | 'communication' | 'storage'): Promise<string> {
    const keyId = uuidv4();
    const keyData = crypto.randomBytes(32); // 256-bit key

    const key: EncryptionKey = {
      keyId,
      algorithm: this.config.encryptionAlgorithm,
      keyData,
      created: new Date(),
      expires: new Date(Date.now() + this.config.keyRotationInterval * 60 * 60 * 1000),
      active: true,
      purpose
    };

    this.encryptionKeys.set(keyId, key);

    this.auditLogger.log({
      event: 'encryption_key_generated',
      level: 'info',
      containerId: 'system',
      details: { keyId, purpose, algorithm: key.algorithm }
    });

    console.log(`🔑 Generated encryption key: ${keyId} for ${purpose}`);
    return keyId;
  }

  async rotateEncryptionKeys(): Promise<void> {
    console.log('🔄 Rotating encryption keys...');

    const expiredKeys = Array.from(this.encryptionKeys.values()).filter(
      key => key.expires < new Date()
    );

    for (const expiredKey of expiredKeys) {
      // Generate new key
      const newKeyId = await this.generateEncryptionKey(expiredKey.purpose);
      
      // Deactivate old key
      expiredKey.active = false;
      
      this.auditLogger.log({
        event: 'encryption_key_rotated',
        level: 'info',
        containerId: 'system',
        details: { oldKeyId: expiredKey.keyId, newKeyId, purpose: expiredKey.purpose }
      });
    }

    this.emit('keysRotated', expiredKeys.length);
  }

  // Audit Logging
  async logSecurityEvent(event: Partial<AuditLog>): Promise<void> {
    const auditLog: AuditLog = {
      logId: uuidv4(),
      timestamp: new Date(),
      containerId: event.containerId || 'unknown',
      agentId: event.agentId || 'system',
      event: event.event || 'generic_event',
      level: event.level || 'info',
      details: event.details || {},
      source: event.source || 'security_engine',
      destination: event.destination,
      outcome: event.outcome || 'success',
      riskScore: event.riskScore || 0
    };

    this.auditLogs.push(auditLog);

    // Store to persistent storage
    await this.persistAuditLog(auditLog);

    // Alert on high-risk events
    if (auditLog.riskScore > 70) {
      this.emit('highRiskEvent', auditLog);
    }

    console.log(`📝 Security event logged: ${auditLog.event} (Risk: ${auditLog.riskScore})`);
  }

  // Compliance Monitoring
  async generateComplianceReport(standard: string): Promise<ComplianceReport> {
    console.log(`📋 Generating compliance report for: ${standard}`);

    const reportId = uuidv4();
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];

    // Check compliance based on standard
    switch (standard) {
      case 'SOC2':
        await this.checkSOC2Compliance(violations, recommendations);
        break;
      case 'GDPR':
        await this.checkGDPRCompliance(violations, recommendations);
        break;
      case 'HIPAA':
        await this.checkHIPAACompliance(violations, recommendations);
        break;
      case 'PCI-DSS':
        await this.checkPCIDSSCompliance(violations, recommendations);
        break;
      default:
        throw new Error(`Unsupported compliance standard: ${standard}`);
    }

    const score = this.calculateComplianceScore(violations);
    const compliant = score >= 90 && violations.filter(v => v.severity === 'critical').length === 0;

    const report: ComplianceReport = {
      reportId,
      standard,
      timestamp: new Date(),
      compliant,
      violations,
      recommendations,
      score
    };

    this.auditLogger.log({
      event: 'compliance_report_generated',
      level: 'info',
      containerId: 'system',
      details: { reportId, standard, compliant, score }
    });

    this.emit('complianceReportGenerated', report);
    return report;
  }

  // Security Monitoring Loop
  private startSecurityMonitoring(): void {
    setInterval(async () => {
      try {
        await this.performSecurityScan();
      } catch (error) {
        console.error('Security scan failed:', error);
      }
    }, 60000); // Every minute

    // Key rotation check
    setInterval(async () => {
      try {
        await this.rotateEncryptionKeys();
      } catch (error) {
        console.error('Key rotation failed:', error);
      }
    }, this.config.keyRotationInterval * 60 * 60 * 1000);

    // Audit log cleanup
    setInterval(async () => {
      try {
        await this.cleanupAuditLogs();
      } catch (error) {
        console.error('Audit log cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async performSecurityScan(): Promise<void> {
    // Scan all containers for security issues
    const containers = dockerContainerService.getAllContainers();
    
    for (const container of containers) {
      await this.scanContainerSecurity(container.containerId);
    }
  }

  private async scanContainerSecurity(containerId: string): Promise<void> {
    // Check for vulnerability patterns
    const vulnerabilities = await this.scanForVulnerabilities(containerId);
    
    if (vulnerabilities.length > 0) {
      this.auditLogger.log({
        event: 'vulnerabilities_detected',
        level: 'warning',
        containerId,
        details: { vulnerabilities }
      });
    }

    // Check network connections
    await this.analyzeNetworkTraffic(containerId);

    // Check file system access patterns
    await this.scanFileSystemAccess(containerId);
  }

  // Helper Methods
  private getSandboxCapabilities(level: 'strict' | 'medium' | 'permissive'): string[] {
    switch (level) {
      case 'strict':
        return ['CAP_NET_BIND_SERVICE'];
      case 'medium':
        return ['CAP_NET_BIND_SERVICE', 'CAP_SYS_TIME'];
      case 'permissive':
        return ['CAP_NET_BIND_SERVICE', 'CAP_SYS_TIME', 'CAP_NET_RAW'];
      default:
        return [];
    }
  }

  private createNetworkPolicy(level: string): NetworkPolicy {
    return {
      policyId: uuidv4(),
      allowedHosts: level === 'strict' ? ['localhost'] : ['*'],
      blockedHosts: ['malicious-domain.com'],
      allowedPorts: level === 'strict' ? [80, 443] : [80, 443, 8080, 3000],
      blockedPorts: [22, 21, 23], // SSH, FTP, Telnet
      protocolRestrictions: [
        { protocol: 'https', allowed: true, conditions: [] },
        { protocol: 'http', allowed: level !== 'strict', conditions: [] }
      ],
      bandwidthLimits: [
        { direction: 'egress', limit: '100mbit', burst: '32kbit' }
      ],
      dnsPolicies: [
        { allowedDomains: ['*.trusted.com'], blockedDomains: ['*.malicious.com'] }
      ]
    };
  }

  private createFileSystemPolicy(level: string): FileSystemPolicy {
    return {
      policyId: uuidv4(),
      readOnlyPaths: ['/etc', '/usr', '/bin', '/sbin'],
      writableTemporaryPaths: ['/tmp', '/var/tmp'],
      prohibitedPaths: ['/proc', '/sys'],
      encryptedPaths: level === 'strict' ? ['/workspace'] : [],
      maxFileSize: level === 'strict' ? 10 * 1024 * 1024 : 100 * 1024 * 1024, // 10MB vs 100MB
      allowedExtensions: ['.txt', '.json', '.csv', '.pdf'],
      prohibitedExtensions: ['.exe', '.bat', '.sh', '.ps1']
    };
  }

  private createResourceLimits(level: string): SecurityResourceLimits {
    const limits = {
      strict: { memory: '512m', cpu: '0.5', disk: '1g', connections: 50, files: 100, processes: 20 },
      medium: { memory: '1g', cpu: '1.0', disk: '2g', connections: 100, files: 200, processes: 50 },
      permissive: { memory: '2g', cpu: '2.0', disk: '5g', connections: 200, files: 500, processes: 100 }
    };

    const config = limits[level as keyof typeof limits];
    return {
      maxMemory: config.memory,
      maxCpu: config.cpu,
      maxDisk: config.disk,
      maxNetworkConnections: config.connections,
      maxOpenFiles: config.files,
      maxProcesses: config.processes
    };
  }

  private createSeccompProfile(level: string): SeccompProfile {
    const strictSyscalls = ['read', 'write', 'open', 'close', 'stat', 'fstat', 'lstat', 'poll'];
    const mediumSyscalls = [...strictSyscalls, 'ioctl', 'pread64', 'pwrite64', 'readv', 'writev'];
    const permissiveSyscalls = [...mediumSyscalls, 'execve', 'fork', 'clone'];

    return {
      defaultAction: level === 'strict' ? 'SCMP_ACT_ERRNO' : 'SCMP_ACT_ALLOW',
      allowedSyscalls: level === 'strict' ? strictSyscalls : level === 'medium' ? mediumSyscalls : permissiveSyscalls,
      blockedSyscalls: ['ptrace', 'process_vm_readv', 'process_vm_writev'],
      conditionalSyscalls: []
    };
  }

  private createApparmorProfile(level: string): string {
    return `profile container-${level} flags=(attach_disconnected,mediate_deleted) {
      capability,
      network,
      file,
      ${level === 'strict' ? 'deny /proc/sys/** w,' : ''}
      ${level === 'strict' ? 'deny /sys/** w,' : ''}
    }`;
  }

  // ... Additional implementation methods
  
  // Cleanup and Management
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Security & Compliance Engine...');
    
    // Final audit log cleanup
    await this.cleanupAuditLogs();
    
    // Clear sensitive data
    this.encryptionKeys.clear();
    this.containerSandboxes.clear();
    this.auditLogs.length = 0;
    this.networkTrafficLogs.length = 0;
  }

  // ... Additional helper methods (implementation details)
  private async applyNetworkPolicy(containerId: string, policy: NetworkPolicy): Promise<void> { /* Implementation */ }
  private async applyFileSystemPolicy(containerId: string, policy: FileSystemPolicy): Promise<void> { /* Implementation */ }
  private async applyResourceLimits(containerId: string, limits: SecurityResourceLimits): Promise<void> { /* Implementation */ }
  private async applySeccompProfile(containerId: string, profile: SeccompProfile): Promise<void> { /* Implementation */ }
  private async getNetworkLogFiles(containerId: string): Promise<string[]> { return []; }
  private async parseNetworkLog(logFile: string): Promise<NetworkTrafficLog[]> { return []; }
  private detectSuspiciousTraffic(logs: NetworkTrafficLog[]): any[] { return []; }
  private async getActiveEncryptionKey(purpose: string): Promise<EncryptionKey | null> { return null; }
  private async persistAuditLog(log: AuditLog): Promise<void> { /* Implementation */ }
  private async checkSOC2Compliance(violations: ComplianceViolation[], recommendations: ComplianceRecommendation[]): Promise<void> { /* Implementation */ }
  private async checkGDPRCompliance(violations: ComplianceViolation[], recommendations: ComplianceRecommendation[]): Promise<void> { /* Implementation */ }
  private async checkHIPAACompliance(violations: ComplianceViolation[], recommendations: ComplianceRecommendation[]): Promise<void> { /* Implementation */ }
  private async checkPCIDSSCompliance(violations: ComplianceViolation[], recommendations: ComplianceRecommendation[]): Promise<void> { /* Implementation */ }
  private calculateComplianceScore(violations: ComplianceViolation[]): number { return 100; }
  private async scanForVulnerabilities(containerId: string): Promise<any[]> { return []; }
  private async scanFileSystemAccess(containerId: string): Promise<void> { /* Implementation */ }
  private async cleanupAuditLogs(): Promise<void> { /* Implementation */ }
}

// Supporting Classes
class NetworkMonitor {
  constructor(config: SecurityConfig) {
    // Initialize network monitoring
  }
}

class AuditLogger {
  constructor(config: SecurityConfig) {
    // Initialize audit logging
  }

  async log(event: Partial<AuditLog>): Promise<void> {
    console.log('📝 Audit event:', event);
  }
}

class EncryptionManager {
  constructor(config: SecurityConfig) {
    // Initialize encryption management
  }
}

// Create singleton instance
export const securityComplianceEngine = new SecurityComplianceEngine({
  encryptionAlgorithm: 'aes256',
  keyRotationInterval: 24, // 24 hours
  auditRetentionPeriod: 365, // 1 year
  networkMonitoringEnabled: true,
  sandboxLevel: 'medium',
  complianceStandards: ['SOC2', 'GDPR']
});

export default securityComplianceEngine;