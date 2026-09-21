"use client";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  label?: string;
  onChange: (value: number) => void;
}

export function QuantityStepper({ value, min = 1, max, disabled = false, label = "Quantity", onChange }: QuantityStepperProps) {
  const step = "flex h-9 w-9 items-center justify-center text-lg text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300";

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label={label}>
      <button type="button" className={step} onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        −
      </button>
      <span className="min-w-8 px-1 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={step} onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        +
      </button>
    </div>
  );
}
