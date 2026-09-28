import { ArtboardSlide } from '../types/artboard';

/**
 * Pure SVG 1.1 <defs> — empty since all icon designs have been removed from the 30 artboards.
 */
export function renderDesignSetDefsSvg(_slide: ArtboardSlide, _prefix: string = 'ab'): string {
  return '';
}

/**
 * Left panel showcase icon removed as requested — returns empty string so only the clean template remains.
 */
export function renderLeftPanelShowcaseSvg(
  _slide: ArtboardSlide,
  _showcaseCenterX?: number,
  _showcaseCenterY?: number
): string {
  return '';
}

/**
 * Right canvas icon designs removed as requested — returns empty string so all 30 artboards have clean transparent right areas.
 */
export function renderRightAreaDesignsSvg(_slide: ArtboardSlide, _prefix: string = 'ab'): string {
  return '';
}
