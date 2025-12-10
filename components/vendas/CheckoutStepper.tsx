import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
}

interface CheckoutStepperProps {
  currentStep: number;
  steps: Step[];
}

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 ${
                  currentStep > step.number
                    ? 'bg-teal-500 text-white'
                    : currentStep === step.number
                    ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {currentStep > step.number ? (
                  <Check size={20} />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs sm:text-sm font-medium text-center transition-colors ${
                  currentStep >= step.number ? 'text-white' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 sm:mx-4 relative -top-5 sm:-top-6">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStep > step.number ? 'bg-teal-500' : 'bg-gray-700'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CheckoutStepper;
