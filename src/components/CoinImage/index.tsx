import { memo, useState, useCallback, useMemo } from 'react';
import type { CoinImages } from '../../types';
import styles from './index.module.scss';

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

  const activeLabel = useMemo(
    () => allImages.find(img => img.src === activeSrc)?.label || '主图',
    [allImages, activeSrc]
  );

  const hasVariantImages = images.variants.length > 0;
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
            <img
              src={activeSrc}
              alt={activeLabel}
              className={`${styles.coinImageImg} ${mainLoaded ? styles.coinImageImgVisible : ''}`}
              onLoad={handleMainLoad}
              onError={handleMainError}
              loading="lazy"
            />
          </>
        )}
      </div>

      {hasVariantImages && (
        <div className={styles.coinImageLabel}>{activeLabel}</div>
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
                <img
                  src={img.src}
                  alt={img.alt}
                  className={styles.coinImageThumbImg}
                  onError={variantIdx >= 0 ? () => handleVariantError(variantIdx) : undefined}
                  loading="lazy"
                />
                <span className={styles.coinImageThumbLabel}>{img.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
