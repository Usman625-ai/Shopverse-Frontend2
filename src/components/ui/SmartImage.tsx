import { useState, type ImgHTMLAttributes } from 'react';
import { Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackIcon?: React.ReactNode;
  aspect?: 'square' | 'video' | 'auto';
}

export default function SmartImage({
  src,
  alt,
  className,
  fallbackIcon,
  aspect = 'square',
  ...rest
}: SmartImageProps) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !src || errored;
  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === 'video' ? 'aspect-video' : '';

  return (
    <div className={cn('relative overflow-hidden bg-muted', aspectClass, className)}>
      {!showFallback && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            'h-full w-full object-cover transition-all duration-300',
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          {...rest}
        />
      )}
      {showFallback && (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          {fallbackIcon ?? <Package className="h-8 w-8" />}
        </div>
      )}
      {!showFallback && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
    </div>
  );
}
