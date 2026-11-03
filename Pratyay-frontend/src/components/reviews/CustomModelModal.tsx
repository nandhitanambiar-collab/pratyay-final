import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { Button } from '../common/Button';
import { apiClient } from '../../services/api/client';
import type { SelfHostedModel } from '../../services/api/types';
import { 
  OLLAMA_DEFAULT_BASE_URL, 
  LLAMA_CPP_DEFAULT_BASE_URL, 
  COMMON_LOCAL_MODELS 
} from '../../config/models';

interface CustomModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelCreated: (model: SelfHostedModel) => void;
}

export const CustomModelModal: React.FC<CustomModelModalProps> = ({
  isOpen,
  onClose,
  onModelCreated,
}) => {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState(OLLAMA_DEFAULT_BASE_URL);
  const [model, setModel] = useState('llama3.2');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPreset = (preset: 'ollama' | 'llamacpp' | 'vllm' | 'custom') => {
    setErrorMsg(null);
    if (preset === 'ollama') {
      setName('Ollama Llama 3.2');
      setBaseUrl(OLLAMA_DEFAULT_BASE_URL);
      setModel('llama3.2');
      setApiKey('');
    } else if (preset === 'llamacpp') {
      setName('llama.cpp Local');
      setBaseUrl(LLAMA_CPP_DEFAULT_BASE_URL);
      setModel('local');
      setApiKey('');
    } else if (preset === 'vllm') {
      setName('LM Studio / vLLM');
      setBaseUrl('http://localhost:1234/v1');
      setModel('qwen2.5');
      setApiKey('');
    } else {
      setName('');
      setBaseUrl('http://');
      setModel('');
      setApiKey('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedUrl = baseUrl.trim();
    const trimmedModel = model.trim();
    const trimmedKey = apiKey.trim();

    if (!trimmedName) {
      setErrorMsg('Please specify a friendly name for this model configuration.');
      return;
    }
    if (!trimmedUrl) {
      setErrorMsg('Endpoint Base URL is required.');
      return;
    }
    if (!trimmedUrl.toLowerCase().startsWith('http://') && !trimmedUrl.toLowerCase().startsWith('https://')) {
      setErrorMsg('Endpoint Base URL must begin with http:// or https://');
      return;
    }
    if (!trimmedModel) {
      setErrorMsg('Model identifier is required (e.g. llama3.2, mistral, qwen2.5).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.selfHostedModels.create({
        name: trimmedName,
        baseUrl: trimmedUrl,
        model: trimmedModel,
        apiKey: trimmedKey || undefined,
      });

      if (res.success && res.data) {
        onModelCreated(res.data);
        onClose();
      } else {
        setErrorMsg('Server returned an unexpected response. Please verify the backend is running.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register model configuration.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-model-modal-title"
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 id="custom-model-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                Configure Compatible LLM Model
              </h2>
              <p className="text-xs text-slate-500">
                Connect Ollama, llama.cpp, vLLM, or any private OpenAI-compatible endpoint.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold">Configuration Error:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Quick Setup Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('ollama')}
                className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 text-left font-medium transition-colors cursor-pointer"
              >
                <div className="font-bold flex items-center gap-1">
                  <span>Ollama</span>
                  <span className="text-[10px] px-1 rounded bg-indigo-200/80 font-mono">11434</span>
                </div>
                <div className="text-[10px] text-indigo-600/80 mt-0.5">Localhost default</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('llamacpp')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors cursor-pointer"
              >
                <div className="font-bold">llama.cpp</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Port 8080 default</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('vllm')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors cursor-pointer"
              >
                <div className="font-bold">vLLM / LM Studio</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Port 1234 default</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('custom')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left font-medium transition-colors cursor-pointer"
              >
                <div className="font-bold">Custom URL</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Enter details</div>
              </button>
            </div>
          </div>

          {/* Model Display Name */}
          <div>
            <label htmlFor="model-name-input" className="block font-semibold text-slate-700 mb-1">
              Configuration Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="model-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ollama Llama 3.2, Qwen 2.5 7B, Mistral Small"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Base URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="model-url-input" className="block font-semibold text-slate-700">
                OpenAI-Compatible Base URL <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Appends /chat/completions</span>
            </div>
            <input
              id="model-url-input"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434/v1"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              <strong>Network notice:</strong> <code>localhost</code> is evaluated from the perspective of the machine running the FastAPI backend. If the backend is running in Docker or on a remote server, supply the host IP or DNS address reachable by the backend.
            </p>
          </div>

          {/* Model Identifier */}
          <div>
            <label htmlFor="model-id-input" className="block font-semibold text-slate-700 mb-1">
              Serving Model Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              id="model-id-input"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. llama3.2, qwen2.5, mistral, deepseek-r1:8b"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px] text-slate-500">
              <span>Suggestions:</span>
              {COMMON_LOCAL_MODELS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setModel(item)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Optional API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="model-key-input" className="block font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>API Key or Bearer Token (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Not required for standard local Ollama</span>
            </div>
            <input
              id="model-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty if authentication is not enabled"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoComplete="new-password"
            />
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-[11px] mt-1.5 leading-relaxed flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Secure Credential Handling:</strong> Keys are transmitted to the backend over your configured API gateway and stored on the server. Keys are <em>never</em> saved in your browser's LocalStorage and are <em>never</em> echoed back in GET responses.
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Registering Model...' : 'Save & Register Model'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
