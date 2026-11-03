export interface ModelOption {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI' | 'Meta' | 'Local' | 'Ollama' | 'Custom' | string;
  badge: string;
  tier: 'Fast' | 'Balanced' | 'Reasoning';
  description: string;
  supportsTone: boolean;
  supportsFactCheck: boolean;
  isDefault?: boolean;
  isSelfHosted?: boolean;
  available?: boolean;
  baseUrl?: string;
  modelIdentifier?: string;
  hasApiKey?: boolean;
}

export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434/v1';
export const LLAMA_CPP_DEFAULT_BASE_URL = 'http://localhost:8080/v1';

export const COMMON_LOCAL_MODELS = [
  'llama3.2',
  'qwen2.5',
  'mistral',
  'deepseek-r1',
  'phi3',
  'gemma2',
];

export const MODEL_STORAGE_KEY = 'pratyay_selected_model_v1';
export const DEFAULT_MODEL_ID = 'gemini-2.5-flash';

export const SUPPORTED_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Recommended for Speed',
    tier: 'Fast',
    description: 'Sub-second governance sweeps, high throughput terminology parsing, and structured JSON output.',
    supportsTone: true,
    supportsFactCheck: true,
    isDefault: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    badge: 'Multimodal & Reasoning',
    tier: 'Reasoning',
    description: 'Extended thinking for nuanced legal disclaimers, multi-clause claim verification, and deep contextual audits.',
    supportsTone: true,
    supportsFactCheck: true,
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    badge: 'Editorial Nuance',
    tier: 'Balanced',
    description: 'High-precision tone and voice compliance, stylistic consistency, and brand alignment.',
    supportsTone: true,
    supportsFactCheck: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'Enterprise Standard',
    tier: 'Balanced',
    description: 'General purpose enterprise compliance review and multi-jurisdiction advertising guideline matching.',
    supportsTone: true,
    supportsFactCheck: true,
  },
];

export const ACTUAL_OFFLINE_ENGINE = {
  name: 'Deterministic Rule Engine (Client Offline)',
  version: 'v1.4.0',
  description: 'Local keyword, regex, superlative, and disclaimer pattern matching. Operates client-side without external network calls.',
  statusText: 'Active Demo Engine',
};

export function selfHostedToModelOption(sh: {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}): ModelOption {
  const isOllama = sh.baseUrl.includes('11434') || sh.name.toLowerCase().includes('ollama');
  return {
    id: sh.id,
    name: sh.name,
    provider: isOllama ? 'Ollama' : 'Local',
    badge: isOllama ? 'Ollama Local' : 'OpenAI-Compatible',
    tier: 'Balanced',
    description: `Endpoint: ${sh.baseUrl} • Model: ${sh.model}${sh.hasApiKey ? ' • Authenticated' : ''}`,
    supportsTone: true,
    supportsFactCheck: true,
    isSelfHosted: true,
    baseUrl: sh.baseUrl,
    modelIdentifier: sh.model,
    hasApiKey: sh.hasApiKey,
  };
}

export function getStoredModelId(customModels: ModelOption[] = []): string {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored) {
      if (SUPPORTED_MODELS.some((m) => m.id === stored)) {
        return stored;
      }
      if (customModels.some((m) => m.id === stored)) {
        return stored;
      }
      if (stored.startsWith('selfhosted:')) {
        return stored;
      }
    }
  } catch {
    // Ignore localStorage access errors
  }
  return DEFAULT_MODEL_ID;
}

export function setStoredModelId(modelId: string): void {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  } catch {
    // Ignore localStorage access errors
  }
}

export function getModelById(modelId: string, customModels: ModelOption[] = []): ModelOption {
  const found = customModels.find((m) => m.id === modelId) || SUPPORTED_MODELS.find((m) => m.id === modelId);
  if (found) return found;

  if (modelId.startsWith('selfhosted:')) {
    return {
      id: modelId,
      name: `Self-Hosted Model (${modelId})`,
      provider: 'Local',
      badge: 'Self-Hosted',
      tier: 'Balanced',
      description: 'Configured private endpoint accessed via the FastAPI backend.',
      supportsTone: true,
      supportsFactCheck: true,
      isSelfHosted: true,
    };
  }

  return SUPPORTED_MODELS[0];
}

