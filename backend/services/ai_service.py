"""
AI Service for OpenAI and other LLM integrations
Handles chat completions, token counting, and error handling
"""

import os
import base64
from typing import List, Dict, Optional, Tuple
import openai
from openai import OpenAI


class AIService:
    def __init__(self):
        # Initialize OpenAI client
        self.default_api_key = os.getenv("OPENAI_API_KEY")
        if not self.default_api_key:
            print("WARNING: OPENAI_API_KEY not set. AI features will not work.")
            self.client = None
        else:
            try:
                self.client = OpenAI(api_key=self.default_api_key)
            except Exception as e:
                print(f"WARNING: Failed to initialize default OpenAI client: {e}")
                self.client = None

    def _get_provider_base_url(self, api_provider: str) -> Optional[str]:
        provider = (api_provider or "openai").lower()
        if provider == "openrouter":
            return "https://openrouter.ai/api/v1"
        if provider == "groq":
            return "https://api.groq.com/openai/v1"
        return None

    def _get_client(self, api_provider: str = "openai", api_key: Optional[str] = None) -> Optional[OpenAI]:
        effective_api_key = (api_key or "").strip() or self.default_api_key
        if not effective_api_key:
            return None

        base_url = self._get_provider_base_url(api_provider)
        try:
            if base_url:
                return OpenAI(api_key=effective_api_key, base_url=base_url)
            return OpenAI(api_key=effective_api_key)
        except Exception as e:
            print(f"WARNING: Failed to initialize AI client for provider '{api_provider}': {e}")
            return None

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4.1-mini",
        api_provider: str = "openai",
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0
    ) -> Tuple[Optional[str], Optional[int], Optional[str]]:
        """
        Get chat completion from OpenAI

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: AI model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            top_p: Nucleus sampling parameter
            frequency_penalty: Penalty for token frequency
            presence_penalty: Penalty for token presence

        Returns:
            Tuple of (response_text, tokens_used, error_message)
        """
        client = self._get_client(api_provider=api_provider, api_key=api_key)
        if not client:
            return None, None, "OpenAI API key not configured"

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty
            )

            content = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else None

            return content, tokens, None

        except openai.AuthenticationError:
            return None, None, "Invalid API key"
        except openai.RateLimitError:
            return None, None, "Rate limit exceeded. Please try again later."
        except openai.APIConnectionError:
            return None, None, "Connection error. Please check your internet connection."
        except openai.APIError as e:
            return None, None, f"OpenAI API error: {str(e)}"
        except Exception as e:
            return None, None, f"Unexpected error: {str(e)}"

    def build_conversation_context(
        self,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        max_history: int = 10
    ) -> List[Dict[str, str]]:
        """
        Build conversation context with system prompt and history

        Args:
            system_prompt: System prompt for the bot
            conversation_history: Previous messages
            max_history: Maximum number of historical messages to include

        Returns:
            List of messages ready for API call
        """
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (limit to max_history recent messages)
        if conversation_history:
            recent_history = conversation_history[-max_history:]
            messages.extend(recent_history)

        return messages

    def estimate_tokens(self, text: str) -> int:
        """
        Rough estimation of tokens (1 token ≈ 4 characters)
        For production, use tiktoken library for accurate counting
        """
        return len(text) // 4

    def validate_model(self, model: str) -> bool:
        """
        Check if the model is supported
        """
        supported_models = [
            "gpt-5.2",
            "gpt-5-mini",
            "gpt-5-nano",
            "gpt-4.1",
            "gpt-4.1-mini",
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-audio",
            "gpt-audio-mini",
            "gpt-image-1.5",
            "sora-2",
            "anthropic/claude-sonnet-4.6",
            "anthropic/claude-opus-4.6",
            "minimax/minimax-m2.5",
            "z-ai/glm-5",
            "qwen/qwen3-max-thinking",
            "qwen/qwen3.5-plus-02-15",
            "qwen/qwen3.5-397b-a17b",
            "google/gemini-3.1-pro-preview",
            "google/gemini-flash-1.5",
            "openai/gpt-4o-mini"
        ]
        return model in supported_models

    def generate_image(
        self,
        prompt: str,
        model: str = "gpt-image-1.5",
        api_provider: str = "openai",
        api_key: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
        """
        Generate image output.

        Returns:
            Tuple of (media_url, media_base64, mime_type, error)
        """
        client = self._get_client(api_provider=api_provider, api_key=api_key)
        if not client:
            return None, None, None, "API key not configured"

        try:
            response = client.images.generate(
                model=model,
                prompt=prompt,
                size="1024x1024"
            )

            image_data = response.data[0] if response.data else None
            if not image_data:
                return None, None, None, "No image data returned"

            if getattr(image_data, "url", None):
                return image_data.url, None, "image/png", None

            if getattr(image_data, "b64_json", None):
                return None, image_data.b64_json, "image/png", None

            return None, None, None, "Unsupported image response format"
        except Exception as e:
            return None, None, None, f"Image generation failed: {str(e)}"

    def generate_audio(
        self,
        text: str,
        model: str = "gpt-audio-mini",
        api_provider: str = "openai",
        api_key: Optional[str] = None,
        voice: str = "alloy"
    ) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Generate audio output.

        Returns:
            Tuple of (media_base64, mime_type, error)
        """
        client = self._get_client(api_provider=api_provider, api_key=api_key)
        if not client:
            return None, None, "API key not configured"

        effective_model = model
        if "audio" not in (model or "") and "tts" not in (model or ""):
            effective_model = "gpt-audio-mini"

        try:
            response = client.audio.speech.create(
                model=effective_model,
                voice=voice,
                input=text
            )

            audio_bytes = None
            if hasattr(response, "read"):
                audio_bytes = response.read()
            elif hasattr(response, "content"):
                audio_bytes = response.content

            if not audio_bytes:
                return None, None, "No audio data returned"

            encoded = base64.b64encode(audio_bytes).decode("utf-8")
            return encoded, "audio/mpeg", None
        except Exception as e:
            return None, None, f"Audio generation failed: {str(e)}"

    def generate_video(
        self,
        prompt: str,
        model: str = "sora-2",
        api_provider: str = "openai",
        api_key: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
        """
        Generate video output where supported.

        Returns:
            Tuple of (media_url, media_base64, mime_type, error)
        """
        client = self._get_client(api_provider=api_provider, api_key=api_key)
        if not client:
            return None, None, None, "API key not configured"

        # Video generation availability varies by provider and model.
        # Keep this defensive and surface actionable errors instead of crashing.
        try:
            if hasattr(client, "videos") and hasattr(client.videos, "generate"):
                response = client.videos.generate(
                    model=model,
                    prompt=prompt
                )

                video_data = response.data[0] if getattr(response, "data", None) else None
                if video_data:
                    if getattr(video_data, "url", None):
                        return video_data.url, None, "video/mp4", None
                    if getattr(video_data, "b64_json", None):
                        return None, video_data.b64_json, "video/mp4", None

            if hasattr(client, "videos") and hasattr(client.videos, "generations") and hasattr(client.videos.generations, "create"):
                response = client.videos.generations.create(
                    model=model,
                    prompt=prompt
                )

                video_data = response.data[0] if getattr(response, "data", None) else None
                if video_data:
                    if getattr(video_data, "url", None):
                        return video_data.url, None, "video/mp4", None
                    if getattr(video_data, "b64_json", None):
                        return None, video_data.b64_json, "video/mp4", None

            return None, None, None, "Video generation is not available for the selected provider/model in this environment yet."
        except Exception as e:
            return None, None, None, f"Video generation failed: {str(e)}"


# Singleton instance
_ai_service_instance = None

def get_ai_service() -> AIService:
    """Get or create AI service instance"""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
