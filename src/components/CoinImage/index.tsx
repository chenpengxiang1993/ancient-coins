import { memo, useState, useCallback, useEffect, useRef } from 'react';
import type { CoinImages } from '../../types';
import styles from './index.module.scss';

function getWebpSrc(src: string): string {
  return src.replace(/\.jpg$/, '.webp');
}

interface PictureImgProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  imgRef?: React.Ref<HTMLImageElement>;
}

function PictureImg({ src, alt, className, loading, onLoad, onError, onClick, imgRef }: PictureImgProps) {
  return (
    <picture>
      <source srcSet={getWebpSrc(src)} type="image/webp" />
      <source srcSet={src} type="image/jpeg" />
      <img
        ref={imgRef}
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
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // 每次打开时复位
  useEffect(reset, [reset, src]);

  // 任意焦点下 Esc 均可关闭（window 级监听，避免焦点丢失时无法关闭）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  }, []);

  const rotate = useCallback(() => {
    setRotation(r => (r + ROTATE_STEP) % 360);
  }, []);

  // 滚轮缩放：使用原生 listener（passive: false）确保 preventDefault 生效，避免缩放时页面跟随滚动
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP;
    setScale(s => {
      const next = +(s + delta).toFixed(2);
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

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
      role="dialog"
      aria-label={`${alt} 主图放大查看`}
      tabIndex={-1}
    >
      <div
        className={styles.coinImageOverlayViewport}
        ref={viewportRef}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className={styles.coinImageOverlayImg}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          draggable={false}
        />
      </div>
      <div className={styles.coinImageOverlayToolbar} onClick={e => e.stopPropagation()}>
        <button type="button" onClick={zoomOut} aria-label="缩小">−</button>
        <button type="button" onClick={zoomIn} aria-label="放大">＋</button>
        <button type="button" onClick={rotate} aria-label="旋转">↻</button>
        <button type="button" onClick={reset} aria-label="复位">⟲</button>
        <span className={styles.coinImageOverlayScale}>{Math.round(scale * 100)}%</span>
      </div>
      <button
        type="button"
        className={styles.coinImageOverlayClose}
        onClick={onClose}
        aria-label="关闭"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
    </div>
  );
});

/** 方孔钱占位图标（无图/加载中） */
function CoinPlaceholderIcon() {
  return (
    <svg className={styles.coinImagePlaceholderSvg} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="25" y="25" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

/** 钱币主图：webp 优先（jpg 回退）、懒加载、点击放大（支持缩放/旋转/拖拽/复位） */
export default memo(function CoinImage({ coinName, images }: CoinImageProps) {
  const hasMainImage = Boolean(images.main);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [mainError, setMainError] = useState(!hasMainImage);
  const [zoomed, setZoomed] = useState(false);
  const mainImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setMainLoaded(false);
    setMainError(!Boolean(images.main));
    setZoomed(false);
  }, [images.main]);

  // 兜底：懒加载图片若在监听挂载前已完成（缓存/瞬时加载），load 事件不再触发，
  // 此时据 complete/naturalWidth 直接标记为已加载
  useEffect(() => {
    const img = mainImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setMainLoaded(true);
      setMainError(false);
    }
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
    <section className={styles.coinImage} aria-label={`${coinName} 钱币图片`}>
      <div className={styles.coinImageMain}>
        {showPlaceholder ? (
          <div className={styles.coinImagePlaceholder}>
            <CoinPlaceholderIcon />
            <span className={styles.coinImagePlaceholderText}>暂无图片</span>
          </div>
        ) : (
          <>
            {!mainLoaded && (
              <div className={styles.coinImagePlaceholder}>
                <CoinPlaceholderIcon />
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
              imgRef={mainImgRef}
            />
            {mainLoaded && !mainError && (
              <button className={styles.coinImageZoomHint} onClick={handleImageClick} aria-label="放大查看">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {zoomed && (
        <ZoomViewer src={images.main} alt={coinName} onClose={handleZoomClose} />
      )}
    </section>
  );
});
