import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  mediaUrl?: string;
  mimeType?: string;
  outputType?: 'text' | 'image' | 'audio' | 'video';
}

interface BotChatProps {
  botId: number;
  botName: string;
  botAvatar?: string;
  welcomeMessage?: string;
  outputMode?: 'text' | 'image' | 'audio' | 'video';
}

export default function BotChat({ botId, botName, botAvatar, welcomeMessage, outputMode = 'text' }: BotChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (welcomeMessage) {
      setMessages([
        {
          id: 0,
          role: 'assistant',
          content: welcomeMessage,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }, [welcomeMessage]);

  useEffect(() => {
    setConversationId(null);
  }, [botId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    const messageToSend = input;

    try {
      if (outputMode === 'image') {
        const response = await api.generateBotImage(botId, messageToSend);
        if (response.success && response.data) {
          const data = response.data as any;
          const mediaUrl = data.media_url || (data.media_base64 ? `data:${data.mime_type || 'image/png'};base64,${data.media_base64}` : undefined);
          const botMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: mediaUrl ? 'Here is your generated image.' : 'Image generated, but no preview is available.',
            created_at: new Date().toISOString(),
            mediaUrl,
            mimeType: data.mime_type,
            outputType: 'image',
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response.error || 'Image generation failed. Please try again.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else if (outputMode === 'audio') {
        const response = await api.generateBotAudio(botId, messageToSend);
        if (response.success && response.data) {
          const data = response.data as any;
          const mediaUrl = data.media_base64 ? `data:${data.mime_type || 'audio/mpeg'};base64,${data.media_base64}` : undefined;
          const botMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: mediaUrl ? 'Here is your generated audio.' : 'Audio generated, but no playback is available.',
            created_at: new Date().toISOString(),
            mediaUrl,
            mimeType: data.mime_type,
            outputType: 'audio',
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response.error || 'Audio generation failed. Please try again.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else if (outputMode === 'video') {
        const response = await api.generateBotVideo(botId, messageToSend);
        if (response.success && response.data) {
          const data = response.data as any;
          const mediaUrl = data.media_url || (data.media_base64 ? `data:${data.mime_type || 'video/mp4'};base64,${data.media_base64}` : undefined);
          const botMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: mediaUrl ? 'Here is your generated video.' : 'Video generation started, but no preview URL is available yet.',
            created_at: new Date().toISOString(),
            mediaUrl,
            mimeType: data.mime_type,
            outputType: 'video',
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response.error || 'Video generation failed. Please try another model/provider.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        let response = await api.chatWithBot(botId, messageToSend, conversationId || undefined);

        const shouldRetryWithoutConversation =
          !response.success &&
          (response.error === 'Invalid conversation' || response.error === 'HTTP 403: Forbidden');

        if (shouldRetryWithoutConversation) {
          setConversationId(null);
          response = await api.chatWithBot(botId, messageToSend, undefined);
        }

        if (response.success && response.data) {
          const data = response.data as any;
          const botMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.response,
            created_at: new Date().toISOString(),
            outputType: 'text',
          };

          setMessages((prev) => [...prev, botMessage]);

          if (!conversationId) {
            setConversationId(data.conversation_id);
          }
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response.error || 'Sorry, I encountered an error. Please try again.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={botAvatar} />
            <AvatarFallback>
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <CardTitle>{botName}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-8 h-8">
                  {message.role === 'user' ? (
                    <>
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={botAvatar} />
                      <AvatarFallback>
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.outputType === 'image' && message.mediaUrl && (
                    <img
                      src={message.mediaUrl}
                      alt="Generated output"
                      className="mt-3 rounded-lg max-h-64 w-auto border border-botai-grey-line"
                    />
                  )}
                  {message.outputType === 'audio' && message.mediaUrl && (
                    <audio className="mt-3 w-full" controls src={message.mediaUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  )}
                  {message.outputType === 'video' && message.mediaUrl && (
                    <video className="mt-3 w-full rounded-lg border border-botai-grey-line" controls src={message.mediaUrl}>
                      Your browser does not support video playback.
                    </video>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={botAvatar} />
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                outputMode === 'image'
                  ? 'Describe the image you want to generate...'
                  : outputMode === 'audio'
                    ? 'Enter text to convert to audio...'
                    : outputMode === 'video'
                      ? 'Describe the video you want to generate...'
                      : 'Type your message...'
              }
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

