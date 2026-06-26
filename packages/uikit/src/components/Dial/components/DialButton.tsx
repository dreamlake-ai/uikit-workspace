import React from "react";

import { Button } from "../../Button";
import { IconRenderer } from "../IconRenderer";

export interface DialButtonProps {
  name: string;
  label?: string;
  icon?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "link";
  disabled?: boolean;
}

/**
 * Button component for dial panels
 *
 * Used to trigger actions from within the dial UI.
 * Unlike input components, buttons don't store values in the dial state.
 *
 * @example
 * ```tsx
 * const handleReset = useCallback(() => {
 *   // reset logic
 * }, []);
 *
 * { name: 'reset', dtype: 'button', label: 'Reset', onClick: handleReset }
 * ```
 */
export const DialButton: React.FC<DialButtonProps> = ({
  name,
  label,
  icon,
  onClick,
  variant = "secondary",
  disabled = false,
}) => {
  const displayLabel = label || name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-center gap-2"
    >
      <IconRenderer iconName={icon} size={14} />
      {displayLabel}
    </Button>
  );
};
