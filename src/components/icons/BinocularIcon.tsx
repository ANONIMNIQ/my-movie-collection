import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const BinocularIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14 11.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z"></path><path d="M12 4C8.14 4 5 7.14 5 11v8l-2 2v1h18v-1l-2-2v-8c0-3.86-3.14-7-7-7zm5 15H7v-1.586l1.707-1.707A3.983 3.983 0 0 0 10 14.414V11a2 2 0 1 1 4 0v3.414a3.983 3.983 0 0 0 1.293 2.293L17 17.414V19z"></path>
  </svg>
);