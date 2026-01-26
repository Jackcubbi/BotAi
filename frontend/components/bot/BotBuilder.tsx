import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bot, Settings, Zap, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const BOT_CATEGORIES = [
  'Customer Support',
  'Sales & Marketing',
  'Education & Tutoring',
  'Personal Assistant',
  'Entertainment',
  'Health & Wellness',
  'Finance',
  'Creative Writing',
  'Technical Support',
  'Other'
];

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'groq', label: 'Groq' },
];

const AI_MODELS_BY_PROVIDER: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-5.2', label: 'GPT-5.2 (Flagship)' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini (Fast & Capable)' },
    { value: 'gpt-4.1', label: 'GPT-4.1 (Smart Non-Reasoning)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Affordable)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Balanced)' },
    { value: 'gpt-audio', label: 'Creative Audio · GPT-Audio' },
    { value: 'gpt-audio-mini', label: 'Creative Audio · GPT-Audio Mini' },
    { value: 'gpt-image-1.5', label: 'Creative Images · GPT-Image 1.5' },
    { value: 'sora-2', label: 'Creative Video · Sora 2' },
  ],
  openrouter: [
    { value: 'anthropic/claude-sonnet-4.6', label: 'Best Quality · Claude Sonnet 4.6' },
    { value: 'anthropic/claude-opus-4.6', label: 'Best Quality+ · Claude Opus 4.6' },
    { value: 'minimax/minimax-m2.5', label: 'Balanced · MiniMax M2.5' },
    { value: 'z-ai/glm-5', label: 'Reasoning · GLM-5' },
    { value: 'qwen/qwen3-max-thinking', label: 'Reasoning+ · Qwen3 Max Thinking' },
    { value: 'qwen/qwen3.5-plus-02-15', label: 'Value · Qwen3.5 Plus' },
    { value: 'qwen/qwen3.5-397b-a17b', label: 'Budget · Qwen3.5 397B A17B' },
    { value: 'google/gemini-3.1-pro-preview', label: 'Creative Multimodal · Gemini 3.1 Pro' },
    { value: 'google/gemini-flash-1.5', label: 'Creative Multimodal · Gemini Flash 1.5' },
    { value: 'openai/gpt-4o-mini', label: 'Compatibility · GPT-4o Mini' },
  ],
  groq: [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
};

interface BotFormData {
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  ai_provider: string;
  ai_model: string;
  output_mode: 'text' | 'image' | 'audio' | 'video';
  ai_api_key: string;
  has_ai_api_key: boolean;
  temperature: number;
  max_tokens: number;
  price: number;
  is_public: boolean;
  avatar_url: string;
  welcome_message: string;
  fallback_response: string;
}

export default function BotBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'advanced'>('basic');

  const [formData, setFormData] = useState<BotFormData>({
    name: '',
    description: '',
    category: 'Personal Assistant',
    system_prompt: '',
    ai_provider: 'openai',
    ai_model: 'gpt-4.1-mini',
    output_mode: 'text',
    ai_api_key: '',
    has_ai_api_key: false,
    temperature: 0.7,
    max_tokens: 500,
    price: 0,
    is_public: false,
    avatar_url: '',
    welcome_message: 'Hello! How can I help you today?',
    fallback_response: "I'm not sure how to respond to that. Can you please rephrase?"
  });

  // Load bot data if editing
  useEffect(() => {
    const loadBotData = async () => {
      if (!isEditing || !id) return;

      try {
        setInitialLoading(true);
        const response = await api.getBot(Number(id));
        if (response.success && response.data) {
          const botData = response.data as any;
          const configuration = botData.configuration || {};
          setFormData({
            name: botData.name || '',
            description: botData.description || '',
            category: botData.category || 'Personal Assistant',
            system_prompt: botData.system_prompt || '',
            ai_provider: configuration.ai_provider || 'openai',
            ai_model: botData.ai_model || 'gpt-4.1-mini',
            output_mode: botData.output_mode || 'text',
            ai_api_key: '',
            has_ai_api_key: Boolean(configuration.has_ai_api_key),
            temperature: botData.temperature || 0.7,
            max_tokens: botData.max_tokens || 500,
            price: botData.price || 0,
            is_public: botData.is_public || false,
            avatar_url: botData.avatar_url || '',
            welcome_message: botData.welcome_message || 'Hello! How can I help you today?',
            fallback_response: botData.fallback_response || "I'm not sure how to respond to that. Can you please rephrase?"
          });
        } else {
          setError('Failed to load bot data');
        }
      } catch (err) {
        setError('Failed to load bot data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadBotData();
  }, [id, isEditing]);

  useEffect(() => {
    const providerModels = AI_MODELS_BY_PROVIDER[formData.ai_provider] || AI_MODELS_BY_PROVIDER.openai;
    const isCurrentModelAvailable = providerModels.some((model) => model.value === formData.ai_model);

    if (!isCurrentModelAvailable && providerModels.length > 0) {
      setFormData((prev) => ({ ...prev, ai_model: providerModels[0].value }));
    }
  }, [formData.ai_provider, formData.ai_model]);

  const handleChange = (field: keyof BotFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { ai_provider, ai_api_key, ...baseFormData } = formData;
      const payload = {
        ...baseFormData,
        configuration: {
          ai_provider,
          ...(ai_api_key.trim() ? { ai_api_key: ai_api_key.trim() } : {})
        }
      };

      let response;
      if (isEditing && id) {
        response = await api.updateBot(Number(id), payload);
        if (response.success) {
          setSuccess('Bot updated successfully!');
          setTimeout(() => {
            navigate(`/creator/bots`);
          }, 1500);
        } else {
          setError(response.error || 'Failed to update bot');
        }
      } else {
        response = await api.createBot(payload);
        if (response.success && response.data) {
          setSuccess('Bot created successfully!');
          setTimeout(() => {
            navigate(`/creator/bots`);
          }, 1500);
        } else {
          setError(response.error || 'Failed to create bot');
        }
      }
    } catch (err: any) {
      setError(isEditing ? 'Failed to update bot' : 'Failed to create bot');
    } finally {
      setLoading(false);
    }
  };

  const availableModels = AI_MODELS_BY_PROVIDER[formData.ai_provider] || AI_MODELS_BY_PROVIDER.openai;

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] bg-botai-grey-bg flex items-center justify-center">
        <div className="px-5">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-botai-accent-green border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-botai-grey-bg">
      <div className="pb-16 px-5">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-space-grotesk font-bold text-botai-black mb-4">
              {isEditing ? 'Edit Bot' : 'Create New Bot'}
            </h1>
            <p className="text-lg text-botai-text/70 font-noto-sans">
              {isEditing ? 'Update your bot configuration and settings' : 'Build your AI-powered bot with customizable settings. No coding required.'}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 font-noto-sans">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-700 font-noto-sans">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg mb-6">
              <div className="flex border-b border-botai-text/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`flex-1 px-6 py-4 font-space-grotesk font-medium transition-colors ${
                    activeTab === 'basic'
                      ? 'bg-botai-accent-green text-white rounded-tl-2xl'
                      : 'bg-white text-botai-text hover:bg-botai-grey-bg'
                  }`}
                >
                  <Bot className="w-5 h-5 inline-block mr-2" />
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-6 py-4 font-space-grotesk font-medium transition-colors ${
                    activeTab === 'ai'
                      ? 'bg-botai-accent-green text-white'
                      : 'bg-white text-botai-text hover:bg-botai-grey-bg'
                  }`}
                >
                  <Zap className="w-5 h-5 inline-block mr-2" />
                  AI Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('advanced')}
                  className={`flex-1 px-6 py-4 font-space-grotesk font-medium transition-colors ${
                    activeTab === 'advanced'
                      ? 'bg-botai-accent-green text-white rounded-tr-2xl'
                      : 'bg-white text-botai-text hover:bg-botai-grey-bg'
                  }`}
                >
                  <Settings className="w-5 h-5 inline-block mr-2" />
                  Advanced
                </button>
              </div>

              <div className="p-8">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-2">
                        Basic Information
                      </h3>
                      <p className="text-botai-text/70 font-noto-sans mb-6">
                        Set the name, description, and category for your bot
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Bot Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="My Awesome Bot"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe what your bot does..."
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      >
                        {BOT_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Avatar URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => handleChange('avatar_url', e.target.value)}
                        placeholder="https://example.com/avatar.png"
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      />
                    </div>
                  </div>
                )}

                {/* AI Configuration Tab */}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-2">
                        AI Configuration
                      </h3>
                      <p className="text-botai-text/70 font-noto-sans mb-6">
                        Configure the AI model, prompt, and behavior
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        System Prompt *
                      </label>
                      <textarea
                        value={formData.system_prompt}
                        onChange={(e) => handleChange('system_prompt', e.target.value)}
                        placeholder="You are a helpful assistant that..."
                        required
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans resize-none"
                      />
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        This defines your bot's personality and behavior
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        AI Provider
                      </label>
                      <select
                        value={formData.ai_provider}
                        onChange={(e) => handleChange('ai_provider', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      >
                        {AI_PROVIDERS.map((provider) => (
                          <option key={provider.value} value={provider.value}>{provider.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Output Mode
                      </label>
                      <select
                        value={formData.output_mode}
                        onChange={(e) => handleChange('output_mode', e.target.value as BotFormData['output_mode'])}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      >
                        <option value="text">Text Assistant</option>
                        <option value="image">Image Creator</option>
                        <option value="audio">Audio Creator</option>
                        <option value="video">Video Creator</option>
                      </select>
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        Choose what this bot mainly creates in daily use.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        AI Model
                      </label>
                      <select
                        value={formData.ai_model}
                        onChange={(e) => handleChange('ai_model', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      >
                        {availableModels.map(model => (
                          <option key={model.value} value={model.value}>{model.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        API Key (Optional)
                      </label>
                      <input
                        type="password"
                        value={formData.ai_api_key}
                        onChange={(e) => handleChange('ai_api_key', e.target.value)}
                        placeholder="Enter provider API key"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                      />
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        {formData.has_ai_api_key
                          ? 'A key is already saved. Enter a new key only if you want to replace it.'
                          : 'If empty, your bot uses the platform default key.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Temperature: {formData.temperature.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #BBF6BE 0%, #BBF6BE ${(formData.temperature / 2) * 100}%, #E5E7EB ${(formData.temperature / 2) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        Lower = more focused, Higher = more creative
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Max Tokens: {formData.max_tokens}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="4000"
                        step="50"
                        value={formData.max_tokens}
                        onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #BBF6BE 0%, #BBF6BE ${((formData.max_tokens - 50) / 3950) * 100}%, #E5E7EB ${((formData.max_tokens - 50) / 3950) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        Maximum response length
                      </p>
                    </div>
                  </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-space-grotesk font-bold text-botai-black mb-2">
                        Advanced Settings
                      </h3>
                      <p className="text-botai-text/70 font-noto-sans mb-6">
                        Set pricing, visibility, and custom messages
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={formData.welcome_message}
                        onChange={(e) => handleChange('welcome_message', e.target.value)}
                        placeholder="Hello! How can I help you today?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Fallback Response
                      </label>
                      <textarea
                        value={formData.fallback_response}
                        onChange={(e) => handleChange('fallback_response', e.target.value)}
                        placeholder="I'm not sure how to respond to that..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-space-grotesk font-medium text-botai-text mb-2">
                        Price (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-botai-text">$</span>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-botai-text/20 focus:outline-none focus:ring-2 focus:ring-botai-accent-green font-noto-sans"
                        />
                      </div>
                      <p className="text-xs text-botai-text/60 mt-1 font-noto-sans">
                        Set to 0 for free bot
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={formData.is_public}
                            onChange={(e) => handleChange('is_public', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-8 bg-botai-grey-line rounded-full peer peer-checked:bg-botai-accent-green transition-colors"></div>
                          <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                        <div>
                          <p className="font-space-grotesk font-medium text-botai-text">
                            Publish to Marketplace
                          </p>
                          <p className="text-xs text-botai-text/60 font-noto-sans">
                            Make your bot publicly available
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/creator/bots')}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-white text-botai-text rounded-full font-space-grotesk font-medium border border-botai-text/20 hover:bg-botai-grey-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-botai-accent-green text-white rounded-full font-space-grotesk font-medium hover:bg-botai-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Bot' : 'Create Bot')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

