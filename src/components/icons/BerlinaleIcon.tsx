import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const BerlinaleIcon: React.FC<IconProps> = (props) => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V22h8v-7.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 1.76-.89 3.3-2.34 4.26L14 14.5V20h-4v-5.5l-.66-.24C7.89 12.3 7 10.76 7 9c0-2.76 2.24-5 5-5z"/>
  </svg>
);