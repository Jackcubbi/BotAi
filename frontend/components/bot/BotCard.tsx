import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, DollarSign, Bot } from 'lucide-react';

interface BotCardProps {
  bot: {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    avatar_url?: string;
    average_rating: number;
    total_reviews: number;
    total_conversations: number;
    creator_id: number;
  };
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BotCard({ bot, showActions = false, onEdit, onDelete }: BotCardProps) {
  const navigate = useNavigate();

  const handleViewBot = () => {
    navigate(`/bots/${bot.id}`);
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-botai-grey-line shadow-sm transition-all p-6 ${
        showActions ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
      }`}
      onClick={showActions ? undefined : handleViewBot}
    >
      <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-12 h-12 border border-botai-grey-line">
            <AvatarImage src={bot.avatar_url} />
            <AvatarFallback className="bg-botai-grey-bg">
              <Bot className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-space-grotesk font-bold text-[42px] leading-tight text-botai-dark truncate">{bot.name}</h3>
            <p className="font-noto-sans text-botai-text">{bot.category}</p>
          </div>
        </div>

      <div>
        <p className="font-noto-sans text-botai-text line-clamp-2">{bot.description}</p>

        <div className="flex items-center gap-4 mt-4 text-sm font-noto-sans text-botai-text">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-botai-star text-botai-star" />
            <span>{bot.average_rating > 0 ? bot.average_rating.toFixed(1) : 'New'}</span>
            {bot.total_reviews > 0 && (
              <span className="text-xs">({bot.total_reviews})</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{bot.total_conversations}</span>
          </div>

          {bot.price > 0 && (
            <div className="flex items-center gap-1 text-botai-accent-green">
              <DollarSign className="w-4 h-4" />
              <span>${bot.price.toFixed(2)}</span>
            </div>
          )}
          {bot.price === 0 && (
            <Badge className="bg-botai-grey-bg text-botai-dark border border-botai-grey-line hover:bg-botai-grey-bg">Free</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6" onClick={(e) => e.stopPropagation()}>
        {showActions ? (
          <>
            <button
              type="button"
              className="flex-1 px-4 py-2.5 border border-botai-grey-line rounded-xl font-noto-sans font-semibold text-botai-dark hover:bg-botai-grey-bg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-noto-sans font-semibold hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            className="w-full px-4 py-2.5 bg-botai-dark text-white rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-colors"
          >
            Try Bot
          </button>
        )}
      </div>
    </div>
  );
}

