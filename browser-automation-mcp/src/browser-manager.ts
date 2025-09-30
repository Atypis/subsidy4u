import { chromium, firefox, webkit } from 'playwright';
import type { BrowserSession, SessionConfig, NetworkRequest } from './types.js';
import { ErrorCodes } from './types.js';
import { randomUUID } from 'crypto';

export class BrowserManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private readonly MAX_SESSIONS = 10;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupInactiveSessions(), 60000); // Check every minute
  }

  async createSession(config: SessionConfig = {}): Promise<string> {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error(ErrorCodes.MAX_SESSIONS_REACHED);
    }

    const sessionId = randomUUID();
    const {
      headless = true,
      viewport = { width: 1280, height: 720 },
      userAgent,
      browser: browserType = 'chromium',
    } = config;

    // Launch browser
    const browserLauncher = browserType === 'firefox' ? firefox : browserType === 'webkit' ? webkit : chromium;
    const browser = await browserLauncher.launch({ headless });

    // Create context
    const context = await browser.newContext({
      viewport,
      userAgent,
    });

    // Create page
    const page = await context.newPage();

    const session: BrowserSession = {
      id: sessionId,
      browser,
      context,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      requests: [],
      requestInterceptionEnabled: false,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    await session.browser.close();
    this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): BrowserSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(ErrorCodes.SESSION_NOT_FOUND);
    }
    session.lastActivity = new Date();
    return session;
  }

  enableRequestInterception(sessionId: string, urlPattern: string): void {
    const session = this.getSession(sessionId);
    session.requestInterceptionEnabled = true;
    session.requestInterceptionPattern = urlPattern;

    const pattern = new RegExp(urlPattern);

    session.page.on('request', (request) => {
      if (pattern.test(request.url())) {
        const networkRequest: NetworkRequest = {
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          timestamp: new Date(),
        };
        session.requests.push(networkRequest);
      }
    });

    session.page.on('response', async (response) => {
      if (pattern.test(response.url())) {
        const request = session.requests.find(
          (r) => r.url === response.url() && !r.status
        );
        if (request) {
          request.status = response.status();
          try {
            const body = await response.text();
            request.responseBody = body;
          } catch (e) {
            // Response body may not be available
          }
        }
      }
    });
  }

  getNetworkRequests(
    sessionId: string,
    filter?: {
      url_pattern?: string;
      method?: string;
      resource_type?: string;
    }
  ): NetworkRequest[] {
    const session = this.getSession(sessionId);
    let requests = session.requests;

    if (filter) {
      if (filter.url_pattern) {
        const pattern = new RegExp(filter.url_pattern);
        requests = requests.filter((r) => pattern.test(r.url));
      }
      if (filter.method) {
        requests = requests.filter((r) => r.method === filter.method);
      }
      if (filter.resource_type) {
        requests = requests.filter((r) => r.resourceType === filter.resource_type);
      }
    }

    return requests;
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT_MS) {
        this.closeSession(sessionId).catch(console.error);
      }
    }
  }

  async cleanup(): Promise<void> {
    const closePromises = Array.from(this.sessions.keys()).map((id) =>
      this.closeSession(id)
    );
    await Promise.all(closePromises);
  }
}
