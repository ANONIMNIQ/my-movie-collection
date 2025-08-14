import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const ChipIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 5h-3V2h-2v3h-4V2H8v3H5c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zm-4 14h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V9h6v2z"></path>
  </svg>
);