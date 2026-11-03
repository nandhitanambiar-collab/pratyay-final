import type {
  GuidelineRule,
  BrandFactEvidence,
  ReviewItem,
  Finding,
  AuditEvent,
  GovernanceAnalysisResult,
} from '../../types';
import type {
  GetGuidelinesParams,
  CreateGuidelineRequest,
  UpdateGuidelineRequest,
  GetEvidenceParams,
  CreateEvidenceRequest,
  UpdateEvidenceRequest,
  GetReviewsParams,
  CreateReviewRequest,
  UpdateReviewRequest,
  AnalyzeContentRequest,
  AnalyzeContentResponse,
  SubmitSignOffRequest,
  ResubmitRevisionRequest,
  UpdateFindingDecisionRequest,
  ModelsCatalogResponse,
  SelfHostedModel,
  CreateSelfHostedModelRequest,
  GetAuditEventsParams,
  CreateAuditEventRequest,
  ApiResponse,
} from './types';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000/api/v1';

/**
 * Sanitizes and serializes query parameters, omitting undefined, null, or empty string values.
 * Prevents invalid query strings such as '?status=undefined' that cause FastAPI Pydantic validation errors.
 */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export class ApiClient {
  private baseUrl: string;
  private warnedOffline = false;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let detail = `API request failed with HTTP ${response.status}: ${response.statusText}`;
        if (typeof errorData.detail === 'string') {
          detail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          detail = errorData
            .map((item: { msg?: string; loc?: (string | number)[] }) => {
              const field = item.loc ? item.loc.join('.') : '';
              return field ? `${field}: ${item.msg || 'invalid'}` : item.msg || JSON.stringify(item);
            })
            .join('; ');
        }
        throw new Error(detail);
      }
      return (await response.json()) as T;
    } catch (err) {
      if (!this.warnedOffline) {
        // Log friendly developer guidance in the browser console
        console.info(
          `[Pratyay API Client] Backend at ${this.baseUrl} is unreachable or offline. Operating in client-side demonstration mode with localStorage.`
        );
        this.warnedOffline = true;
      }
      throw err;
    }
  }

  // Health check
  public async checkHealth(options?: RequestInit): Promise<{
    status: 'ok' | 'offline';
    timestamp: string;
    version?: string;
    database?: string;
  }> {
    try {
      return await this.request<{
        status: 'ok' | 'offline';
        timestamp: string;
        version?: string;
        database?: string;
      }>('/health', {
        ...options,
        method: 'GET',
      });
    } catch {
      return { status: 'offline', timestamp: new Date().toISOString() };
    }
  }

  // 1. Guidelines Service
  public readonly guidelines = {
    list: (params?: GetGuidelinesParams, options?: RequestInit) =>
      this.request<ApiResponse<GuidelineRule[]>>(`/guidelines${buildQueryString(params as Record<string, unknown>)}`, options),
    get: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<GuidelineRule>>(`/guidelines/${id}`, options),
    create: (data: CreateGuidelineRequest, options?: RequestInit) =>
      this.request<ApiResponse<GuidelineRule>>('/guidelines', {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateGuidelineRequest, options?: RequestInit) =>
      this.request<ApiResponse<GuidelineRule>>(`/guidelines/${id}`, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<{ deleted: boolean; id: string }>>(`/guidelines/${id}`, {
        ...options,
        method: 'DELETE',
      }),
  };

  // 2. Evidence & Facts Service
  public readonly evidence = {
    list: (params?: GetEvidenceParams, options?: RequestInit) =>
      this.request<ApiResponse<BrandFactEvidence[]>>(`/evidence${buildQueryString(params as Record<string, unknown>)}`, options),
    get: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<BrandFactEvidence>>(`/evidence/${id}`, options),
    create: (data: CreateEvidenceRequest, options?: RequestInit) =>
      this.request<ApiResponse<BrandFactEvidence>>('/evidence', {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateEvidenceRequest, options?: RequestInit) =>
      this.request<ApiResponse<BrandFactEvidence>>(`/evidence/${id}`, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<{ deleted: boolean; id: string }>>(`/evidence/${id}`, {
        ...options,
        method: 'DELETE',
      }),
  };

  // 3. Content Reviews Service
  public readonly reviews = {
    list: (params?: GetReviewsParams, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem[]>>(`/reviews${buildQueryString(params as Record<string, unknown>)}`, options),
    get: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem>>(`/reviews/${id}`, options),
    create: (data: CreateReviewRequest, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem>>('/reviews', {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateReviewRequest, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem>>(`/reviews/${id}`, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<{ deleted: boolean; id: string }>>(`/reviews/${id}`, {
        ...options,
        method: 'DELETE',
      }),
    getFindings: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<Finding[]>>(`/reviews/${id}/findings`, options),
  };

  // 4. Governance Analysis & LLM Inference
  public readonly analysis = {
    analyze: (reviewId: string, data: AnalyzeContentRequest, options?: RequestInit) =>
      this.request<ApiResponse<AnalyzeContentResponse>>(`/reviews/${reviewId}/analyze`, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getReport: (reviewId: string, options?: RequestInit) =>
      this.request<ApiResponse<GovernanceAnalysisResult>>(`/reviews/${reviewId}/report`, options),
  };

  // 5. Human Review Decisions & Sign-Off
  public readonly decisions = {
    submitSignOff: (reviewId: string, data: SubmitSignOffRequest, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem>>(`/reviews/${reviewId}/decisions/sign-off`, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resubmitRevision: (reviewId: string, data: ResubmitRevisionRequest, options?: RequestInit) =>
      this.request<ApiResponse<ReviewItem>>(`/reviews/${reviewId}/decisions/resubmit`, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateFinding: (reviewId: string, findingId: string, data: UpdateFindingDecisionRequest, options?: RequestInit) =>
      this.request<ApiResponse<Finding>>(`/reviews/${reviewId}/findings/${findingId}/decision`, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // 6. Models Catalog
  public readonly models = {
    list: (options?: RequestInit) =>
      this.request<ApiResponse<ModelsCatalogResponse>>('/models', options),
  };

  // 7. Self-Hosted Models Service
  public readonly selfHostedModels = {
    list: (options?: RequestInit) =>
      this.request<ApiResponse<SelfHostedModel[]>>('/self-hosted-models', options),
    create: (data: CreateSelfHostedModelRequest, options?: RequestInit) =>
      this.request<ApiResponse<SelfHostedModel>>('/self-hosted-models', {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string, options?: RequestInit) =>
      this.request<ApiResponse<{ deleted: boolean; id: string }>>(`/self-hosted-models/${encodeURIComponent(id)}`, {
        ...options,
        method: 'DELETE',
      }),
  };

  // 8. Audit Events
  public readonly audit = {
    list: (params?: GetAuditEventsParams, options?: RequestInit) =>
      this.request<ApiResponse<AuditEvent[]>>(`/audit-events${buildQueryString(params as Record<string, unknown>)}`, options),
    log: (data: CreateAuditEventRequest, options?: RequestInit) =>
      this.request<ApiResponse<AuditEvent>>('/audit-events', {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
}

export const apiClient = new ApiClient();

