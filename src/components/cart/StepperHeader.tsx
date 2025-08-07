// components/cart/StepperHeader.tsx
'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperHeaderProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export default function StepperHeader({ steps, currentStep, completedSteps }: StepperHeaderProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="relative flex items-center">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${completedSteps.includes(step.id)
                      ? 'bg-[#5CA131] text-white'
                      : currentStep === step.id
                      ? 'bg-[#5CA131] text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                
                {/* Step Label */}
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep === step.id || completedSteps.includes(step.id)
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 sm:mx-6">
                  <div className={`h-0.5 ${
                    completedSteps.includes(step.id) ? 'bg-[#5CA131]' : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Step Labels */}
        <div className="mt-4 sm:hidden">
          <p className="text-sm font-medium text-gray-900">
            {steps.find(step => step.id === currentStep)?.title}
          </p>
          <p className="text-xs text-gray-500">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}