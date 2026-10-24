import { useEffect, useState } from 'react';
import imageUrl from '../utils/imageUrl.js';

export default function ProductImage({ src, alt, className = '' }) {
  const [hasFailed, setHasFailed] = useState(false);
  const resolvedSrc = imageUrl(src);

  useEffect(() => {
    setHasFailed(false);
  }, [src]);

  if (!resolvedSrc || hasFailed) {
    return (
      <div
        className={`product-image-placeholder ${className}`.trim()}
        role="img"
        aria-label={alt ? `${alt} image unavailable` : 'Product image unavailable'}
      />
    );
  }

  return (
    <img
      className={className}
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      onError={() => setHasFailed(true)}
    />
  );
}
