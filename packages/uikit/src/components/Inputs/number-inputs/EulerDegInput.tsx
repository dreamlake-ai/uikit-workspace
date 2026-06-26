import { forwardRef } from "react";

import { EulerInput, EulerInputProps } from "./EulerInput";

type EulerDegInputProps = Omit<EulerInputProps, "unit">;

const EulerDegInput = forwardRef<HTMLDivElement, EulerDegInputProps>(
  function EulerDegInput(props, ref) {
    return <EulerInput ref={ref} unit="deg" {...props} />;
  },
);

export { EulerDegInput };
export type { EulerDegInputProps };
