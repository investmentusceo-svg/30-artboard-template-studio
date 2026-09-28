import {
  ARTBOARD_HEIGHT,
  ARTBOARD_WIDTH,
  ArtboardSlide,
  ArtboardTemplateConfig,
  EXPORT_DPI,
} from '../types/artboard';
import {
  renderDesignSetDefsSvg,
  renderLeftPanelShowcaseSvg,
  renderRightAreaDesignsSvg,
} from './designSetsSvg';

export interface BezierIconGeometry {
  centerX: number;
  centerY: number;
  topNodeY: number;
  bottomNodeY: number;
  leftNodeX: number;
  rightNodeX: number;
  handleLeftX: number;
  handleRightX: number;
  handleRadius: number;
  squareSize: number;
  strokeWidth: number;
  archPathSvg: string;
}

export interface ComputedTemplateGeometry {
  width: number;
  height: number;
  panelWidth: number;
  ribbonPolygonPoints: Array<[number, number]>;
  icon: BezierIconGeometry;
  dividerX: number;
  dividerTopY: number;
  dividerBottomY: number;
  dividerStrokeWidth: number;
  textX: number;
  textCenterY: number;
  fontSize: number;
  showcaseCenterX: number;
  showcaseCenterY: number;
  titleRuleY: number;
  titleTextY: number;
  footerRect: { x: number; y: number; width: number; height: number };
}

export function computeTemplateGeometry(config: ArtboardTemplateConfig): ComputedTemplateGeometry {
  const W = ARTBOARD_WIDTH;
  const H = ARTBOARD_HEIGHT;
  const pw = Math.max(1800, Math.min(5500, Math.round(config.panelWidth)));
  const rTop = Math.max(80, Math.min(1500, Math.round(config.ribbonTop)));
  const rHeight = Math.max(320, Math.min(1200, Math.round(config.ribbonHeight)));
  const rWidth = Math.max(1200, Math.min(pw - 60, Math.round(config.ribbonWidth)));
  const notch = Math.max(60, Math.min(450, Math.round(config.ribbonNotchDepth)));
  const fHeight = Math.max(400, Math.min(2400, Math.round(config.footerHeight)));

  const rMidY = Math.round(rTop + rHeight / 2);
  const rBottom = rTop + rHeight;

  const ribbonPolygonPoints: Array<[number, number]> = [
    [0, rTop],
    [rWidth, rTop],
    [rWidth - notch, rMidY],
    [rWidth, rBottom],
    [0, rBottom],
  ];

  const scale = rHeight / 600;
  const iconCenterX = Math.round(325 * scale);
  const iconCenterY = rMidY;

  const topNodeY = Math.round(iconCenterY - 72 * scale);
  const bottomNodeY = Math.round(iconCenterY + 86 * scale);
  const leftNodeX = Math.round(iconCenterX - 126 * scale);
  const rightNodeX = Math.round(iconCenterX + 126 * scale);
  const handleLeftX = Math.round(iconCenterX - 154 * scale);
  const handleRightX = Math.round(iconCenterX + 154 * scale);
  const handleRadius = Math.max(6, Math.round(16 * scale));
  const squareSize = Math.max(16, Math.round(46 * scale));
  const strokeWidth = Math.max(6, Math.round(15 * scale));

  const archPathSvg = [
    `M ${leftNodeX} ${bottomNodeY}`,
    `C ${leftNodeX} ${topNodeY}, ${Math.round(iconCenterX - 70 * scale)} ${topNodeY}, ${iconCenterX} ${topNodeY}`,
    `C ${Math.round(iconCenterX + 70 * scale)} ${topNodeY}, ${rightNodeX} ${topNodeY}, ${rightNodeX} ${bottomNodeY}`,
  ].join(' ');

  const dividerX = config.showRibbonIcon ? Math.round(585 * scale) : Math.round(140 * scale);
  const dividerTopY = Math.round(rMidY - 175 * scale);
  const dividerBottomY = Math.round(rMidY + 175 * scale);
  const dividerStrokeWidth = Math.max(6, Math.round(14 * scale));

  const textX = config.showRibbonIcon ? Math.round(670 * scale) : Math.round(200 * scale);
  const fontSize = Math.max(60, Math.round(176 * scale));

  const footerTop = H - fHeight;
  const availableMidHeight = footerTop - rBottom;
  const showcaseCenterX = Math.round(pw / 2);
  const showcaseCenterY = Math.round(rBottom + availableMidHeight * 0.42);
  const titleRuleY = Math.round(rBottom + availableMidHeight * 0.74);
  const titleTextY = Math.round(rBottom + availableMidHeight * 0.86);

  return {
    width: W,
    height: H,
    panelWidth: pw,
    ribbonPolygonPoints,
    icon: {
      centerX: iconCenterX,
      centerY: iconCenterY,
      topNodeY,
      bottomNodeY,
      leftNodeX,
      rightNodeX,
      handleLeftX,
      handleRightX,
      handleRadius,
      squareSize,
      strokeWidth,
      archPathSvg,
    },
    dividerX,
    dividerTopY,
    dividerBottomY,
    dividerStrokeWidth,
    textX,
    textCenterY: rMidY,
    fontSize,
    showcaseCenterX,
    showcaseCenterY,
    titleRuleY,
    titleTextY,
    footerRect: {
      x: 0,
      y: footerTop,
      width: pw,
      height: fHeight,
    },
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pointsToSvgString(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * Generates the inner SVG markup shared by both the live React SVG preview
 * and the standalone SVG / PNG / JPG exporters.
 */
export function generateArtboardInnerSvgMarkup(slide: ArtboardSlide): string {
  const { config } = slide;
  const geom = computeTemplateGeometry(config);
  const pw = geom.panelWidth;
  const H = geom.height;
  const ic = geom.icon;
  const halfSq = Math.round(ic.squareSize / 2);

  const parts: string[] = [];
  parts.push(renderDesignSetDefsSvg(slide));

  // 1. Left Vertical Dark Panel
  parts.push(
    `  <g id="ab${slide.id}-left-panel">`,
    `    <rect x="0" y="0" width="${pw}" height="${H}" fill="${config.baseDarkColor}" />`
  );

  // Top Yellow-Orange Swallowtail Ribbon + Bezier Icon + "EDITABLE STROKE"
  if (config.showRibbonBadge) {
    parts.push(
      `    <polygon points="${pointsToSvgString(geom.ribbonPolygonPoints)}" fill="${config.accentYellowOrangeColor}" />`
    );

    if (config.showRibbonIcon) {
      parts.push(
        `    <g>`,
        `      <line x1="${ic.handleLeftX}" y1="${ic.topNodeY}" x2="${ic.handleRightX}" y2="${ic.topNodeY}" stroke="${config.badgeContentColor}" stroke-width="${ic.strokeWidth}" stroke-linecap="round" />`,
        `      <path d="${ic.archPathSvg}" fill="none" stroke="${config.badgeContentColor}" stroke-width="${ic.strokeWidth}" stroke-linecap="round" />`,
        `      <circle cx="${ic.handleLeftX}" cy="${ic.topNodeY}" r="${ic.handleRadius}" fill="${config.badgeContentColor}" />`,
        `      <circle cx="${ic.handleRightX}" cy="${ic.topNodeY}" r="${ic.handleRadius}" fill="${config.badgeContentColor}" />`,
        `      <rect x="${ic.centerX - halfSq}" y="${ic.topNodeY - halfSq}" width="${ic.squareSize}" height="${ic.squareSize}" fill="${config.accentYellowOrangeColor}" stroke="${config.badgeContentColor}" stroke-width="${ic.strokeWidth}" stroke-linejoin="round" />`,
        `      <rect x="${ic.leftNodeX - halfSq}" y="${ic.bottomNodeY - halfSq}" width="${ic.squareSize}" height="${ic.squareSize}" fill="${config.accentYellowOrangeColor}" stroke="${config.badgeContentColor}" stroke-width="${ic.strokeWidth}" stroke-linejoin="round" />`,
        `      <rect x="${ic.rightNodeX - halfSq}" y="${ic.bottomNodeY - halfSq}" width="${ic.squareSize}" height="${ic.squareSize}" fill="${config.accentYellowOrangeColor}" stroke="${config.badgeContentColor}" stroke-width="${ic.strokeWidth}" stroke-linejoin="round" />`,
        `    </g>`,
        `    <line x1="${geom.dividerX}" y1="${geom.dividerTopY}" x2="${geom.dividerX}" y2="${geom.dividerBottomY}" stroke="${config.badgeContentColor}" stroke-width="${geom.dividerStrokeWidth}" stroke-linecap="round" />`
      );
    }

    if (config.ribbonText.trim().length > 0) {
      parts.push(
        `    <text x="${geom.textX}" y="${geom.textCenterY}" fill="${config.badgeContentColor}" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="${geom.fontSize}" font-weight="600" letter-spacing="8" dominant-baseline="central">${escapeXml(config.ribbonText)}</text>`
      );
    }
  }

  // Middle Left Panel: Representative Showcase Icon + Orange Horizontal Rule + English Category Title
  if (config.showLeftShowcaseIcon) {
    parts.push(
      `    <!-- Featured Representative Design Icon & English Category Title -->`,
      renderLeftPanelShowcaseSvg(slide, geom.showcaseCenterX, geom.showcaseCenterY),
      `    <line x1="${Math.round(pw * 0.1)}" y1="${geom.titleRuleY}" x2="${Math.round(pw * 0.9)}" y2="${geom.titleRuleY}" stroke="${config.accentYellowOrangeColor}" stroke-width="26" stroke-linecap="round" />`
    );

    if (config.categoryTitle.trim().length > 0) {
      const titleUpper = config.categoryTitle.trim().toUpperCase();
      const maxTitleWidth = pw * 0.8;
      const titleFontSize = Math.max(
        150,
        Math.min(275, Math.floor(maxTitleWidth / (Math.max(1, titleUpper.length) * 0.72)))
      );
      const titleLetterSpacing = titleUpper.length > 14 ? 6 : titleUpper.length > 11 ? 10 : 14;
      parts.push(
        `    <text x="${geom.showcaseCenterX}" y="${geom.titleTextY}" fill="#FFFFFF" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="${titleFontSize}" font-weight="700" letter-spacing="${titleLetterSpacing}" text-anchor="middle" dominant-baseline="central">${escapeXml(titleUpper)}</text>`
      );
    }
  }

  // Bottom Yellow-Orange Footer Shape + Total Icon Count (e.g. "12 | BUTTON ICONS")
  if (config.showFooterBlock) {
    const fy = geom.footerRect.y;
    const fh = geom.footerRect.height;
    const fMidY = Math.round(fy + fh / 2);
    const fDividerX = Math.round(pw * 0.44);
    const countTextX = Math.round(fDividerX * 0.52);
    const labelTextX = fDividerX + 120;
    const line1Upper = config.footerLabelLine1.trim().toUpperCase();
    const line2Upper = config.footerLabelLine2.trim().toUpperCase();
    const maxLabelChars = Math.max(line1Upper.length, line2Upper.length, 1);
    const maxFooterLabelWidth = pw - labelTextX - 160;
    const footerFontSize = Math.max(
      140,
      Math.min(228, Math.floor(maxFooterLabelWidth / (maxLabelChars * 0.72)))
    );
    const footerLetterSpacing = maxLabelChars >= 9 ? 5 : maxLabelChars >= 7 ? 7 : 9;

    parts.push(
      `    <rect x="${geom.footerRect.x}" y="${fy}" width="${geom.footerRect.width}" height="${fh}" fill="${config.accentYellowOrangeColor}" />`,
      `    <text x="${countTextX}" y="${fMidY + 20}" fill="${config.badgeContentColor}" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="660" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(String(config.itemCount))}</text>`,
      `    <line x1="${fDividerX}" y1="${fy + Math.round(fh * 0.16)}" x2="${fDividerX}" y2="${fy + Math.round(fh * 0.84)}" stroke="${config.badgeContentColor}" stroke-width="24" stroke-linecap="round" />`,
      `    <text x="${labelTextX}" y="${fMidY - 140}" fill="${config.badgeContentColor}" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="${footerFontSize}" font-weight="500" letter-spacing="${footerLetterSpacing}" dominant-baseline="central">${escapeXml(line1Upper)}</text>`,
      `    <text x="${labelTextX}" y="${fMidY + 165}" fill="${config.badgeContentColor}" font-family="'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif" font-size="${footerFontSize}" font-weight="500" letter-spacing="${footerLetterSpacing}" dominant-baseline="central">${escapeXml(line2Upper)}</text>`
    );
  }

  parts.push(`  </g>`);

  // 2. Right Transparent Area Designs (Line-by-Line Grid over 100% Alpha=0 Transparent Background)
  parts.push(renderRightAreaDesignsSvg(slide));

  return parts.join('\n');
}

/**
 * Generates a pure, standalone vector SVG string of the artboard (15799 x 6599 px).
 * The right side has NO background rect, preserving genuine alpha transparency.
 */
export function generateArtboardSvgString(slide: ArtboardSlide): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ARTBOARD_WIDTH}" height="${ARTBOARD_HEIGHT}" viewBox="0 0 ${ARTBOARD_WIDTH} ${ARTBOARD_HEIGHT}" fill="none">`,
    generateArtboardInnerSvgMarkup(slide),
    `</svg>`,
  ].join('\n');
}

function loadSvgIntoImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Renders the exact 15799 x 6599 px artboard onto an HTML5 Canvas.
 * - For PNG: `fillTransparentWithWhite = false` preserves true RGBA alpha=0 transparency on the right side.
 * - For JPEG: `fillTransparentWithWhite = true` renders the transparent right area as pure white (#FFFFFF).
 */
export async function renderArtboardToCanvas(
  slide: ArtboardSlide,
  fillTransparentWithWhite: boolean
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = ARTBOARD_WIDTH;
  canvas.height = ARTBOARD_HEIGHT;

  const ctx = canvas.getContext('2d', { alpha: !fillTransparentWithWhite });
  if (!ctx) {
    throw new Error('Could not initialize 15799 × 6599 px 2D canvas context.');
  }

  if (fillTransparentWithWhite) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  } else {
    ctx.clearRect(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  }

  const svgString = generateArtboardSvgString(slide);
  const img = await loadSvgIntoImage(svgString);
  ctx.drawImage(img, 0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);

  return canvas;
}

// CRC32 lookup table for PNG chunk generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Injects a 300 DPI `pHYs` chunk (11811 pixels per meter) into a PNG ArrayBuffer
 * right after the IHDR chunk so the exported PNG carries genuine 300 DPI resolution metadata.
 */
function injectPng300DpiMetadata(pngBuffer: ArrayBuffer, dpi: number = EXPORT_DPI): Blob {
  const src = new Uint8Array(pngBuffer);
  if (
    src.length < 33 ||
    src[0] !== 0x89 ||
    src[1] !== 0x50 ||
    src[2] !== 0x4e ||
    src[3] !== 0x47
  ) {
    return new Blob([pngBuffer], { type: 'image/png' });
  }

  const ppm = Math.round(dpi / 0.0254); // 300 DPI = 11811 pixels/meter
  const physChunk = new Uint8Array(21);
  const view = new DataView(physChunk.buffer);

  view.setUint32(0, 9, false);
  physChunk[4] = 0x70; // p
  physChunk[5] = 0x48; // H
  physChunk[6] = 0x59; // Y
  physChunk[7] = 0x73; // s
  view.setUint32(8, ppm, false);
  view.setUint32(12, ppm, false);
  physChunk[16] = 1; // meter
  const crc = crc32(physChunk.subarray(4, 17));
  view.setUint32(17, crc, false);

  const ihdrLength = new DataView(src.buffer, src.byteOffset, src.byteLength).getUint32(8, false);
  const insertPos = 8 + 4 + 4 + ihdrLength + 4;

  const out = new Uint8Array(src.length + physChunk.length);
  out.set(src.subarray(0, insertPos), 0);
  out.set(physChunk, insertPos);
  out.set(src.subarray(insertPos), insertPos + physChunk.length);

  return new Blob([out], { type: 'image/png' });
}

/**
 * Updates JFIF APP0 header density fields to 300 DPI on a JPEG ArrayBuffer.
 */
function injectJpeg300DpiMetadata(jpegBuffer: ArrayBuffer, dpi: number = EXPORT_DPI): Blob {
  const bytes = new Uint8Array(jpegBuffer);
  if (
    bytes.length > 20 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === 0x4a &&
    bytes[7] === 0x46 &&
    bytes[8] === 0x49 &&
    bytes[9] === 0x46 &&
    bytes[10] === 0x00
  ) {
    bytes[13] = 1; // dots per inch
    bytes[14] = (dpi >> 8) & 0xff;
    bytes[15] = dpi & 0xff;
    bytes[16] = (dpi >> 8) & 0xff;
    bytes[17] = dpi & 0xff;
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export async function exportArtboardAsSvg(slide: ArtboardSlide): Promise<void> {
  const svgString = generateArtboardSvgString(slide);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const paddedId = String(slide.id).padStart(2, '0');
  triggerBlobDownload(blob, `artboard-${paddedId}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}.svg`);
}

export async function generateArtboardPngBytes(slide: ArtboardSlide): Promise<Uint8Array> {
  const canvas = await renderArtboardToCanvas(slide, false);
  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed for 15799 × 6599 px canvas.'));
    }, 'image/png');
  });

  canvas.width = 1;
  canvas.height = 1;

  const buffer = await rawBlob.arrayBuffer();
  const dpiBlob = injectPng300DpiMetadata(buffer, EXPORT_DPI);
  return new Uint8Array(await dpiBlob.arrayBuffer());
}

export async function generateArtboardJpgBytes(slide: ArtboardSlide): Promise<Uint8Array> {
  const canvas = await renderArtboardToCanvas(slide, true);
  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('JPEG encoding failed for 15799 × 6599 px canvas.'));
      },
      'image/jpeg',
      1.0
    );
  });

  canvas.width = 1;
  canvas.height = 1;

  const buffer = await rawBlob.arrayBuffer();
  const dpiBlob = injectJpeg300DpiMetadata(buffer, EXPORT_DPI);
  return new Uint8Array(await dpiBlob.arrayBuffer());
}

export async function exportArtboardAsPng(slide: ArtboardSlide): Promise<void> {
  const bytes = await generateArtboardPngBytes(slide);
  const blob = new Blob([bytes], { type: 'image/png' });
  const paddedId = String(slide.id).padStart(2, '0');
  triggerBlobDownload(
    blob,
    `artboard-${paddedId}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.png`
  );
}

export async function exportArtboardAsJpg(slide: ArtboardSlide): Promise<void> {
  const bytes = await generateArtboardJpgBytes(slide);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const paddedId = String(slide.id).padStart(2, '0');
  triggerBlobDownload(
    blob,
    `artboard-${paddedId}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.jpg`
  );
}

interface ZipEntryInput {
  filename: string;
  data: Uint8Array;
}

/**
 * Builds a standard PKZIP archive Blob from a list of files using Store (0) mode.
 */
function createZipArchiveBlob(entries: ZipEntryInput[]): Blob {
  const encoder = new TextEncoder();
  const blobParts: BlobPart[] = [];
  const centralDirParts: Uint8Array[] = [];

  let offset = 0;
  let centralDirSize = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.filename);
    const data = entry.data;
    const crc = crc32(data);
    const size = data.byteLength;

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Compression method: 0 (Store)
    lv.setUint16(10, 0x4000, true); // Mod time
    lv.setUint16(12, 0x54bd, true); // Mod date
    lv.setUint32(14, crc, true); // CRC-32
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // Filename length
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    // Central directory file header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed to extract
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Compression method: 0 (Store)
    cv.setUint16(12, 0x4000, true); // Mod time
    cv.setUint16(14, 0x54bd, true); // Mod date
    cv.setUint32(16, crc, true); // CRC-32
    cv.setUint32(20, size, true); // Compressed size
    cv.setUint32(24, size, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // Filename length
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    blobParts.push(localHeader, data);
    centralDirParts.push(centralHeader);

    offset += localHeader.byteLength + size;
    centralDirSize += centralHeader.byteLength;
  }

  for (const cd of centralDirParts) {
    blobParts.push(cd);
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // Disk number
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, entries.length, true); // Central directory records on this disk
  ev.setUint16(10, entries.length, true); // Total central directory records
  ev.setUint32(12, centralDirSize, true); // Size of central directory
  ev.setUint32(16, offset, true); // Offset of start of central directory
  ev.setUint16(20, 0, true); // Comment length

  blobParts.push(eocd);
  return new Blob(blobParts, { type: 'application/zip' });
}

export async function exportAllArtboardsAsSvgZip(
  slides: ArtboardSlide[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const encoder = new TextEncoder();
  const entries: ZipEntryInput[] = [];
  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    const paddedId = String(slide.id).padStart(2, '0');
    const slug = slide.config.categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const svgString = generateArtboardSvgString(slide);
    entries.push({
      filename: `artboard-${paddedId}-${slug}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}.svg`,
      data: encoder.encode(svgString),
    });
    onProgress?.(i + 1, total);
    await new Promise((r) => setTimeout(r, 15));
  }

  const zipBlob = createZipArchiveBlob(entries);
  triggerBlobDownload(zipBlob, `all-${total}-artboards-svg-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}.zip`);
}

export async function exportAllArtboardsAsPngZip(
  slides: ArtboardSlide[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const entries: ZipEntryInput[] = [];
  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, total);
    await new Promise((r) => setTimeout(r, 40));
    const paddedId = String(slide.id).padStart(2, '0');
    const slug = slide.config.categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pngBytes = await generateArtboardPngBytes(slide);
    entries.push({
      filename: `artboard-${paddedId}-${slug}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.png`,
      data: pngBytes,
    });
  }

  const zipBlob = createZipArchiveBlob(entries);
  triggerBlobDownload(
    zipBlob,
    `all-${total}-artboards-png-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.zip`
  );
}

export async function exportAllArtboardsAsJpgZip(
  slides: ArtboardSlide[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const entries: ZipEntryInput[] = [];
  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, total);
    await new Promise((r) => setTimeout(r, 40));
    const paddedId = String(slide.id).padStart(2, '0');
    const slug = slide.config.categoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const jpgBytes = await generateArtboardJpgBytes(slide);
    entries.push({
      filename: `artboard-${paddedId}-${slug}-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.jpg`,
      data: jpgBytes,
    });
  }

  const zipBlob = createZipArchiveBlob(entries);
  triggerBlobDownload(
    zipBlob,
    `all-${total}-artboards-jpg-${ARTBOARD_WIDTH}x${ARTBOARD_HEIGHT}-${EXPORT_DPI}dpi.zip`
  );
}
