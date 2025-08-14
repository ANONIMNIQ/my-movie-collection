import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const GhostIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.486 2 2 6.486 2 12v5a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-5C22 6.486 17.514 2 12 2zm-3 12c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2zm6 0c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"></path>
  </svg>
);