import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Server, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { API_BASE_URL, apiClient } from '../services/api/client';
import type { SelfHostedModel, ModelsCatalogResponse } from '../services/api/types';
import { CustomModelModal } from '../components/reviews/CustomModelModal';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'workspace' | 'team' | 'models' | 'api' | 'compliance'>('models');

  // Self-hosted models state
  const [selfHostedModels, setSelfHostedModels] = useState<SelfHostedModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Backend catalog state
  const [catalogResponse, setCatalogResponse] = useState<ModelsCatalogResponse | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // Backend connection & health check state
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    online: boolean;
    latencyMs?: number;
    details?: string;
  }>({ tested: false, online: false });
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Modal & action state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSelfHostedModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const res = await apiClient.selfHostedModels.list();
      if (res && res.success && Array.isArray(res.data)) {
        setSelfHostedModels(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to retrieve self-hosted models.';
      setModelsError(msg);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await apiClient.models.list();
      if (res && res.data) {
        setCatalogResponse(res.data);
      }
    } catch {
      // Backend offline
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const performHealthCheck = useCallback(async () => {
    setIsCheckingHealth(true);
    const start = performance.now();
    try {
      const res = await apiClient.checkHealth();
      const latency = Math.round(performance.now() - start);
      if (res && res.status === 'ok') {
        setHealthStatus({
          tested: true,
          online: true,
          latencyMs: latency,
          details: `Connected (${res.version || 'v1.0.0'}, DB: ${res.database || 'connected'})`,
        });
      } else {
        setHealthStatus({
          tested: true,
          online: false,
          latencyMs: latency,
          details: 'Backend returned non-ok health status.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setHealthStatus({
        tested: true,
        online: false,
        details: `Offline or unreachable: ${msg}`,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        void fetchSelfHostedModels();
        void fetchCatalog();
        void performHealthCheck();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchSelfHostedModels, fetchCatalog, performHealthCheck]);

  const handleDeleteModel = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove configuration "${name}"?`)) {
      return;
    }
    try {
      await apiClient.selfHostedModels.delete(id);
      setSelfHostedModels((prev) => prev.filter((m) => m.id !== id));
      setActionSuccess(`Model configuration "${name}" successfully deleted.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete configuration.';
      setModelsError(msg);
    }
  };

  const handleModelCreated = (newModel: SelfHostedModel) => {
    setSelfHostedModels((prev) => [...prev, newModel]);
    setActionSuccess(`Model "${newModel.name}" configured and available for review execution.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">• Phase 1 Placeholder</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Settings & Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure workspace parameters, reviewer roles, compliance policy packs, and backend API endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Workspace & Organization</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team & Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'models'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>LLM & Model Endpoints</span>
            {selfHostedModels.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-mono">
                {selfHostedModels.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>FastAPI Backend Integration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Compliance Policy Packs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'workspace' && (
            <div className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value="Acme Global Brands Ltd."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Governance Standard Version</label>
                <input
                  type="text"
                  disabled
                  value="Enterprise Brand Standards v2.4 (Active)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Workspace settings are loaded from Phase 1 demo defaults. Full database persistence with PostgreSQL will be established in later project stages.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-500">Configured demo reviewer personas and governance authority levels:</p>
              
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Editorial Reviewer (Demo)</p>
                    <p className="text-slate-500 text-[11px]">editorial.reviewer@pratyay-governance.internal • Brand Tone & Style Authority</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[11px]">
                    Editorial Authority
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Compliance Officer (Demo)</p>
                    <p className="text-slate-500 text-[11px]">compliance.officer@pratyay-governance.internal • Legal, Claims & ASCI Code Authority</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-semibold text-[11px]">
                    Compliance Lead
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Technical Specialist (Demo)</p>
                    <p className="text-slate-500 text-[11px]">technical.lead@pratyay-governance.internal • Product Specs & Evidence Verification</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[11px]">
                    Technical Lead
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Content Creator (Demo)</p>
                    <p className="text-slate-500 text-[11px]">content.creator@pratyay-governance.internal • Draft Creation & Revisions</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px]">
                    Marketing Contributor
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6 text-xs max-w-4xl">
              {/* Alert Feedback Messages */}
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{actionSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionSuccess(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {modelsError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Error:</strong> {modelsError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModelsError(null)}
                    className="text-rose-700 hover:text-rose-900 cursor-pointer font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Health & Diagnostic Bar */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-1 sm:mt-0 ${
                    healthStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        FastAPI Engine Gateway:
                      </span>
                      <code className="text-[11px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {API_BASE_URL}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {healthStatus.tested ? healthStatus.details : 'Checking backend connectivity...'}
                      {healthStatus.latencyMs !== undefined && ` (${healthStatus.latencyMs}ms latency)`}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void performHealthCheck()}
                  disabled={isCheckingHealth}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />}
                >
                  {isCheckingHealth ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {/* Self-Hosted & Local Models List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      <span>Configured Compatible LLM Endpoints</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold">
                        {selfHostedModels.length} Active
                      </span>
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Endpoints registered via <code>POST /self-hosted-models</code>. Supports any OpenAI-compatible runtime: Ollama, vLLM, llama.cpp, LM Studio, or private hosted models.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void fetchSelfHostedModels()}
                      disabled={isLoadingModels}
                      leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />}
                    >
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCustomModalOpen(true)}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Compatible Model
                    </Button>
                  </div>
                </div>

                {selfHostedModels.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No Custom LLM Endpoints Registered</h4>
                      <p className="text-slate-500 text-xs max-w-md mx-auto mt-1 leading-relaxed">
                        You can connect local runtimes like Ollama (default <code>http://localhost:11434/v1</code>) or any OpenAI-compatible server.
                      </p>
                    </div>
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsCustomModalOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Configure Ollama / Custom Model
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selfHostedModels.map((model) => (
                      <div 
                        key={model.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-slate-900 text-xs">{model.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              selfhosted:{model.id}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Endpoint:</span>
                              <code className="font-mono text-slate-800 bg-slate-100 px-1 rounded break-all">
                                {model.baseUrl}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Model:</span>
                              <code className="font-mono font-semibold text-slate-800">
                                {model.model}
                              </code>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span>{model.hasApiKey ? 'Key Configured' : 'No Key (Public / Local)'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handleDeleteModel(model.id, model.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                            title="Delete model configuration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Built-in Catalog Models */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-600" />
                      <span>Backend Catalog & Cloud Models (<code>/models</code>)</span>
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Cloud and built-in model identifiers managed by the FastAPI server environment.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void fetchCatalog()}
                    disabled={isLoadingCatalog}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingCatalog ? 'animate-spin' : ''}`} />}
                  >
                    Refresh Catalog
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {catalogResponse && catalogResponse.models && catalogResponse.models.length > 0 ? (
                    catalogResponse.models.map((catModel) => (
                      <div key={catModel.id} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{catModel.name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            catModel.available 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                              : 'text-slate-600 bg-slate-100 border-slate-200'
                          }`}>
                            {catModel.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{catModel.id}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Provider: {catModel.provider}</p>
                        {catModel.id.includes('claude') && (
                          <p className="text-[10px] text-amber-600 mt-1 font-medium">Requires LiteLLM/OpenAI proxy</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">Gemini 2.5 Flash</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Default
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">gemini-2.5-flash</p>
                        <p className="text-[10px] text-slate-400 mt-2">Provider: Google DeepMind</p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">GPT-4o Mini</span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            Available
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">gpt-4o-mini</p>
                        <p className="text-[10px] text-slate-400 mt-2">Provider: OpenAI</p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">Claude 3.7 Sonnet</span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Requires Proxy
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">claude-3-7-sonnet</p>
                        <p className="text-[10px] text-slate-400 mt-2">Provider: Anthropic (via LiteLLM / OpenRouter)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Security Disclosure */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/70 text-indigo-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-indigo-900">Zero Client Secret Leakage Guarantee:</span> API keys and access tokens are transmitted directly to the backend database via encrypted TLS. They are never saved in browser LocalStorage or cookies, and are never echoed back in API responses.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">FastAPI Endpoint URL (Base)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    value={API_BASE_URL}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-medium"
                  />
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                    VITE_API_BASE_URL
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Configured via environment variable <code>VITE_API_BASE_URL</code> (defaults to <code>http://127.0.0.1:8000/api/v1</code>).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Database Target</label>
                <input
                  type="text"
                  disabled
                  value="PostgreSQL (Guidelines, Claims Registry, Submissions, Findings, Audit Log)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Frontend-to-Backend Contract Ready</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Typed client service definitions are established in <code>src/services/api/client.ts</code> and <code>src/services/api/types.ts</code>. The complete handoff specification is documented in <code>FRONTEND_HANDOFF.md</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <p className="text-[11px] leading-relaxed">
                  The frontend automatically runs in offline demonstration mode when the backend is unreachable. Once the FastAPI server is started, it will seamlessly receive review payloads.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3 text-xs max-w-xl">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">ASCI Advertising Codes (2024–2025)</p>
                  <p className="text-[11px] text-slate-500">Substantiation checks for efficacy claims and comparative superlatives.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">CCPA Disclosure Verification (2026)</p>
                  <p className="text-[11px] text-slate-500">Flags missing disclaimers and selection criteria disclosures.</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Model Modal */}
      <CustomModelModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onModelCreated={handleModelCreated}
      />
    </div>
  );
};
