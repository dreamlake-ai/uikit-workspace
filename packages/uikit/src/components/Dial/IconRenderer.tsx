import * as LucideIcons from "lucide-react";
import React from "react";

interface IconRendererProps {
  iconName?: string;
  size?: number;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  size = 16,
  className = "",
}) => {
  if (!iconName) {
    return null;
  }

  const pascalCaseName = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const IconComponent = (LucideIcons as any)[pascalCaseName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in Lucide React`);
    return null;
  }

  return <IconComponent size={size} className={className} />;
};
