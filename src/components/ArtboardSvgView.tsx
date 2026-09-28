import React, { useMemo } from 'react';
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH, ArtboardSlide } from '../types/artboard';
import { generateArtboardInnerSvgMarkup } from '../utils/exportEngine';

interface ArtboardSvgViewProps {
  slide: ArtboardSlide;
  className?: string;
}

export const ArtboardSvgView: React.FC<ArtboardSvgViewProps> = ({ slide, className = '' }) => {
  const innerSvg = useMemo(() => generateArtboardInnerSvgMarkup(slide), [slide]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${ARTBOARD_WIDTH} ${ARTBOARD_HEIGHT}`}
      className={`block select-none ${className}`}
      fill="none"
      dangerouslySetInnerHTML={{ __html: innerSvg }}
    />
  );
};
