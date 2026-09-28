import { ArtboardSlide, ArtboardTemplateConfig, DesignSetId } from '../types/artboard';

export const TOTAL_ARTBOARDS = 30;

interface SlidePreset {
  designSetId: DesignSetId;
  categoryTitle: string;
  itemCount: number;
  footerLabelLine1: string;
  footerLabelLine2: string;
  designPrimaryColor: string;
  designSecondaryColor: string;
  designTertiaryColor: string;
  ribbonText: string;
}

export const SLIDE_PRESETS: SlidePreset[] = Array.from({ length: TOTAL_ARTBOARDS }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    designSetId: 'glass-cyan-pink-ui-16',
    categoryTitle: `ARTBOARD ${num}`,
    itemCount: 25,
    footerLabelLine1: 'VECTOR',
    footerLabelLine2: 'ICONS',
    designPrimaryColor: '#38BDF8',
    designSecondaryColor: '#EC4899',
    designTertiaryColor: '#A855F7',
    ribbonText: 'EDITABLE STROKE',
  };
});

export function createDefaultConfigForSlide(index: number): ArtboardTemplateConfig {
  const preset = SLIDE_PRESETS[index % SLIDE_PRESETS.length];
  return {
    panelWidth: 3255,
    baseDarkColor: '#222222',
    accentYellowOrangeColor: '#F79421',
    badgeContentColor: '#222222',

    showRibbonBadge: true,
    showRibbonIcon: true,
    ribbonText: preset.ribbonText,
    ribbonTop: 300,
    ribbonHeight: 600,
    ribbonWidth: 2970,
    ribbonNotchDepth: 190,

    showLeftShowcaseIcon: true,
    categoryTitle: preset.categoryTitle,

    showFooterBlock: true,
    footerHeight: 1267,
    itemCount: preset.itemCount,
    footerLabelLine1: preset.footerLabelLine1,
    footerLabelLine2: preset.footerLabelLine2,

    designSetId: preset.designSetId,
    designPrimaryColor: preset.designPrimaryColor,
    designSecondaryColor: preset.designSecondaryColor,
    designTertiaryColor: preset.designTertiaryColor,
    iconScale: 1,
  };
}

export function createInitialArtboards(): ArtboardSlide[] {
  return Array.from({ length: TOTAL_ARTBOARDS }, (_, idx) => {
    const config = createDefaultConfigForSlide(idx);
    return {
      id: idx + 1,
      name: `Artboard ${idx + 1} — ${config.categoryTitle}`,
      config,
    };
  });
}
