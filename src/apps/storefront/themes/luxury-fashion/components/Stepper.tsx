/**
 * Stepper — ordered progress (checkout, how-it-works). Serif numerals as ornament, hairline
 * connectors; the current step is clearly ink, completed steps show a --success tick. See §32.8.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconCheck } from './icons';

export interface StepItem {
  id: string;
  label: ReactNode;
}

export interface StepperProps {
  steps: ReadonlyArray<StepItem>;
  /** Index of the active step (0-based). Earlier steps render as complete. */
  current: number;
  className?: string;
}

export function Stepper(props: StepperProps): ReactElement {
  const { steps, current, className } = props;
  return (
    <ol className={cn('sf-stepper', className)}>
      {steps.map((step, i) => {
        const complete = i < current;
        const active = i === current;
        return (
          <li
            key={step.id}
            className={cn(
              'sf-stepper__step',
              complete && 'sf-stepper__step--complete',
              active && 'sf-stepper__step--active',
            )}
            aria-current={active ? 'step' : undefined}
          >
            <span className="sf-stepper__num" aria-hidden>
              {complete ? <IconCheck width={18} height={18} /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className="sf-stepper__label">{step.label}</span>
            {i < steps.length - 1 ? <span className="sf-stepper__connector" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
