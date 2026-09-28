import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderArchive,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Check,
} from 'lucide-react';
import {
  ARTBOARD_HEIGHT,
  ARTBOARD_WIDTH,
  ArtboardSlide,
  ArtboardTemplateConfig,
  EXPORT_DPI,
  ExportFormat,
  ViewportBackdrop,
} from './types/artboard';
import {
  createDefaultConfigForSlide,
  createInitialArtboards,
} from './utils/templateDefaults';
import {
  exportAllArtboardsAsJpgZip,
  exportAllArtboardsAsPngZip,
  exportAllArtboardsAsSvgZip,
  exportArtboardAsJpg,
  exportArtboardAsPng,
  exportArtboardAsSvg,
} from './utils/exportEngine';
import { ArtboardSvgView } from './components/ArtboardSvgView';

export default function App() {
  const [artboards, setArtboards] = useState<ArtboardSlide[]>(() => createInitialArtboards());
  const [selectedId, setSelectedId] = useState<number>(1);
  const [backdrop, setBackdrop] = useState<ViewportBackdrop>('checkerboard');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const [isResizingCorner, setIsResizingCorner] = useState<boolean>(false);
  const [showDimensionGuides, setShowDimensionGuides] = useState<boolean>(true);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [batchZipFormat, setBatchZipFormat] = useState<ExportFormat | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
    startZoom: number;
    direction: number;
  }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
    startZoom: 1,
    direction: 1,
  });

  const currentArtboard =
    artboards.find((item) => item.id === selectedId) ?? artboards[0];

  const transparentRightWidth = ARTBOARD_WIDTH - currentArtboard.config.panelWidth;
  const isBusy = exportingFormat !== null || batchZipFormat !== null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const updateCurrentConfig = (updater: (prev: ArtboardTemplateConfig) => ArtboardTemplateConfig) => {
    setArtboards((prev) =>
      prev.map((slide) =>
        slide.id === selectedId
          ? { ...slide, config: updater(slide.config) }
          : slide
      )
    );
  };

  const handleResetCurrentArtboard = () => {
    setArtboards((prev) =>
      prev.map((slide, idx) =>
        slide.id === selectedId
          ? { ...slide, config: createDefaultConfigForSlide(idx) }
          : slide
      )
    );
    showToast(`Reset Artboard ${selectedId} to default preset`);
  };

  const resetViewportTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom handler on the stage
  const handleStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0012;
    setZoom((prev) => Math.min(3.5, Math.max(0.3, +(prev + delta).toFixed(3))));
  };

  // Mouse drag-pan handlers
  const handleStageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDraggingPan(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      startZoom: zoom,
      direction: 1,
    };
  };

  // Corner handle drag-resize handler
  const handleCornerResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: number
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setIsResizingCorner(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      startZoom: zoom,
      direction,
    };
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizingCorner) {
      const dx = (e.clientX - dragStartRef.current.clientX) * dragStartRef.current.direction;
      const newZoom = Math.min(
        3.5,
        Math.max(0.3, +(dragStartRef.current.startZoom + dx / 480).toFixed(3))
      );
      setZoom(newZoom);
      return;
    }
    if (!isDraggingPan) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    setPan({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleStageMouseUp = () => {
    if (isDraggingPan) setIsDraggingPan(false);
    if (isResizingCorner) setIsResizingCorner(false);
  };

  const handleExport = async (format: ExportFormat) => {
    if (isBusy) return;
    setExportingFormat(format);
    try {
      await new Promise((r) => setTimeout(r, 40));
      if (format === 'svg') {
        await exportArtboardAsSvg(currentArtboard);
        showToast(
          `Exported Artboard ${currentArtboard.id} (${currentArtboard.config.categoryTitle}) as vector SVG`
        );
      } else if (format === 'png') {
        await exportArtboardAsPng(currentArtboard);
        showToast(
          `Exported Artboard ${currentArtboard.id} as lossless PNG (${ARTBOARD_WIDTH} × ${ARTBOARD_HEIGHT} px · ${EXPORT_DPI} DPI)`
        );
      } else if (format === 'jpg') {
        await exportArtboardAsJpg(currentArtboard);
        showToast(
          `Exported Artboard ${currentArtboard.id} as maximum-quality JPG (${ARTBOARD_WIDTH} × ${ARTBOARD_HEIGHT} px · ${EXPORT_DPI} DPI)`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      showToast(`Export error: ${message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleBatchZipExport = async (format: ExportFormat) => {
    if (isBusy) return;
    setBatchZipFormat(format);
    setBatchProgress({ done: 0, total: artboards.length });
    try {
      await new Promise((r) => setTimeout(r, 40));
      if (format === 'svg') {
        await exportAllArtboardsAsSvgZip(artboards, (done, total) =>
          setBatchProgress({ done, total })
        );
        showToast(`Downloaded all 30 Artboards as SVG ZIP archive`);
      } else if (format === 'png') {
        await exportAllArtboardsAsPngZip(artboards, (done, total) =>
          setBatchProgress({ done, total })
        );
        showToast(`Downloaded all 30 Artboards as 300 DPI PNG ZIP archive`);
      } else if (format === 'jpg') {
        await exportAllArtboardsAsJpgZip(artboards, (done, total) =>
          setBatchProgress({ done, total })
        );
        showToast(`Downloaded all 30 Artboards as 300 DPI JPG ZIP archive`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ZIP export failed';
      showToast(`ZIP export error: ${message}`);
    } finally {
      setBatchZipFormat(null);
      setBatchProgress(null);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#0b0d11] text-slate-100 overflow-hidden">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Slide Navigation) — Zone 3 (Export Actions) */}
      <header className="h-14 shrink-0 border-b border-neutral-800/90 bg-[#0f1218] px-5 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => e.preventDefault()}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Artboard Template Studio
        </a>

        {/* Zone 2: Direct Artboard 1–30 Switcher */}
        <nav
          aria-label="Artboard Slide Switcher"
          className="hidden lg:flex items-center gap-1 bg-[#161a22] p-1 rounded-lg border border-neutral-800 max-w-2xl overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setSelectedId((prev) => (prev > 1 ? prev - 1 : artboards.length))}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Previous Artboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {artboards.map((slide) => {
              const isActive = slide.id === selectedId;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedId(slide.id)}
                  className={`px-2 py-1 text-xs font-medium font-mono tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#F79421] text-neutral-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-neutral-800/70'
                  }`}
                >
                  {slide.id}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setSelectedId((prev) => (prev < artboards.length ? prev + 1 : 1))}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Next Artboard"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>

        {/* Zone 3: Primary Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleExport('svg')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#1a1f29] hover:bg-[#242b38] border border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#F79421]" />
            <span>{exportingFormat === 'svg' ? 'Exporting SVG…' : 'Export SVG'}</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleExport('png')}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-[#F79421] hover:bg-[#ffa338] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingFormat === 'png' ? 'Rendering PNG…' : 'Export PNG'}</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleExport('jpg')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#1a1f29] hover:bg-[#242b38] border border-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{exportingFormat === 'jpg' ? 'Rendering JPG…' : 'Export JPG'}</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: 30 Switchable Artboard Slides / Thumbnails + Batch 30 ZIP Bar */}
        <aside className="w-68 shrink-0 border-r border-neutral-800/90 bg-[#0f1218] flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              30 Artboards
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              15799 × 6599 px
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {artboards.map((slide) => {
              const isSelected = slide.id === selectedId;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedId(slide.id)}
                  className={`w-full text-left rounded-lg p-2.5 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#171b24] border-[#F79421] shadow-sm'
                      : 'bg-[#12151c] border-neutral-800/90 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {slide.id}. {slide.config.categoryTitle}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0 ml-2">
                      {slide.config.itemCount} items
                    </span>
                  </div>

                  {/* Miniature True-Aspect (15799 x 6599) Vector Preview over Alpha Checkerboard */}
                  <div className="w-full aspect-[15799/6599] rounded overflow-hidden border border-neutral-800 alpha-checkerboard-sm relative">
                    <ArtboardSvgView slide={slide} className="w-full h-full" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Batch Download All 30 Artboards (ZIP) in Left Sidebar Footer */}
          <div className="p-3 border-t border-neutral-800/90 bg-[#0c0f14] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FolderArchive className="w-3.5 h-3.5 text-[#F79421]" />
                <span>Download All 30 (.ZIP)</span>
              </span>
              {batchProgress && (
                <span className="font-mono tabular-nums text-[#F79421]">
                  {batchProgress.done}/{batchProgress.total}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleBatchZipExport('svg')}
                className="py-1.5 px-2 rounded bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-[11px] font-semibold text-slate-100 text-center transition-colors cursor-pointer disabled:opacity-50"
                title="Download all 30 Artboards as a separate SVG ZIP file"
              >
                {batchZipFormat === 'svg' ? 'ZIP…' : '30 SVG'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleBatchZipExport('png')}
                className="py-1.5 px-2 rounded bg-[#F79421] hover:bg-[#ffa338] text-[11px] font-semibold text-neutral-950 text-center transition-colors cursor-pointer disabled:opacity-50"
                title="Download all 30 Artboards as a separate 300 DPI PNG ZIP file"
              >
                {batchZipFormat === 'png' ? 'ZIP…' : '30 PNG'}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleBatchZipExport('jpg')}
                className="py-1.5 px-2 rounded bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-[11px] font-semibold text-slate-100 text-center transition-colors cursor-pointer disabled:opacity-50"
                title="Download all 30 Artboards as a separate 300 DPI JPG ZIP file"
              >
                {batchZipFormat === 'jpg' ? 'ZIP…' : '30 JPG'}
              </button>
            </div>
          </div>
        </aside>

        {/* Center Workspace Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b0d11] relative">
          {/* Canvas Sub-Toolbar */}
          <div className="h-11 shrink-0 border-b border-neutral-800/80 bg-[#0e1117] px-4 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono tabular-nums overflow-hidden">
              <span className="font-semibold text-white whitespace-nowrap">
                Artboard {currentArtboard.id}: {currentArtboard.config.categoryTitle}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="whitespace-nowrap text-[#F79421]">
                {currentArtboard.config.itemCount} Designs
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="whitespace-nowrap hidden xl:inline text-slate-400">
                Drag canvas to move · Drag corners or scroll wheel to resize/zoom
              </span>
            </div>

            {/* Viewport Backdrop & Interactive Zoom Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1 bg-[#151922] p-0.5 rounded-md border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setBackdrop('checkerboard')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    backdrop === 'checkerboard'
                      ? 'bg-neutral-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Alpha Grid
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('dark-grid')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    backdrop === 'dark-grid'
                      ? 'bg-neutral-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dark Matte
                </button>
                <button
                  type="button"
                  onClick={() => setBackdrop('jpg-white')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    backdrop === 'jpg-white'
                      ? 'bg-white text-neutral-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JPG White Preview
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowDimensionGuides((v) => !v)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer ${
                  showDimensionGuides
                    ? 'bg-[#1a202c] border-neutral-700 text-slate-200'
                    : 'bg-transparent border-neutral-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                Rulers
              </button>

              {/* Zoom Slider & Controls */}
              <div className="flex items-center gap-1.5 bg-[#151922] px-2 py-0.5 rounded-md border border-neutral-800 font-mono tabular-nums">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min={0.3}
                  max={3.5}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-20 accent-[#F79421] cursor-pointer"
                  title="Zoom Artboard"
                />
                <span className="text-[11px] text-slate-200 w-10 text-right">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.15).toFixed(2)))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetViewportTransform}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Reset Zoom & Center Artboard"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Drag-Pan & Mouse-Wheel-Zoom Artboard Stage */}
          <div
            onWheel={handleStageWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onMouseLeave={handleStageMouseUp}
            className={`flex-1 overflow-hidden p-6 md:p-10 flex items-center justify-center select-none relative ${
              isResizingCorner
                ? 'cursor-nwse-resize'
                : isDraggingPan
                ? 'cursor-grabbing'
                : 'cursor-grab'
            }`}
          >
            <div
              style={{
                width: `${Math.round(1120 * zoom)}px`,
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
              }}
              className="shrink-0 relative"
            >
              {/* External Dimension Ruler Readout (Outside the Artboard) */}
              {showDimensionGuides && (
                <div className="mb-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 select-none pointer-events-none">
                  <div
                    className="border-l border-r border-[#F79421]/60 px-2 py-0.5 text-[#F79421] flex items-center justify-between"
                    style={{
                      width: `${((currentArtboard.config.panelWidth / ARTBOARD_WIDTH) * 100).toFixed(3)}%`,
                    }}
                  >
                    <span>0 px</span>
                    <span>Left Panel: {currentArtboard.config.panelWidth} px</span>
                  </div>
                  <div className="flex-1 border-r border-slate-700 px-3 py-0.5 flex items-center justify-between text-slate-400">
                    <span>
                      Transparent PNG Grid Area: {transparentRightWidth} × {ARTBOARD_HEIGHT} px ({currentArtboard.config.itemCount} {currentArtboard.config.categoryTitle})
                    </span>
                    <span>{ARTBOARD_WIDTH} px</span>
                  </div>
                </div>
              )}

              {/* The 15799 × 6599 px Artboard Frame with Interactive Corner Resize Handles */}
              <div className="relative group">
                <div
                  className={`w-full aspect-[15799/6599] relative rounded-sm shadow-2xl ring-1 ring-neutral-700/80 overflow-hidden ${
                    backdrop === 'checkerboard'
                      ? 'alpha-checkerboard'
                      : backdrop === 'jpg-white'
                      ? 'bg-white'
                      : 'bg-[#12141a]'
                  }`}
                >
                  <ArtboardSvgView slide={currentArtboard} className="w-full h-full pointer-events-none" />
                </div>

                {/* 4 Corner Drag-Resize Handles to scale the Artboard directly with mouse */}
                <div
                  onMouseDown={(e) => handleCornerResizeMouseDown(e, -1)}
                  title="Drag corner to resize artboard view"
                  className="w-3.5 h-3.5 bg-[#F79421] border-2 border-neutral-950 rounded-sm absolute -top-1.5 -left-1.5 cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onMouseDown={(e) => handleCornerResizeMouseDown(e, 1)}
                  title="Drag corner to resize artboard view"
                  className="w-3.5 h-3.5 bg-[#F79421] border-2 border-neutral-950 rounded-sm absolute -top-1.5 -right-1.5 cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onMouseDown={(e) => handleCornerResizeMouseDown(e, -1)}
                  title="Drag corner to resize artboard view"
                  className="w-3.5 h-3.5 bg-[#F79421] border-2 border-neutral-950 rounded-sm absolute -bottom-1.5 -left-1.5 cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onMouseDown={(e) => handleCornerResizeMouseDown(e, 1)}
                  title="Drag corner to resize artboard view"
                  className="w-3.5 h-3.5 bg-[#F79421] border-2 border-neutral-950 rounded-sm absolute -bottom-1.5 -right-1.5 cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />
              </div>

              {/* Quiet Footer Spec Line below Artboard */}
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums pointer-events-none">
                <div className="flex items-center gap-2">
                  <span>Slide {currentArtboard.id} of 30</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentArtboard.config.categoryTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentArtboard.config.itemCount} Vector Designs</span>
                  <span aria-hidden="true">·</span>
                  <span>15799 × 6599 px (300 DPI)</span>
                </div>
                <div>
                  {backdrop === 'jpg-white' ? (
                    <span className="text-amber-400">
                      JPG Preview Mode: Right transparent area rendered as #FFFFFF
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      True Alpha Transparency Active (Right {transparentRightWidth} × {ARTBOARD_HEIGHT} px)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Floating Quick Pan/Zoom Reset Pill when panned or zoomed */}
            {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={resetViewportTransform}
                className="absolute top-4 right-4 bg-[#161b24]/95 hover:bg-[#1f2633] border border-neutral-700 text-slate-200 px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Move className="w-3.5 h-3.5 text-[#F79421]" />
                <span>Reset View ({Math.round(zoom * 100)}%)</span>
              </button>
            )}
          </div>

          {/* Toast Status Feedback */}
          {statusMessage && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#161b24] border border-neutral-700 text-slate-100 px-4 py-2 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 z-20">
              <Check className="w-4 h-4 text-[#F79421] shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </main>

        {/* Right Sidebar: Template & Design Set Inspector + Single & Batch ZIP Export Controls */}
        <aside className="w-80 shrink-0 border-l border-neutral-800/90 bg-[#0f1218] flex flex-col min-h-0">
          {/* Inspector Header */}
          <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">
              Artboard {currentArtboard.id} Inspector
            </span>
            <button
              type="button"
              onClick={handleResetCurrentArtboard}
              className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#171c26] hover:bg-neutral-800 border border-neutral-700/80 rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset current artboard to default preset"
            >
              <RotateCcw className="w-3 h-3 text-[#F79421]" />
              <span>Reset Slide</span>
            </button>
          </div>

          {/* Editable Controls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Left Panel Showcase Title & Footer Count */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Left Panel Design Title (English)
                </label>
                <input
                  type="text"
                  value={currentArtboard.config.categoryTitle}
                  onChange={(e) =>
                    updateCurrentConfig((c) => ({
                      ...c,
                      categoryTitle: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md bg-[#151922] border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-[#F79421]"
                  placeholder="PILL BUTTONS"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Footer Icon Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={currentArtboard.config.itemCount}
                    onChange={(e) =>
                      updateCurrentConfig((c) => ({
                        ...c,
                        itemCount: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-md bg-[#151922] border border-neutral-800 text-white font-mono tabular-nums text-xs focus:outline-none focus:border-[#F79421]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Footer Type Label
                  </label>
                  <input
                    type="text"
                    value={currentArtboard.config.footerLabelLine1}
                    onChange={(e) =>
                      updateCurrentConfig((c) => ({
                        ...c,
                        footerLabelLine1: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-md bg-[#151922] border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-[#F79421]"
                  />
                </div>
              </div>
            </div>

            {/* Uncommon Design Color Palette Controls */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
              <span className="block text-slate-300 font-medium">
                Design Set Uncommon Colors
              </span>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1.5 bg-[#151922] p-2 rounded-md border border-neutral-800">
                  <span className="text-[11px] text-slate-400">Primary</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="color"
                      value={currentArtboard.config.designPrimaryColor}
                      onChange={(e) =>
                        updateCurrentConfig((c) => ({
                          ...c,
                          designPrimaryColor: e.target.value,
                        }))
                      }
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-300 uppercase">
                      {currentArtboard.config.designPrimaryColor}
                    </span>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 bg-[#151922] p-2 rounded-md border border-neutral-800">
                  <span className="text-[11px] text-slate-400">Secondary</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="color"
                      value={currentArtboard.config.designSecondaryColor}
                      onChange={(e) =>
                        updateCurrentConfig((c) => ({
                          ...c,
                          designSecondaryColor: e.target.value,
                        }))
                      }
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-300 uppercase">
                      {currentArtboard.config.designSecondaryColor}
                    </span>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 bg-[#151922] p-2 rounded-md border border-neutral-800">
                  <span className="text-[11px] text-slate-400">Highlight</span>
                  <div className="flex items-center justify-between">
                    <input
                      type="color"
                      value={currentArtboard.config.designTertiaryColor}
                      onChange={(e) =>
                        updateCurrentConfig((c) => ({
                          ...c,
                          designTertiaryColor: e.target.value,
                        }))
                      }
                      className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-300 uppercase">
                      {currentArtboard.config.designTertiaryColor}
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    Right Area Icon Size Scale
                  </label>
                  <span className="font-mono tabular-nums text-slate-400">
                    {Math.round(currentArtboard.config.iconScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.15}
                  step={0.02}
                  value={currentArtboard.config.iconScale}
                  onChange={(e) =>
                    updateCurrentConfig((c) => ({
                      ...c,
                      iconScale: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#F79421] cursor-pointer"
                />
              </div>
            </div>

            {/* Left Panel Structure Controls */}
            <div className="pt-3 border-t border-neutral-800/80 space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Top Ribbon Label
                </label>
                <input
                  type="text"
                  value={currentArtboard.config.ribbonText}
                  onChange={(e) =>
                    updateCurrentConfig((c) => ({
                      ...c,
                      ribbonText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md bg-[#151922] border border-neutral-800 text-white font-mono text-xs focus:outline-none focus:border-[#F79421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center justify-between bg-[#151922] px-2.5 py-2 rounded-md border border-neutral-800">
                  <span className="text-slate-300">Ribbon / Footer</span>
                  <input
                    type="color"
                    value={currentArtboard.config.accentYellowOrangeColor}
                    onChange={(e) =>
                      updateCurrentConfig((c) => ({
                        ...c,
                        accentYellowOrangeColor: e.target.value,
                      }))
                    }
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between bg-[#151922] px-2.5 py-2 rounded-md border border-neutral-800">
                  <span className="text-slate-300">Dark Panel</span>
                  <input
                    type="color"
                    value={currentArtboard.config.baseDarkColor}
                    onChange={(e) =>
                      updateCurrentConfig((c) => ({
                        ...c,
                        baseDarkColor: e.target.value,
                      }))
                    }
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Export Section: Single Artboard + Batch All 10 ZIP Archives */}
          <div className="p-4 border-t border-neutral-800/90 bg-[#0c0f14] space-y-3">
            {/* Single Selected Artboard Export */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Export {currentArtboard.name}
                </span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  Single File
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleExport('svg')}
                  className="py-2 px-2 rounded-lg bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-xs font-medium text-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-[#F79421]" />
                  <span>SVG</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleExport('png')}
                  className="py-2 px-2 rounded-lg bg-[#F79421] hover:bg-[#ffa338] text-xs font-semibold text-neutral-950 flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleExport('jpg')}
                  className="py-2 px-2 rounded-lg bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-xs font-medium text-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>JPG</span>
                </button>
              </div>
            </div>

            {/* Batch Download All 30 Artboards as Separate ZIP Files */}
            <div className="pt-2.5 border-t border-neutral-800/90 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-[#F79421]" />
                  <span>Download All 30 (ZIP)</span>
                </span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {batchProgress
                    ? `${batchProgress.done}/${batchProgress.total} Ready`
                    : '30 Files / ZIP'}
                </span>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleBatchZipExport('svg')}
                  className="w-full py-2 px-3 rounded-lg bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-xs font-medium text-slate-100 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <FolderArchive className="w-3.5 h-3.5 text-[#F79421]" />
                    <span>
                      {batchZipFormat === 'svg' && batchProgress
                        ? `Packaging SVG ZIP (${batchProgress.done}/${batchProgress.total})…`
                        : 'All 30 SVG Files (.ZIP)'}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">30× Vector</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleBatchZipExport('png')}
                  className="w-full py-2 px-3 rounded-lg bg-[#F79421] hover:bg-[#ffa338] text-xs font-semibold text-neutral-950 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>
                      {batchZipFormat === 'png' && batchProgress
                        ? `Rendering PNG ZIP (${batchProgress.done}/${batchProgress.total})…`
                        : 'All 30 PNG Files (.ZIP)'}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-neutral-900">30× 300 DPI</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleBatchZipExport('jpg')}
                  className="w-full py-2 px-3 rounded-lg bg-[#161b24] hover:bg-[#1f2633] border border-neutral-700/80 text-xs font-medium text-slate-100 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {batchZipFormat === 'jpg' && batchProgress
                        ? `Rendering JPG ZIP (${batchProgress.done}/${batchProgress.total})…`
                        : 'All 30 JPG Files (.ZIP)'}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">30× 300 DPI</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
