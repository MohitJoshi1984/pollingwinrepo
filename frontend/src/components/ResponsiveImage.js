import React, { useState } from 'react';

/**
 * ResponsiveImage component that handles:
 * - Multiple image sizes for different screen widths
 * - Lazy loading
 * - Error fallback
 * - Optimized loading
 */
export default function ResponsiveImage({ 
  src, 
  alt, 
  className = '', 
  style = {},
  sizes = '(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px'
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Default placeholder
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" text-anchor="middle" x="200" y="150"%3ENo Image%3C/text%3E%3C/svg%3E';

  // If error or no src, show placeholder
  if (error || !src) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}
      >
        <span>No Image</span>
      </div>
    );
  }

  // Check if it's an uploaded image (has responsive versions)
  const isUploadedImage = src.includes('/api/uploads/') && src.includes('_large.webp');
  
  let srcSet = null;
  if (isUploadedImage) {
    // Generate srcSet for uploaded images
    const baseUrl = src.replace('_large.webp', '');
    srcSet = `
      ${baseUrl}_small.webp 400w,
      ${baseUrl}_medium.webp 800w,
      ${baseUrl}_large.webp 1200w
    `;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {/* Loading placeholder */}
      {!loaded && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      )}
      
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
