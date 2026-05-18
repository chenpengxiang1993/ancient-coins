import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import type { CoinImages } from '../../types';
import styles from './index.module.scss';

function getWebpSrc(src: string): string {
  return src.replace(/\.jpg$/, '.webp');
}

function getThumbSrc(src: string): string {
  return src
    .replace('/main.jpg', '/thumb.webp')
    .replace('/variant_', '/thumb_variant_')
    .replace(/\.jpg$/, '.webp');
}

interface PictureImgProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  useThumb?: boolean;
}

function PictureImg({ src, alt, className, loading, onLoad, onError, onClick, useThumb }: PictureImgProps) {
  const imgSrc = useThumb ? getThumbSrc(src) : src;
  const webpSrc = useThumb ? getThumbSrc(src) : getWebpSrc(src);
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <source srcSet={imgSrc} type="image/jpeg" />
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        loading={loading}
        onLoad={onLoad}
        onError={onError}
        onClick={onClick}
      />
    </picture>
  );
}

interface CoinImageProps {
  coinName: string;
  images: CoinImages;
}

export default memo(function CoinImage({ coinName, images }: CoinImageProps) {
  const hasMainImage = Boolean(images.main);
  const [activeSrc, setActiveSrc] = useState<string>(images.main);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [mainError, setMainError] = useState(!hasMainImage);
  const [variantErrors, setVariantErrors] = useState<Set<number>>(new Set());
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setActiveSrc(images.main);
    setMainLoaded(false);
    setMainError(!Boolean(images.main));
    setVariantErrors(new Set());
    setZoomed(false);
  }, [images.main]);

  const allImages = useMemo(() => {
    const list = hasMainImage ? [{ src: images.main, alt: coinName, label: '主图' }] : [];
    for (const v of images.variants) {
      list.push({ src: v.src, alt: v.alt, label: v.label ?? v.alt });
    }
    return list;
  }, [images, coinName, hasMainImage]);

  const handleMainLoad = useCallback(() => {
    setMainLoaded(true);
    setMainError(false);
  }, []);

  const handleMainError = useCallback(() => {
    setMainError(true);
    setMainLoaded(true);
  }, []);

  const handleVariantError = useCallback((idx: number) => {
    setVariantErrors(prev => new Set(prev).add(idx));
  }, []);

  const handleThumbClick = useCallback((src: string) => {
    setActiveSrc(src);
    setMainLoaded(false);
    setMainError(false);
  }, []);

  const handleImageClick = useCallback(() => {
    if (mainLoaded && !mainError && hasMainImage) {
      setZoomed(true);
    }
  }, [mainLoaded, mainError, hasMainImage]);

  const handleZoomClose = useCallback(() => {
    setZoomed(false);
  }, []);

  const handleZoomKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setZoomed(false);
    }
  }, []);

  const activeLabel = useMemo(
    () => allImages.find(img => img.src === activeSrc)?.label || '主图',
    [allImages, activeSrc]
  );

  const hasVariantImages = images.variants.length > 0;
  const showPlaceholder = mainError || !hasMainImage;
  const isVariant = activeSrc !== images.main;

  return (
    <div className={styles.coinImage}>
      <div className={styles.coinImageMain}>
        {showPlaceholder ? (
          <div className={styles.coinImagePlaceholder}>
            <span className={styles.coinImagePlaceholderIcon}>🏺</span>
            <span className={styles.coinImagePlaceholderText}>暂无图片</span>
          </div>
        ) : (
          <>
            {!mainLoaded && (
              <div className={styles.coinImagePlaceholder}>
                <span className={styles.coinImagePlaceholderIcon}>🏺</span>
                <span className={styles.coinImagePlaceholderText}>图片加载中</span>
              </div>
            )}
            <PictureImg
              src={activeSrc}
              alt={activeLabel}
              className={`${styles.coinImageImg} ${mainLoaded ? styles.coinImageImgVisible : ''}`}
              onLoad={handleMainLoad}
              onError={handleMainError}
              onClick={handleImageClick}
              loading="lazy"
            />
            {mainLoaded && !mainError && (
              <button className={styles.coinImageZoomHint} onClick={handleImageClick} aria-label="放大查看">
                🔍
              </button>
            )}
          </>
        )}
      </div>

      {hasVariantImages && (
        <div className={styles.coinImageLabel}>
          {isVariant ? `${coinName}·${activeLabel}` : activeLabel}
        </div>
      )}

      {hasVariantImages && (
        <div className={styles.coinImageThumbs}>
          {allImages.map((img, idx) => {
            const variantIdx = hasMainImage ? idx - 1 : idx;
            if (idx > 0 && variantIdx >= 0 && variantErrors.has(variantIdx)) return null;
            return (
              <button
                key={img.src}
                className={`${styles.coinImageThumb} ${activeSrc === img.src ? styles.coinImageThumbActive : ''}`}
                onClick={() => handleThumbClick(img.src)}
                title={img.label}
              >
                <PictureImg
                  src={img.src}
                  alt={img.alt}
                  className={styles.coinImageThumbImg}
                  onError={variantIdx >= 0 ? () => handleVariantError(variantIdx) : undefined}
                  loading="lazy"
                  useThumb
                />
                <span className={styles.coinImageThumbLabel}>{img.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {zoomed && (
        <div
          className={styles.coinImageOverlay}
          onClick={handleZoomClose}
          onKeyDown={handleZoomKeyDown}
          role="dialog"
          aria-label={`${coinName} ${activeLabel} 放大查看`}
          tabIndex={-1}
        >
          <div className={styles.coinImageOverlayContent} onClick={e => e.stopPropagation()}>
            <PictureImg
              src={activeSrc}
              alt={activeLabel}
              className={styles.coinImageOverlayImg}
            />
            <button className={styles.coinImageOverlayClose} onClick={handleZoomClose} aria-label="关闭">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
