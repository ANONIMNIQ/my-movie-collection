import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const FilmRollIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 2H5c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM5 4h2v2H5V4zm0 4h2v2H5V8zm0 4h2v2H5v-2zm0 4h2v2H5v-2zm14 2h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V4h2v2z"></path><path d="M9 6h6v12H9z"></path>
  </svg>
);