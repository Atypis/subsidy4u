import type { Browser, BrowserContext, Page } from 'playwright';

export interface BrowserSession {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  createdAt: Date;
  lastActivity: Date;
  requests: NetworkRequest[];
  requestInterceptionEnabled: boolean;
  requestInterceptionPattern?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  resourceType: string;
  responseBody?: string;
  timestamp: Date;
}

export interface SessionConfig {
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
}

export interface ElementInfo {
  text: string;
  attributes: Record<string, string>;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isVisible: boolean;
  tagName: string;
}

export interface FindElementsQuery {
  text?: string;
  role?: string;
  attributes?: Record<string, string>;
}

export interface NetworkRequestFilter {
  url_pattern?: string;
  method?: string;
  resource_type?: string;
}

export interface WaitForCondition {
  condition: 'selector' | 'navigation' | 'network_idle' | 'timeout';
  target?: string;
  timeout?: number;
}

export const ErrorCodes = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  NAVIGATION_FAILED: 'NAVIGATION_FAILED',
  JS_EXECUTION_ERROR: 'JS_EXECUTION_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MAX_SESSIONS_REACHED: 'MAX_SESSIONS_REACHED',
} as const;
