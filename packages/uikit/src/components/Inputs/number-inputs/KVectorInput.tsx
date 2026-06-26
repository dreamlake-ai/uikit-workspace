import { forwardRef } from "react";

import { VectorInput, VectorInputProps } from "./VectorInput";

interface KVectorInputProps extends Omit<VectorInputProps, "labels"> {
  dimensions?: number;
}

const KVectorInput = forwardRef<HTMLDivElement, KVectorInputProps>(
  function KVectorInput({ value, dimensions, ...props }, ref) {
    const k = dimensions || value.length;
    const labels = Array.from({ length: k }, (_, i) => `${i}`);

    return <VectorInput ref={ref} value={value} labels={labels} {...props} />;
  },
);

export { KVectorInput };
export type { KVectorInputProps };
