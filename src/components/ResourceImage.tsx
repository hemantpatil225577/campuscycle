import { useState } from 'react';
import {
  BookOpen,
  FlaskConical,
  Package,
  PenTool,
  Wrench,
} from 'lucide-react';
import type { ItemCategory } from '../types/campuscycle';

interface ResourceImageProps {
  src: string;
  alt: string;
  category: ItemCategory;
  className?: string;
  priority?: boolean;
}

export function ResourceImage({
  src,
  alt,
  category,
  className = '',
  priority = false,
}: ResourceImageProps) {
  const [hasError, setHasError] = useState(false);

  const renderIcon = () => {
    switch (category) {
      case 'Textbooks':
        return <BookOpen className="h-8 w-8 text-sky-400" strokeWidth={1.5} />;
      case 'Lab Equipment':
        return (
          <FlaskConical className="h-8 w-8 text-sky-400" strokeWidth={1.5} />
        );
      case 'Engineering Tools':
        return <Wrench className="h-8 w-8 text-sky-400" strokeWidth={1.5} />;
      case 'Stationery':
        return <PenTool className="h-8 w-8 text-sky-400" strokeWidth={1.5} />;
      default:
        return <Package className="h-8 w-8 text-sky-400" strokeWidth={1.5} />;
    }
  };

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-sky-50 to-white text-sky-700 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        {renderIcon()}
        <span className="mt-2 text-xs font-medium text-sky-800/80 line-clamp-2 max-w-[18ch]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
