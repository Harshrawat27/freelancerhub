import * as React from 'react';

interface VisuallyHiddenInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  control?: HTMLElement | null;
}

export const VisuallyHiddenInput = React.forwardRef<
  HTMLInputElement,
  VisuallyHiddenInputProps
>(({ control, ...props }, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      tabIndex={-1}
      aria-hidden='true'
    />
  );
});

VisuallyHiddenInput.displayName = 'VisuallyHiddenInput';
