import React, { forwardRef, ReactNode } from "react";

import { InputNumbers, InputNumbersProps } from "../input-numbers";

interface VectorInputProps extends Omit<
  InputNumbersProps,
  "value" | "onValuesChange" | "onChange"
> {
  value: number[];
  onValuesChange?: (value: number[]) => void;
  labels?: ReactNode[];
  step?: number | number[];
  disabledItems?: boolean[];
  onSuffixBatchAction?: (indices: number[]) => void;
  gridAutoFlow?: "column" | "row";
  columns?: number;
  rows?: number;
  // Legacy props (deprecated)
  layout?: "column" | "row";
  columnMajor?: boolean;
}

const VectorInput = forwardRef<HTMLDivElement, VectorInputProps>(
  function VectorInput(
    {
      labels,
      prefix,
      gridAutoFlow,
      columns,
      rows,
      layout,
      columnMajor,
      ...props
    },
    ref,
  ) {
    return (
      <InputNumbers
        ref={ref}
        prefix={labels || prefix}
        gridAutoFlow={gridAutoFlow || layout}
        columns={columns}
        rows={rows}
        columnMajor={columnMajor}
        {...props}
      />
    );
  },
);

export { VectorInput };
export type { VectorInputProps };
