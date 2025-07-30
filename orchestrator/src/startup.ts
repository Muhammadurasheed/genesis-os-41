import { exec } from 'child_process';

// =============================================================================
// ENHANCED ERROR HANDLING & STARTUP MANAGEMENT
// =============================================================================

// Global error handlers - MUST BE FIRST
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

process.on('warning', (warning) => {
  console.warn('⚠️ NODE WARNING:', warning.name, warning.message);
});

let isShuttingDown = false;

export async function killPortProcesses(port: number): Promise<void> {
  if (isShuttingDown) return;
  
  return new Promise((resolve) => {
    console.log(`🔍 Comprehensive port ${port} cleanup...`);
    
    if (process.platform === 'win32') {
      // Enhanced Windows port cleanup - handles both IPv4 and IPv6
      const commands = [
        `netstat -ano | findstr :${port}`,
        `netstat -ano | findstr ":::${port}"`,  // IPv6 addresses
        `netstat -ano | findstr "0.0.0.0:${port}"`  // All interfaces
      ];
      
      let allPids = new Set<string>();
      let completedCommands = 0;
      
      commands.forEach(cmd => {
        exec(cmd, (error, stdout) => {
          if (stdout) {
            const lines = stdout.split('\n');
            lines.forEach((line: string) => {
              const match = line.match(/\s+(\d+)$/);
              if (match && match[1] !== '0') allPids.add(match[1]);
            });
          }
          
          completedCommands++;
          if (completedCommands === commands.length) {
            if (allPids.size === 0) {
              console.log(`✅ Port ${port} is free`);
              return resolve();
            }

            console.log(`🔫 Found ${allPids.size} processes on port ${port}, killing...`);
            
            const killPromises = Array.from(allPids).map(pid => 
              new Promise<void>(resolve => {
                exec(`taskkill /F /PID ${pid}`, (error) => {
                  if (error) console.log(`⚠️ Failed to kill PID ${pid}: ${error.message}`);
                  else console.log(`✅ Killed PID ${pid}`);
                  resolve();
                });
              })
            );

            Promise.all(killPromises).then(() => {
              setTimeout(() => {
                console.log(`✅ Port ${port} cleanup complete`);
                resolve();
              }, 3000); // Increased wait time
            });
          }
        });
      });
    } else {
      // Enhanced Unix/Linux/Mac port cleanup
      const commands = [
        `lsof -ti :${port}`,
        `lsof -ti tcp:${port}`,
        `ss -tlnp | grep :${port} | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2`
      ];
      
      let allPids = new Set<string>();
      let completedCommands = 0;
      
      commands.forEach(cmd => {
        exec(cmd, (error, stdout) => {
          if (stdout && stdout.trim()) {
            const pids = stdout.trim().split('\n').filter(pid => pid && /^\d+$/.test(pid));
            pids.forEach(pid => allPids.add(pid));
          }
          
          completedCommands++;
          if (completedCommands === commands.length) {
            if (allPids.size === 0) {
              console.log(`✅ Port ${port} is free`);
              return resolve();
            }

            console.log(`🔫 Found ${allPids.size} processes on port ${port}, killing...`);
            
            const killPromises = Array.from(allPids).map(pid => 
              new Promise<void>(resolve => {
                exec(`kill -9 ${pid}`, (error) => {
                  if (error) console.log(`⚠️ Failed to kill PID ${pid}: ${error.message}`);
                  else console.log(`✅ Killed PID ${pid}`);
                  resolve();
                });
              })
            );

            Promise.all(killPromises).then(() => {
              setTimeout(() => {
                console.log(`✅ Port ${port} cleanup complete`);
                resolve();
              }, 3000); // Increased wait time
            });
          }
        });
      });
    }
  });
}

export async function gracefulShutdown(signal: string, server: any) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🚨 Received ${signal}. Initiating graceful shutdown...`);
  
  try {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

export async function startServerWithRetry(app: any, PORT: number, initializeClients: Function): Promise<any> {
  let retries = 3;
  let server: any = null;
  
  console.log(`🚀 Starting GenesisOS Orchestrator...`);
  
  while (retries > 0) {
    try {
      console.log(`🧹 Comprehensive port cleanup ${PORT} (attempt ${4 - retries}/3)...`);
      await killPortProcesses(PORT);
      
      // Additional wait after cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isShuttingDown) {
        console.log('⚠️ Shutdown in progress, aborting startup');
        return null;
      }
      
      console.log(`📡 Creating HTTP server on port ${PORT}...`);
      
      return new Promise((resolve, reject) => {
        server = app.listen(PORT, async () => {
          try {
            console.log(`✅ Server successfully bound to port ${PORT}!`);
            
            // Initialize clients after successful server binding
            console.log(`🔧 Initializing clients...`);
            await initializeClients();
            
            console.log(`🚀 GenesisOS Orchestrator ready at http://localhost:${PORT}`);
            console.log(`🧠 Intent Understanding Engine: FAANG-LEVEL EXCELLENCE ACTIVE`);
            console.log(`🤔 Clarification Engine: SOCRATIC QUESTIONING READY`);
            console.log(`📋 API Endpoints available:

  🧠 INTENT UNDERSTANDING (NEW - PHASE 2):
  - POST /intent/analyze                    (Analyze user intent)
  - POST /intent/:intentId/clarify          (Start clarification session)
  - POST /clarification/:sessionId/respond  (Submit clarification response)
  - GET  /clarification/:sessionId/summary  (Get session summary)
  - POST /intent/:intentId/finalize         (Finalize intent)
  - GET  /intent/:intentId                  (Get intent details)
  - GET  /user/:userId/intents              (List user intents)

  🎨 CANVAS ORCHESTRATION:
  - POST /generateCanvas
  - POST /generateEnterpriseCanvas
  - POST /optimizeLayout

  🔄 WORKFLOW ORCHESTRATION:
  - POST /executeFlow
  - POST /executeEnterpriseFlow
  - GET  /execution/:executionId
  - GET  /execution/:executionId/metrics

  🧪 SIMULATION ORCHESTRATION:
  - POST /simulation/run
  - POST /simulation/advanced
  - GET  /simulation/:simulationId/results

  📊 ANALYTICS & MONITORING:
  - POST /api/analytics/agent-analysis
  - GET  /api/analytics/guilds/:guildId/analytics

  🤖 AGENT DISPATCH:
  - POST /agentDispatch
  - POST /agentDispatchLegacy

  🗣️ VOICE & VIDEO:
  - POST /api/agent/voice/synthesize
  - GET  /api/agent/voice/voices
  - POST /api/agent/video/generate
  - GET  /api/agent/video/status/:videoId

  🧠 BLUEPRINT GENERATION:
  - POST /generateBlueprint
  - POST /api/wizard/generate-blueprint

  🚀 DEPLOYMENT:
  - POST /api/deployments/guild
  - GET  /api/deployments/status/:deploymentId
  
  ⚡ Status & Health:
  - GET  /health                           (Basic health check)
  - GET  /                                 (Detailed status & configuration)
  
  📝 Knowledge Base & Memory System:
  - POST /knowledge/create-index           (Create knowledge index)
  - POST /knowledge/search                 (Search knowledge base)
  - POST /memory/context                   (Create memory context)
  - GET  /memory/context/:contextId        (Get memory context)
  - POST /memory/store                     (Store memory)
  - GET  /memory/retrieve/:memoryId        (Retrieve memory)
  - PUT  /memory/update/:memoryId          (Update memory)
  - DELETE /memory/delete/:memoryId        (Delete memory)
  - GET  /memory/stats                     (Memory statistics)
  
  🔧 Phase 1 Integrations:
  - POST /phase1/enhanced-blueprint        (Enhanced blueprint with Phase 1 engines)
  - GET  /phase1/health                    (Phase 1 integration health)
            `);
            
            // Setup graceful shutdown for this server instance
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
            process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
            
            resolve(server);
          } catch (initError) {
            console.error(`❌ Client initialization failed:`, initError);
            reject(initError);
          }
        });

        server.on('error', (err: any) => {
          console.error(`❌ Server error:`, err.message);
          console.error(`❌ Error code:`, err.code);
          console.error(`❌ Error details:`, err);
          
          if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is in use (attempt ${4 - retries}/3)`);
            console.error(`❌ This indicates another process is still using port ${PORT}`);
            
            if (retries > 1) {
              console.log(`🔄 Retrying with enhanced cleanup in 5 seconds...`);
              retries--;
              setTimeout(() => {
                startServerWithRetry(app, PORT, initializeClients).then(resolve).catch(reject);
              }, 5000); // Increased retry delay
              return;
            } else {
              console.error(`💀 Unable to start server after 3 attempts`);
              console.error(`🔧 Manual cleanup required:`);
              console.error(`   Windows: taskkill /F /IM node.exe /IM ts-node.exe`);
              console.error(`   Unix/Mac: killall node; killall ts-node`);
              console.error(`   Or restart your terminal/IDE`);
            }
          }
          
          reject(err);
        });
      });

    } catch (error) {
      console.error(`❌ Startup failed (attempt ${4 - retries}/3):`, error);
      retries--;
      if (retries === 0) {
        console.error('💀 All startup attempts failed');
        console.error('💡 Suggestions:');
        console.error('   1. Restart your terminal/IDE');
        console.error('   2. Check if another GenesisOS instance is running');
        console.error('   3. Try a different port number');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Increased delay between retries
    }
  }
  
  throw new Error('Failed to start server after all retry attempts');
}