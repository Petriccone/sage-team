/**
 * Playwright Bridge — Browser automation for Sage Team agents.
 * Provides screenshot, navigation, interaction, and visual tracking.
 *
 * Works in two modes:
 * 1. MCP Mode: Uses @playwright/mcp server (configured in .mcp.json)
 * 2. Direct Mode: Uses playwright-core directly for programmatic control
 *
 * Screenshots are saved to .sage-team/screenshots/ for visual tracking.
 */

import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  url?: string;
  fullPage?: boolean;
  selector?: string;
  label?: string;
  width?: number;
  height?: number;
}

export interface ScreenshotResult {
  path: string;
  url: string;
  timestamp: number;
  label: string;
  agentId: string;
  width: number;
  height: number;
}

export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'evaluate' | 'scroll';
  target?: string;
  value?: string;
  options?: Record<string, unknown>;
}

export interface BrowserState {
  isConnected: boolean;
  currentUrl: string | null;
  pageTitle: string | null;
  screenshotCount: number;
  lastScreenshot: ScreenshotResult | null;
  actionLog: BrowserActionLog[];
}

export interface BrowserActionLog {
  timestamp: number;
  agentId: string;
  action: BrowserAction;
  success: boolean;
  duration: number;
  screenshotPath?: string;
}

export class PlaywrightBridge extends EventEmitter {
  private state: BrowserState;
  private screenshotDir: string;
  private actionLog: BrowserActionLog[] = [];
  private browser: any = null;
  private page: any = null;

  constructor(projectPath: string = process.cwd()) {
    super();
    this.screenshotDir = path.join(projectPath, '.sage-team', 'screenshots');
    this.state = {
      isConnected: false,
      currentUrl: null,
      pageTitle: null,
      screenshotCount: 0,
      lastScreenshot: null,
      actionLog: [],
    };
    this.ensureScreenshotDir();
  }

  private ensureScreenshotDir(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
    // Ensure .sage-team is gitignored
    const gitignorePath = path.join(path.dirname(this.screenshotDir), '..', '.gitignore');
    try {
      const content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
      if (!content.includes('.sage-team')) {
        fs.appendFileSync(gitignorePath, '\n# Sage Team runtime data\n.sage-team/\n');
      }
    } catch {
      // Ignore gitignore errors
    }
  }

  // ─── Connection Management ──────────────────────────────────────────────

  async connect(): Promise<boolean> {
    try {
      const { chromium } = await import('playwright-core');

      // Try to find an existing browser
      const executablePath = this.findBrowserExecutable();

      if (executablePath) {
        this.browser = await chromium.launch({
          headless: true,
          executablePath,
        });
      } else {
        // Try connecting to an existing browser via CDP
        try {
          this.browser = await chromium.connectOverCDP('http://localhost:9222');
        } catch {
          // Last resort: try launching without explicit path
          this.browser = await chromium.launch({ headless: true });
        }
      }

      this.page = await this.browser.newPage({
        viewport: { width: 1280, height: 720 },
      });

      this.state.isConnected = true;
      this.emit('connected');
      return true;
    } catch (error) {
      this.state.isConnected = false;
      this.emit('connection-error', { error: (error as Error).message });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.page) {
      try { await this.page.close(); } catch {}
      this.page = null;
    }
    if (this.browser) {
      try { await this.browser.close(); } catch {}
      this.browser = null;
    }
    this.state.isConnected = false;
    this.emit('disconnected');
  }

  private findBrowserExecutable(): string | null {
    const candidates = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    // Check Playwright cache
    const cacheDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.cache', 'ms-playwright'
    );
    if (fs.existsSync(cacheDir)) {
      try {
        const entries = fs.readdirSync(cacheDir);
        for (const entry of entries) {
          if (entry.startsWith('chromium')) {
            const chromePath = path.join(cacheDir, entry, 'chrome-linux', 'chrome');
            if (fs.existsSync(chromePath)) return chromePath;
            const chromePath2 = path.join(cacheDir, entry, 'chrome-linux64', 'chrome');
            if (fs.existsSync(chromePath2)) return chromePath2;
          }
        }
      } catch {}
    }
    return null;
  }

  // ─── Browser Actions ────────────────────────────────────────────────────

  async navigate(url: string, agentId: string = 'system'): Promise<boolean> {
    if (!this.page) return false;
    const start = Date.now();
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      this.state.currentUrl = url;
      this.state.pageTitle = await this.page.title();
      this.logAction(agentId, { type: 'navigate', target: url }, true, Date.now() - start);
      this.emit('navigated', { url, title: this.state.pageTitle, agentId });
      return true;
    } catch (error) {
      this.logAction(agentId, { type: 'navigate', target: url }, false, Date.now() - start);
      return false;
    }
  }

  async screenshot(options: ScreenshotOptions & { agentId?: string } = {}): Promise<ScreenshotResult | null> {
    if (!this.page) return null;
    const start = Date.now();
    const agentId = options.agentId || 'system';

    try {
      if (options.url) {
        await this.navigate(options.url, agentId);
      }

      const timestamp = Date.now();
      const label = options.label || `screenshot-${this.state.screenshotCount + 1}`;
      const filename = `${timestamp}-${agentId}-${label.replace(/[^a-zA-Z0-9-]/g, '_')}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      const screenshotOptions: Record<string, unknown> = {
        path: filepath,
        fullPage: options.fullPage ?? false,
      };

      if (options.selector) {
        const element = await this.page.$(options.selector);
        if (element) {
          await element.screenshot(screenshotOptions);
        } else {
          await this.page.screenshot(screenshotOptions);
        }
      } else {
        await this.page.screenshot(screenshotOptions);
      }

      const result: ScreenshotResult = {
        path: filepath,
        url: this.state.currentUrl || '',
        timestamp,
        label,
        agentId,
        width: options.width || 1280,
        height: options.height || 720,
      };

      this.state.screenshotCount++;
      this.state.lastScreenshot = result;
      this.logAction(agentId, { type: 'screenshot', target: options.selector, value: label }, true, Date.now() - start, filepath);
      this.emit('screenshot-taken', result);

      return result;
    } catch (error) {
      this.logAction(agentId, { type: 'screenshot' }, false, Date.now() - start);
      return null;
    }
  }

  async click(selector: string, agentId: string = 'system'): Promise<boolean> {
    if (!this.page) return false;
    const start = Date.now();
    try {
      await this.page.click(selector, { timeout: 5000 });
      this.logAction(agentId, { type: 'click', target: selector }, true, Date.now() - start);
      this.emit('action', { type: 'click', selector, agentId });
      return true;
    } catch {
      this.logAction(agentId, { type: 'click', target: selector }, false, Date.now() - start);
      return false;
    }
  }

  async type(selector: string, text: string, agentId: string = 'system'): Promise<boolean> {
    if (!this.page) return false;
    const start = Date.now();
    try {
      await this.page.fill(selector, text, { timeout: 5000 });
      this.logAction(agentId, { type: 'type', target: selector, value: text }, true, Date.now() - start);
      this.emit('action', { type: 'type', selector, text, agentId });
      return true;
    } catch {
      this.logAction(agentId, { type: 'type', target: selector, value: text }, false, Date.now() - start);
      return false;
    }
  }

  async evaluate(script: string, agentId: string = 'system'): Promise<unknown> {
    if (!this.page) return null;
    const start = Date.now();
    try {
      const result = await this.page.evaluate(script);
      this.logAction(agentId, { type: 'evaluate', value: script.slice(0, 100) }, true, Date.now() - start);
      return result;
    } catch {
      this.logAction(agentId, { type: 'evaluate', value: script.slice(0, 100) }, false, Date.now() - start);
      return null;
    }
  }

  async waitForSelector(selector: string, timeout: number = 5000): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ─── Visual Tracking ────────────────────────────────────────────────────

  async captureProgress(
    agentId: string,
    label: string,
    url?: string
  ): Promise<ScreenshotResult | null> {
    return this.screenshot({
      agentId,
      label: `progress-${label}`,
      url,
      fullPage: true,
    });
  }

  async captureBeforeAfter(
    agentId: string,
    label: string,
    url: string
  ): Promise<{ before: ScreenshotResult | null; after: ScreenshotResult | null }> {
    const before = await this.screenshot({
      agentId,
      label: `before-${label}`,
      url,
    });
    return { before, after: null }; // after is captured after changes
  }

  async captureAfter(
    agentId: string,
    label: string,
    url?: string
  ): Promise<ScreenshotResult | null> {
    return this.screenshot({
      agentId,
      label: `after-${label}`,
      url,
    });
  }

  getScreenshotHistory(): ScreenshotResult[] {
    return this.actionLog
      .filter((a) => a.action.type === 'screenshot' && a.success && a.screenshotPath)
      .map((a) => ({
        path: a.screenshotPath!,
        url: this.state.currentUrl || '',
        timestamp: a.timestamp,
        label: a.action.value || 'screenshot',
        agentId: a.agentId,
        width: 1280,
        height: 720,
      }));
  }

  // ─── Report Generation ──────────────────────────────────────────────────

  async generateProgressReport(): Promise<string> {
    const screenshots = this.getScreenshotHistory();
    const actions = this.actionLog.slice(-50);

    let report = `# Sage Team Visual Progress Report\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Screenshots:** ${this.state.screenshotCount}\n`;
    report += `**Total Actions:** ${this.actionLog.length}\n\n`;

    report += `## Recent Screenshots\n\n`;
    for (const ss of screenshots.slice(-10)) {
      report += `- **${ss.label}** by ${ss.agentId} at ${new Date(ss.timestamp).toLocaleTimeString()}\n`;
      report += `  - URL: ${ss.url}\n`;
      report += `  - File: ${ss.path}\n\n`;
    }

    report += `## Action Timeline\n\n`;
    for (const action of actions.slice(-20)) {
      const time = new Date(action.timestamp).toLocaleTimeString();
      const status = action.success ? '✅' : '❌';
      report += `- ${status} [${time}] **${action.agentId}**: ${action.action.type}`;
      if (action.action.target) report += ` → ${action.action.target}`;
      report += ` (${action.duration}ms)\n`;
    }

    // Save report
    const reportPath = path.join(this.screenshotDir, '..', 'progress-report.md');
    fs.writeFileSync(reportPath, report);

    return report;
  }

  // ─── State & Logging ────────────────────────────────────────────────────

  getState(): BrowserState {
    return { ...this.state, actionLog: this.actionLog.slice(-50) };
  }

  private logAction(
    agentId: string,
    action: BrowserAction,
    success: boolean,
    duration: number,
    screenshotPath?: string
  ): void {
    const entry: BrowserActionLog = {
      timestamp: Date.now(),
      agentId,
      action,
      success,
      duration,
      screenshotPath,
    };
    this.actionLog.push(entry);
    if (this.actionLog.length > 500) {
      this.actionLog = this.actionLog.slice(-300);
    }
    this.state.actionLog = this.actionLog.slice(-50);
  }
}
