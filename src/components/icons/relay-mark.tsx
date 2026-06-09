import * as React from "react";

/**
 * Relay brand mark — a fan-out "relay / forward" webhook glyph:
 * a hub node feeding two downstream nodes.
 * Ported from the Emerald Console reference (`Icons.jsx` Mark).
 */
export function RelayMark({
  size = 17,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 7.5 L9 13 a4 4 0 0 0 4 4 h3" />
      <path d="M9 13 h3 a4 4 0 0 1 4 4 v0" />
      <circle cx="9" cy="6" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="17" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default RelayMark;
