import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const RottenTomatoesIcon: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.13 2.01C5.23 2.53 1.03 9.13 2.78 15.65c1.22 4.56 5.14 7.61 9.7 7.35 6.33-.35 10.3-6.33 9.49-12.46-1.1-8.7-10.1-9.23-9.84-10.53zM10.5 8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm3 5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" />
  </svg>
);