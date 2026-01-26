import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center px-5">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="font-space-grotesk font-bold text-5xl lg:text-6xl text-botai-dark uppercase tracking-wide">
            {title}
          </h1>
          <p className="font-noto-sans text-xl text-botai-text leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="w-24 h-24 bg-botai-accent-green rounded-full mx-auto flex items-center justify-center">
            <div className="w-12 h-12 bg-botai-dark rounded-full"></div>
          </div>
          
          <p className="font-noto-sans text-lg text-botai-text">
            This page is coming soon! Our team is working hard to bring you an amazing experience.
            <br />
            Feel free to continue exploring or reach out to us with any questions.
          </p>
          
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 bg-botai-black text-white px-8 py-4 rounded-full font-noto-sans font-semibold text-lg uppercase tracking-wide hover:bg-botai-dark transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

