import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const HeartBreakIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.84 4.22a2.998 2.998 0 0 0-4.24 0l-1.1 1.1-2.35-2.35-1.41 1.41 2.35 2.35-1.29 1.29-4.24-4.24-1.41 1.41 4.24 4.24-2.12 2.12-5.66-5.66-1.41 1.41 5.66 5.66L12 19.59l8.84-8.84a3 3 0 0 0 0-4.24l-1.41-1.41-1.18 1.18-1.41-1.41 1.18-1.18.52-.52z"></path>
  </svg>
);