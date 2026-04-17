'use client';

import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';

export type UIStep = {
  key: string;
  label: string;
  completed?: boolean;
};

type UIStepProgressProps = {
  steps: UIStep[];
  activeStep: number;
};

export function UIStepProgress({ steps, activeStep }: UIStepProgressProps) {
  return (
    <Stepper activeStep={activeStep} alternativeLabel>
      {steps.map((step) => (
        <Step key={step.key} completed={step.completed}>
          <StepLabel>{step.label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export type { UIStepProgressProps };
