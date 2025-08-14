import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const FilmRollIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.82 3H4.18C3.04 3 2.18 3.93 2.18 5.06v13.88C2.18 20.07 3.04 21 4.18 21h15.64c1.14 0 2-0.93 2-2.06V5.06C21.82 3.93 20.96 3 19.82 3zM6 5h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm12 2h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V5h2v2z"></path>
  </svg>
);