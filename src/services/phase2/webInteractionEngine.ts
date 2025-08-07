// ============================================================
// Phase 2: Web Interaction Engine - OpenAI Agent-Level Functionality
// E-commerce navigation, form handling, and advanced web automation
// ============================================================

import { EventEmitter } from 'events';
import { realPlaywrightService } from '../core/realPlaywrightService';

export interface EcommerceTask {
  taskId: string;
  type: 'search_product' | 'add_to_cart' | 'checkout' | 'fill_form' | 'login' | 'navigate_category';
  site: string;
  parameters: Record<string, any>;
  credentials?: {
    username?: string;
    password?: string;
    payment?: PaymentInfo;
  };
}

export interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface WebInteractionResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  screenshots: string[];
  actions: ActionLog[];
  duration: number;
  timestamp: Date;
}

export interface ActionLog {
  action: string;
  selector?: string;
  value?: string;
  timestamp: Date;
  screenshot?: string;
}

class WebInteractionEngine extends EventEmitter {
  private activeSessions: Map<string, string> = new Map(); // taskId -> sessionId

  constructor() {
    super();
    console.log('🌐 Web Interaction Engine initializing...');
  }

  // E-commerce Site Navigation
  async searchProduct(sessionId: string, site: string, productName: string): Promise<WebInteractionResult> {
    const taskId = `search-${Date.now()}`;
    const startTime = Date.now();
    const actions: ActionLog[] = [];
    const screenshots: string[] = [];

    try {
      console.log(`🔍 Searching for product: ${productName} on ${site}`);

      // Navigate to site
      const navResult = await realPlaywrightService.navigateToPage(sessionId, site);
      if (!navResult.success) {
        throw new Error(`Failed to navigate to ${site}: ${navResult.error}`);
      }
      
      if (navResult.screenshot) screenshots.push(navResult.screenshot);
      actions.push({
        action: 'navigate',
        value: site,
        timestamp: new Date(),
        screenshot: navResult.screenshot
      });

      // Find and click search box
      const searchSelectors = [
        'input[name="q"]',
        'input[type="search"]',
        '#search',
        '.search-input',
        '[placeholder*="search" i]'
      ];

      let searchResult;
      for (const selector of searchSelectors) {
        try {
          searchResult = await realPlaywrightService.clickElement(sessionId, selector);
          if (searchResult.success) {
            actions.push({
              action: 'click',
              selector,
              timestamp: new Date(),
              screenshot: searchResult.screenshot
            });
            if (searchResult.screenshot) screenshots.push(searchResult.screenshot);
            break;
          }
        } catch (error) {
          continue; // Try next selector
        }
      }

      if (!searchResult?.success) {
        throw new Error('Could not find search box on the page');
      }

      // Type product name
      const typeResult = await realPlaywrightService.typeText(sessionId, searchSelectors[0], productName);
      if (!typeResult.success) {
        throw new Error(`Failed to type product name: ${typeResult.error}`);
      }
      
      actions.push({
        action: 'type',
        selector: searchSelectors[0],
        value: productName,
        timestamp: new Date(),
        screenshot: typeResult.screenshot
      });
      if (typeResult.screenshot) screenshots.push(typeResult.screenshot);

      // Submit search (Enter key)
      const submitResult = await realPlaywrightService.evaluateScript(
        sessionId, 
        `document.querySelector('${searchSelectors[0]}').form.submit()`
      );
      
      if (submitResult.success) {
        actions.push({
          action: 'submit_search',
          timestamp: new Date()
        });
      }

      // Take final screenshot
      const finalScreenshot = await realPlaywrightService.takeScreenshot(sessionId);
      if (finalScreenshot.screenshot) screenshots.push(finalScreenshot.screenshot);

      const result: WebInteractionResult = {
        taskId,
        success: true,
        result: {
          searchTerm: productName,
          site,
          actionsCompleted: actions.length
        },
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', result);
      return result;

    } catch (error) {
      const result: WebInteractionResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', result);
      return result;
    }
  }

  // Add to Cart Functionality
  async addToCart(sessionId: string, productSelector?: string): Promise<WebInteractionResult> {
    const taskId = `add-to-cart-${Date.now()}`;
    const startTime = Date.now();
    const actions: ActionLog[] = [];
    const screenshots: string[] = [];

    try {
      console.log('🛒 Adding product to cart...');

      // Common "Add to Cart" button selectors
      const addToCartSelectors = productSelector ? [productSelector] : [
        '[data-testid*="add-to-cart" i]',
        'button[aria-label*="add to cart" i]',
        '.add-to-cart',
        '#add-to-cart',
        'button:contains("Add to Cart")',
        'input[value*="add to cart" i]',
        '[data-action="add-to-cart"]'
      ];

      let addResult;
      for (const selector of addToCartSelectors) {
        try {
          addResult = await realPlaywrightService.clickElement(sessionId, selector);
          if (addResult.success) {
            actions.push({
              action: 'add_to_cart',
              selector,
              timestamp: new Date(),
              screenshot: addResult.screenshot
            });
            if (addResult.screenshot) screenshots.push(addResult.screenshot);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!addResult?.success) {
        throw new Error('Could not find "Add to Cart" button');
      }

      // Wait a moment for cart update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take screenshot after adding
      const finalScreenshot = await realPlaywrightService.takeScreenshot(sessionId);
      if (finalScreenshot.screenshot) screenshots.push(finalScreenshot.screenshot);

      const result: WebInteractionResult = {
        taskId,
        success: true,
        result: { addedToCart: true },
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', result);
      return result;

    } catch (error) {
      const result: WebInteractionResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', result);
      return result;
    }
  }

  // Form Filling with Multi-field Support
  async fillForm(sessionId: string, formData: Record<string, string>): Promise<WebInteractionResult> {
    const taskId = `fill-form-${Date.now()}`;
    const startTime = Date.now();
    const actions: ActionLog[] = [];
    const screenshots: string[] = [];

    try {
      console.log('📝 Filling form with data...');

      for (const [field, value] of Object.entries(formData)) {
        // Generate possible selectors for the field
        const selectors = [
          `input[name="${field}"]`,
          `#${field}`,
          `[data-field="${field}"]`,
          `input[placeholder*="${field}" i]`,
          `textarea[name="${field}"]`,
          `select[name="${field}"]`
        ];

        let fieldFilled = false;
        for (const selector of selectors) {
          try {
            const typeResult = await realPlaywrightService.typeText(sessionId, selector, value);
            if (typeResult.success) {
              actions.push({
                action: 'fill_field',
                selector,
                value,
                timestamp: new Date(),
                screenshot: typeResult.screenshot
              });
              if (typeResult.screenshot) screenshots.push(typeResult.screenshot);
              fieldFilled = true;
              break;
            }
          } catch (error) {
            continue;
          }
        }

        if (!fieldFilled) {
          console.warn(`⚠️ Could not fill field: ${field}`);
        }
      }

      const result: WebInteractionResult = {
        taskId,
        success: true,
        result: { formData, fieldsProcessed: Object.keys(formData).length },
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', result);
      return result;

    } catch (error) {
      const result: WebInteractionResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', result);
      return result;
    }
  }

  // Multi-tab Browsing with Context Retention
  async openNewTab(sessionId: string, url: string): Promise<WebInteractionResult> {
    const taskId = `new-tab-${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log(`📑 Opening new tab: ${url}`);

      // Execute JavaScript to open new tab
      const scriptResult = await realPlaywrightService.evaluateScript(
        sessionId,
        `window.open('${url}', '_blank')`
      );

      if (!scriptResult.success) {
        throw new Error(`Failed to open new tab: ${scriptResult.error}`);
      }

      const result: WebInteractionResult = {
        taskId,
        success: true,
        result: { newTabUrl: url },
        screenshots: [],
        actions: [{
          action: 'open_tab',
          value: url,
          timestamp: new Date()
        }],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', result);
      return result;

    } catch (error) {
      const result: WebInteractionResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots: [],
        actions: [],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', result);
      return result;
    }
  }

  // File Upload/Download Operations
  async downloadFile(sessionId: string, downloadSelector: string): Promise<WebInteractionResult> {
    const taskId = `download-${Date.now()}`;
    const startTime = Date.now();
    const actions: ActionLog[] = [];
    const screenshots: string[] = [];

    try {
      console.log('⬇️ Initiating file download...');

      const clickResult = await realPlaywrightService.clickElement(sessionId, downloadSelector);
      if (!clickResult.success) {
        throw new Error(`Failed to click download link: ${clickResult.error}`);
      }

      actions.push({
        action: 'download_click',
        selector: downloadSelector,
        timestamp: new Date(),
        screenshot: clickResult.screenshot
      });
      if (clickResult.screenshot) screenshots.push(clickResult.screenshot);

      // Wait for download to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result: WebInteractionResult = {
        taskId,
        success: true,
        result: { downloadInitiated: true },
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskCompleted', result);
      return result;

    } catch (error) {
      const result: WebInteractionResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        actions,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('taskFailed', result);
      return result;
    }
  }

  // Execute complex e-commerce workflow
  async executeEcommerceWorkflow(task: EcommerceTask): Promise<WebInteractionResult> {
    console.log(`🛍️ Executing e-commerce workflow: ${task.type}`);

    const sessionId = await realPlaywrightService.createBrowserSession(`ecommerce-${task.taskId}`, {
      headless: false,
      screenshotOnAction: true
    });

    this.activeSessions.set(task.taskId, sessionId);

    try {
      switch (task.type) {
        case 'search_product':
          return await this.searchProduct(sessionId, task.site, task.parameters.productName);
        
        case 'add_to_cart':
          await realPlaywrightService.navigateToPage(sessionId, task.parameters.productUrl);
          return await this.addToCart(sessionId, task.parameters.addToCartSelector);
        
        case 'fill_form':
          await realPlaywrightService.navigateToPage(sessionId, task.parameters.formUrl);
          return await this.fillForm(sessionId, task.parameters.formData);
        
        case 'login':
          await realPlaywrightService.navigateToPage(sessionId, task.parameters.loginUrl);
          return await this.fillForm(sessionId, {
            username: task.credentials?.username || '',
            password: task.credentials?.password || ''
          });
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } finally {
      // Cleanup session
      setTimeout(() => {
        realPlaywrightService.closeBrowserSession(sessionId);
        this.activeSessions.delete(task.taskId);
      }, 30000); // Keep session for 30 seconds for debugging
    }
  }

  // Get active sessions
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  // Cleanup all sessions
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up web interaction sessions...');
    for (const sessionId of this.activeSessions.values()) {
      await realPlaywrightService.closeBrowserSession(sessionId);
    }
    this.activeSessions.clear();
  }
}

// Create singleton instance
export const webInteractionEngine = new WebInteractionEngine();
export default webInteractionEngine;