// ============================================================
// Real Playwright Browser Automation Service
// Production-grade browser automation for Genesis agents
// ============================================================

import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { EventEmitter } from 'events';

export interface PlaywrightConfig {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent?: string;
  timeout: number;
  screenshotOnAction: boolean;
}

export interface BrowserSessionInfo {
  sessionId: string;
  browser: Browser;
  context: BrowserContext;
  pages: Map<string, Page>;
  config: PlaywrightConfig;
  startTime: Date;
  lastActivity: Date;
}

export interface ActionResult {
  success: boolean;
  result?: any;
  error?: string;
  screenshot?: string;
  duration: number;
  timestamp: Date;
}

class RealPlaywrightService extends EventEmitter {
  private sessions: Map<string, BrowserSessionInfo> = new Map();
  private defaultConfig: PlaywrightConfig = {
    browser: 'chromium',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    timeout: 30000,
    screenshotOnAction: true
  };

  constructor() {
    super();
    console.log('🎭 Real Playwright Service initializing...');
    this.setupCleanupInterval();
  }

  // Browser Session Management
  async createBrowserSession(sessionId: string, config?: Partial<PlaywrightConfig>): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      console.log(`🚀 Creating browser session: ${sessionId}`);
      
      // Launch browser based on type
      let browser: Browser;
      switch (finalConfig.browser) {
        case 'firefox':
          browser = await firefox.launch({ 
            headless: finalConfig.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          break;
        case 'webkit':
          browser = await webkit.launch({ 
            headless: finalConfig.headless 
          });
          break;
        default:
          browser = await chromium.launch({ 
            headless: finalConfig.headless,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-extensions',
              '--disable-gpu'
            ]
          });
      }

      // Create browser context with configuration
      const context = await browser.newContext({
        viewport: finalConfig.viewport,
        userAgent: finalConfig.userAgent,
        ignoreHTTPSErrors: true,
        // Security: Disable unnecessary features
        permissions: ['geolocation'],
        hasTouch: false,
        isMobile: false
      });

      // Set default timeout
      context.setDefaultTimeout(finalConfig.timeout);

      const sessionInfo: BrowserSessionInfo = {
        sessionId,
        browser,
        context,
        pages: new Map(),
        config: finalConfig,
        startTime: new Date(),
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, sessionInfo);
      this.emit('sessionCreated', { sessionId, config: finalConfig });
      
      console.log(`✅ Browser session created successfully: ${sessionId}`);
      return sessionId;
      
    } catch (error) {
      console.error(`❌ Failed to create browser session ${sessionId}:`, error);
      throw new Error(`Failed to create browser session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Navigation Operations
  async navigateToPage(sessionId: string, url: string): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      console.log(`🌐 Navigating to: ${url}`);
      
      // Create new page or use existing
      const page = await session.context.newPage();
      const pageId = `page-${Date.now()}`;
      session.pages.set(pageId, page);
      session.lastActivity = new Date();

      // Navigate to URL
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: session.config.timeout 
      });

      if (!response || !response.ok()) {
        throw new Error(`Navigation failed with status: ${response?.status()}`);
      }

      // Take screenshot if enabled
      let screenshot: string | undefined;
      if (session.config.screenshotOnAction) {
        const buffer = await page.screenshot({ fullPage: true });
        screenshot = `data:image/png;base64,${buffer.toString('base64')}`;
      }

      const result: ActionResult = {
        success: true,
        result: {
          url: page.url(),
          title: await page.title(),
          pageId,
          status: response.status()
        },
        screenshot,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('navigationCompleted', { sessionId, url, result });
      return result;

    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('navigationFailed', { sessionId, url, error: result.error });
      return result;
    }
  }

  // Click Operations
  async clickElement(sessionId: string, selector: string, pageId?: string): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      const page = await this.getActivePage(sessionId, pageId);
      
      console.log(`👆 Clicking element: ${selector}`);
      
      // Wait for element to be visible and clickable
      await page.waitForSelector(selector, { state: 'visible' });
      await page.click(selector);

      // Take screenshot if enabled
      let screenshot: string | undefined;
      const session = this.sessions.get(sessionId);
      if (session?.config.screenshotOnAction) {
        const buffer = await page.screenshot({ fullPage: true });
        screenshot = `data:image/png;base64,${buffer.toString('base64')}`;
      }

      const result: ActionResult = {
        success: true,
        result: {
          selector,
          clicked: true,
          url: page.url()
        },
        screenshot,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('elementClicked', { sessionId, selector, result });
      return result;

    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Click failed',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('clickFailed', { sessionId, selector, error: result.error });
      return result;
    }
  }

  // Text Input Operations
  async typeText(sessionId: string, selector: string, text: string, pageId?: string): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      const page = await this.getActivePage(sessionId, pageId);
      
      console.log(`⌨️ Typing text into ${selector}: "${text}"`);
      
      // Wait for element and clear existing content
      await page.waitForSelector(selector, { state: 'visible' });
      await page.fill(selector, text);

      // Take screenshot if enabled
      let screenshot: string | undefined;
      const session = this.sessions.get(sessionId);
      if (session?.config.screenshotOnAction) {
        const buffer = await page.screenshot({ fullPage: true });
        screenshot = `data:image/png;base64,${buffer.toString('base64')}`;
      }

      const result: ActionResult = {
        success: true,
        result: {
          selector,
          text,
          typed: true,
          url: page.url()
        },
        screenshot,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('textTyped', { sessionId, selector, text, result });
      return result;

    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Type operation failed',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('typeFailed', { sessionId, selector, text, error: result.error });
      return result;
    }
  }

  // Screenshot Operations
  async takeScreenshot(sessionId: string, pageId?: string, fullPage: boolean = true): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      const page = await this.getActivePage(sessionId, pageId);
      
      console.log(`📸 Taking screenshot`);
      
      const buffer = await page.screenshot({ fullPage });
      const screenshot = `data:image/png;base64,${buffer.toString('base64')}`;

      const result: ActionResult = {
        success: true,
        result: {
          screenshot,
          url: page.url(),
          timestamp: new Date()
        },
        screenshot,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('screenshotTaken', { sessionId, result });
      return result;

    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Screenshot failed',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('screenshotFailed', { sessionId, error: result.error });
      return result;
    }
  }

  // Page Evaluation (JavaScript execution)
  async evaluateScript(sessionId: string, script: string, pageId?: string): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      const page = await this.getActivePage(sessionId, pageId);
      
      console.log(`🔧 Executing script`);
      
      const result = await page.evaluate(script);

      const actionResult: ActionResult = {
        success: true,
        result: {
          script,
          output: result,
          url: page.url()
        },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('scriptExecuted', { sessionId, script, result: actionResult });
      return actionResult;

    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Script execution failed',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('scriptFailed', { sessionId, script, error: result.error });
      return result;
    }
  }

  // Session Management
  async closeBrowserSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session ${sessionId} not found for closure`);
      return;
    }

    try {
      console.log(`🔒 Closing browser session: ${sessionId}`);
      
      // Close all pages
      for (const [pageId, page] of session.pages) {
        try {
          await page.close();
        } catch (error) {
          console.warn(`Failed to close page ${pageId}:`, error);
        }
      }

      // Close browser context and browser
      await session.context.close();
      await session.browser.close();

      this.sessions.delete(sessionId);
      this.emit('sessionClosed', { sessionId });
      
      console.log(`✅ Browser session closed: ${sessionId}`);
      
    } catch (error) {
      console.error(`❌ Error closing session ${sessionId}:`, error);
      this.sessions.delete(sessionId); // Remove anyway
    }
  }

  // Get all active sessions
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  // Get session info
  getSessionInfo(sessionId: string): BrowserSessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  // Private helper methods
  private async getActivePage(sessionId: string, pageId?: string): Promise<Page> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (pageId) {
      const page = session.pages.get(pageId);
      if (!page) {
        throw new Error(`Page ${pageId} not found in session ${sessionId}`);
      }
      return page;
    }

    // Return the last active page or create a new one
    if (session.pages.size === 0) {
      const page = await session.context.newPage();
      const newPageId = `page-${Date.now()}`;
      session.pages.set(newPageId, page);
      return page;
    }

    // Return the last page
    const pages = Array.from(session.pages.values());
    return pages[pages.length - 1];
  }

  private setupCleanupInterval(): void {
    // Clean up idle sessions every 30 minutes
    setInterval(() => {
      const now = new Date();
      const maxIdleTime = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of this.sessions) {
        const idleTime = now.getTime() - session.lastActivity.getTime();
        if (idleTime > maxIdleTime) {
          console.log(`🧹 Cleaning up idle session: ${sessionId}`);
          this.closeBrowserSession(sessionId).catch(error => 
            console.error(`Failed to cleanup session ${sessionId}:`, error)
          );
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Cleanup all sessions (for shutdown)
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up all Playwright sessions...');
    
    const sessions = Array.from(this.sessions.keys());
    await Promise.all(
      sessions.map(sessionId => this.closeBrowserSession(sessionId))
    );
    
    console.log('✅ All Playwright sessions cleaned up');
  }
}

// Create singleton instance
export const realPlaywrightService = new RealPlaywrightService();
export default realPlaywrightService;