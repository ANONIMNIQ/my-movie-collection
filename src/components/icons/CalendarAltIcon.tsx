import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const CalendarAltIcon: React.FC<IconProps> = (props) => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="m19,4h-2v-2h-2v2h-6v-2h-2v2h-2c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V6c0-1.1-.9-2-2-2ZM5,20v-12h14v12H5Z"></path>
    <path d="M7 11H9V13H7z"></path>
    <path d="M11 11H13V13H11z"></path>
    <path d="M15 11H17V13H15z"></path>
    <path d="M7 15H9V17H7z"></path>
    <path d="M11 15H13V17H11z"></path>
    <path d="M15 15H17V17H15z"></path>
  </svg>
);