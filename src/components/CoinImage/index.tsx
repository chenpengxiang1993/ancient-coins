import { memo, useState, useCallback, useEffect, useRef } from 'react';
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

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const ROTATE_STEP = 90;

interface ZoomViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * 放大查看器：支持缩放（按钮/滚轮）、旋转（90° 步进）、拖拽平移、复位。
 * 工具栏与关闭按钮位于 overlay 层，不随图片变换。
 */
const ZoomViewer = memo(function ZoomViewer({ src, alt, onClose }: ZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // 每次打开时复位
  useEffect(reset, [reset, src]);

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  }, []);

  const rotate = useCallback(() => {
    setRotation(r => (r + ROTATE_STEP) % 360);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
    setScale(s => {
      const next = +(s + delta).toFixed(2);
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: translate.x,
        originY: translate.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [translate],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    setTranslate({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    });
  }, []);

  const handlePointerEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div
      className={styles.coinImageOverlay}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-label={`${alt} 主图放大查看`}
      tabIndex={-1}
    >
      <div className={styles.coinImageOverlayViewport} onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className={styles.coinImageOverlayImg}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          draggable={false}
        />
      </div>
      <div className={styles.coinImageOverlayToolbar} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={zoomIn} aria-label="放大">＋</button>
        <button type="button" onClick={zoomOut} aria-label="缩小">－</button>
        <button type="button" onClick={rotate} aria-label="旋转">↻</button>
        <button type="button" onClick={reset} aria-label="复位">⟲</button>
      </div>
      <button
        type="button"
        className={styles.coinImageOverlayClose}
        onClick={onClose}
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  );
});

/** 钱币主图：webp 优先（jpg 回退）、懒加载、点击放大（支持缩放/旋转/拖拽/复位） */
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
        <ZoomViewer src={images.main} alt={coinName} onClose={handleZoomClose} />
      )}
    </div>
  );
});
