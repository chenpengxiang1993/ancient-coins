import { memo, useState, useCallback, useEffect } from 'react';
import type { CoinImages } from '../../types';
import styles from './index.module.scss';

function getWebpSrc(src: string): string {
  return src.replace(/\.jpg$/, '.webp');
}

/** 缩略图地址（thumb.webp），后续列表接入缩略图时使用 */
export function getThumbSrc(src: string): string {
  return src.replace('/main.jpg', '/thumb.webp');
}

interface PictureImgProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

function PictureImg({ src, alt, className, loading, onLoad, onError, onClick }: PictureImgProps) {
  return (
    <picture>
      <source srcSet={getWebpSrc(src)} type="image/webp" />
      <source srcSet={src} type="image/jpeg" />
      <img
        src={src}
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

/** 钱币主图：webp 优先（jpg 回退）、懒加载、点击放大（版别图已移除，仅展示主图） */
export default memo(function CoinImage({ coinName, images }: CoinImageProps) {
  const hasMainImage = Boolean(images.main);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [mainError, setMainError] = useState(!hasMainImage);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setMainLoaded(false);
    setMainError(!Boolean(images.main));
    setZoomed(false);
  }, [images.main]);

  const handleMainLoad = useCallback(() => {
    setMainLoaded(true);
    setMainError(false);
  }, []);

  const handleMainError = useCallback(() => {
    setMainError(true);
    setMainLoaded(true);
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

  const showPlaceholder = mainError || !hasMainImage;

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
              src={images.main}
              alt={coinName}
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

      {zoomed && (
        <div
          className={styles.coinImageOverlay}
          onClick={handleZoomClose}
          onKeyDown={handleZoomKeyDown}
          role="dialog"
          aria-label={`${coinName} 主图放大查看`}
          tabIndex={-1}
        >
          <div className={styles.coinImageOverlayContent} onClick={e => e.stopPropagation()}>
            <PictureImg
              src={images.main}
              alt={coinName}
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
