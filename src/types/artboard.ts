export const ARTBOARD_WIDTH = 15799;
export const ARTBOARD_HEIGHT = 6599;
export const EXPORT_DPI = 300;

export type ExportFormat = 'svg' | 'png' | 'jpg';

export type ViewportBackdrop = 'checkerboard' | 'dark-grid' | 'jpg-white';

export type DesignSetId =
  | 'glass-cyan-pink-ui-16'
  | 'dark-smoked-cyan-ui-16'
  | 'frosted-white-glass-ui-12'
  | 'frosted-os-window-ui-12'
  | 'sapphire-neon-glass-ui-12'
  | 'scifi-blue-hud-frames-9'
  | 'scifi-cyan-radar-hud-10'
  | 'scifi-cobalt-hud-frames-10'
  | 'scifi-azure-minimal-hud-10'
  | 'scifi-circuit-hud-frames-9';

export interface ArtboardTemplateConfig {
  // Left dark panel geometry & color
  panelWidth: number;
  baseDarkColor: string;

  // Top & Bottom yellow-orange accent color (#F79421)
  accentYellowOrangeColor: string;
  badgeContentColor: string;

  // Top ribbon banner ("EDITABLE STROKE")
  showRibbonBadge: boolean;
  showRibbonIcon: boolean;
  ribbonText: string;
  ribbonTop: number;
  ribbonHeight: number;
  ribbonWidth: number;
  ribbonNotchDepth: number;

  // Middle left panel showcase icon + English category title
  showLeftShowcaseIcon: boolean;
  categoryTitle: string;

  // Bottom yellow-orange footer block
  showFooterBlock: boolean;
  footerHeight: number;
  itemCount: number;
  footerLabelLine1: string;
  footerLabelLine2: string;

  // Right transparent area vector design collection settings
  designSetId: DesignSetId;
  designPrimaryColor: string;
  designSecondaryColor: string;
  designTertiaryColor: string;
  iconScale: number;
}

export interface ArtboardSlide {
  id: number;
  name: string;
  config: ArtboardTemplateConfig;
}
