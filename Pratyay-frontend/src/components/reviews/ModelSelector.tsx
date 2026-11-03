import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Server, 
  KeyRound
} from 'lucide-react';
import {
  SUPPORTED_MODELS,
  ACTUAL_OFFLINE_ENGINE,
  selfHostedToModelOption,
  type ModelOption,
} from '../../config/models';
import { apiClient } from '../../services/api/client';
import type { SelfHostedModel } from '../../services/api/types';
import { CustomModelModal } from './CustomModelModal';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  compact = false,
}) => {
  const [selfHostedModels, setSelfHostedModels] = useState<SelfHostedModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverEngineName, setServerEngineName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiClient.selfHostedModels.list().catch(() => null),
      apiClient.models.list().catch(() => null),
    ]).then(([shRes, mRes]) => {
      if (!isMounted) return;
      if (shRes && shRes.success && Array.isArray(shRes.data)) {
        setSelfHostedModels(shRes.data);
      }
      if (mRes && mRes.success && mRes.data?.activeEngine?.name) {
        setServerEngineName(mRes.data.activeEngine.name);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const customModelOptions: ModelOption[] = selfHostedModels.map(selfHostedToModelOption);
  const allAvailableModels: ModelOption[] = [...SUPPORTED_MODELS, ...customModelOptions];

  const selectedModel = allAvailableModels.find((m) => m.id === selectedModelId) || SUPPORTED_MODELS[0];

  const handleModelCreated = (created: SelfHostedModel) => {
    setSelfHostedModels((prev) => [...prev.filter((m) => m.id !== created.id), created]);
    onSelectModel(created.id);
  };

  const handleDeleteSelfHosted = async (e: React.MouseEvent, modelId: string, modelName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove model configuration "${modelName}"?`)) {
      return;
    }
    try {
      await apiClient.selfHostedModels.delete(modelId);
      setSelfHostedModels((prev) => prev.filter((m) => m.id !== modelId));
      if (selectedModelId === modelId) {
        onSelectModel(SUPPORTED_MODELS[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete custom model';
      alert(`Could not delete model: ${msg}`);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="model-select-compact" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span>Target Model:</span>
        </label>
        <select
          id="model-select-compact"
          value={selectedModelId}
          onChange={(e) => onSelectModel(e.target.value)}
          className="text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <optgroup label="Cloud & Built-in Models">
            {SUPPORTED_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </optgroup>
          {customModelOptions.length > 0 && (
            <optgroup label="Custom & Self-Hosted Models">
              {customModelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 font-medium text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          title="Add a custom Ollama or OpenAI-compatible model"
        >
          <Plus className="w-3 h-3 text-indigo-600" />
          <span>Add Model</span>
        </button>

        <CustomModelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onModelCreated={handleModelCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-800">
            Target AI Inference Model
          </label>
          <p className="text-[11px] text-slate-500">
            Select a built-in cloud LLM or configure any self-hosted model (Ollama, llama.cpp, vLLM).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Model / Ollama</span>
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Built-in Models */}
        {SUPPORTED_MODELS.map((model: ModelOption) => {
          const isSelected = model.id === selectedModelId;
          const isAnthropic = model.provider === 'Anthropic';
          return (
            <div
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{model.name}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {model.provider}
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {model.badge}
                  </span>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {model.description}
              </p>

              {isAnthropic && (
                <div className="mt-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-tight">
                  Notice: Backend transport uses OpenAI-compatible protocol. Direct Claude calls require a proxy (e.g. LiteLLM).
                </div>
              )}

              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Tone: Supported
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Facts: Verified
                </span>
              </div>
            </div>
          );
        })}

        {/* User-Configured Self-Hosted Models */}
        {customModelOptions.map((model: ModelOption) => {
          const isSelected = model.id === selectedModelId;
          return (
            <div
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                  : 'border-emerald-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{model.name}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {model.provider}
                    </span>
                    {model.hasApiKey && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5">
                        <KeyRound className="w-2.5 h-2.5" />
                        <span>Key Set</span>
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {model.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSelfHosted(e, model.id, model.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove this custom model"
                    aria-label={`Remove model ${model.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 font-mono mt-2 line-clamp-2 leading-relaxed">
                {model.description}
              </p>

              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Server className="w-3 h-3 text-emerald-600" />
                  Self-Hosted Target ({model.id})
                </span>
              </div>
            </div>
          );
        })}

        {/* Add Model Card Tile */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] group"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 text-slate-500 flex items-center justify-center mb-2 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
            Configure Custom or Ollama Model
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            Connect Qwen, Llama, Mistral, DeepSeek, or any OpenAI-compatible server.
          </p>
        </div>
      </div>

      {/* Execution Distinction Banner */}
      <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/60 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="text-xs flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">Current Execution Engine:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[11px] font-medium">
              {serverEngineName || ACTUAL_OFFLINE_ENGINE.name}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Your configured target model (<strong>{selectedModel.name}</strong>, ID: <code className="font-mono text-indigo-700">{selectedModel.id}</code>) will be passed in the review payload. If the server does not have a live API key or target host configured for that model, it will gracefully fall back to deterministic rule checks without interrupting your workflow.
          </p>
        </div>
      </div>

      <CustomModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onModelCreated={handleModelCreated}
      />
    </div>
  );
};
