import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { DialValue, DialSchema } from "./types";

// Utility to check if an object is empty or nullish
function isEmptyObject(obj: unknown): boolean {
  return (
    obj == null || (typeof obj === "object" && Object.keys(obj).length === 0)
  );
}

/**
 * Context value for dial schema provider
 */
export interface DialContextValue {
  values: Record<string, unknown>;
  schemas: DialSchema[];
  // Returns the (number-formatted) stored value. Typed loosely because dial
  // controls read it as scalars, arrays, and records interchangeably.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue: (name: string) => any;
  setValue: (name: string, value: DialValue) => void;
  onValueChange?: (name: string, value: DialValue) => void;
}

// Create the context
const DialSchemaContext = createContext<DialContextValue | undefined>(
  undefined,
);

// Hook to use the dial context
export const useDialSchema = () => {
  const context = useContext(DialSchemaContext);
  if (!context) {
    throw new Error("useDialSchema must be used within a DialSchemaProvider");
  }
  return context;
};

/**
 * Props for DialProvider component
 */
export interface DialProviderProps {
  children: React.ReactNode;
  schemas: DialSchema[];
  initialValues?: Record<string, unknown>;
  values?: Record<string, unknown>; // For controlled mode
  onValueChange?: (name: string, value: unknown) => void;
}

// Provider component
export const DialProvider = ({
  children,
  schemas,
  initialValues = {},
  values: controlledValues,
  onValueChange,
}: DialProviderProps) => {
  // Determine if component is controlled
  const isControlled = !isEmptyObject(controlledValues);

  // Initialize state with default values from schemas or provided initial values
  const [internalValues, setInternalValues] = useState<Record<string, unknown>>(
    () =>
      Object.fromEntries(
        schemas.map((schema) => [
          schema.name,
          initialValues[schema.name] ?? schema.value,
        ]),
      ),
  );

  // Helper function to merge controlled values with schema defaults
  const mergeWithSchemaDefaults = useCallback(
    (inputValues: Record<string, unknown>) => {
      const result = { ...inputValues };

      schemas.forEach((schema) => {
        // If the input doesn't have this property or it's undefined/null, use schema default
        if (result[schema.name] === undefined || result[schema.name] === null) {
          if (schema.value !== undefined) {
            result[schema.name] = schema.value;
          }
        }
      });

      return result;
    },
    [schemas],
  );

  // Use controlled values if provided, otherwise use internal state
  // Always merge with schema defaults to ensure missing properties get default values
  const values =
    isControlled && controlledValues
      ? mergeWithSchemaDefaults(controlledValues)
      : internalValues;

  // Helper function to format numbers to avoid floating point precision issues
  const formatNumber = useCallback((value: number): number => {
    // Round to 6 decimal places to avoid floating point precision errors
    return Math.round(value * 1000000) / 1000000;
  }, []);

  // Helper function to format values based on their type
  const formatValue = useCallback(
    (value: unknown): DialValue => {
      if (value === null || value === undefined) {
        return value;
      }

      // Format single numbers
      if (typeof value === "number") {
        return formatNumber(value);
      }

      // Format arrays - format individual number elements while preserving non-numbers
      if (Array.isArray(value)) {
        return value.map((v) => {
          if (typeof v === "number") {
            return formatNumber(v);
          }
          return v; // Keep non-number values as-is
        });
      }

      // Return non-numeric values as-is
      return value;
    },
    [formatNumber],
  );

  const getValue = useCallback(
    (name: string) => {
      const rawValue = values[name];
      return formatValue(rawValue);
    },
    [values, formatValue],
  );

  const setValue = useCallback(
    (name: string, value: DialValue) => {
      if (isControlled) {
        // In controlled mode, only call the change handler
        onValueChange?.(name, value);
      } else {
        // In uncontrolled mode, update internal state
        setInternalValues((prev) => ({
          ...prev,
          [name]: value,
        }));
        // Also call external change handler if provided
        onValueChange?.(name, value);
      }
    },
    [isControlled, onValueChange],
  );

  const contextValue = useMemo(
    () => ({
      values,
      schemas,
      getValue,
      setValue,
      onValueChange,
    }),
    [values, schemas, getValue, setValue, onValueChange],
  );

  return (
    <DialSchemaContext.Provider value={contextValue}>
      {children}
    </DialSchemaContext.Provider>
  );
};
