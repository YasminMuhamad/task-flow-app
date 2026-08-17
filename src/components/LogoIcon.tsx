import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export default function LogoIcon() {
  return (
    <Svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <Path
        d="M8 17 L14 23 L26 11"
        stroke="#F8F9FA"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="17"
        cy="17"
        r="14"
        stroke="#C5D5E4"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
    </Svg>
  );
}