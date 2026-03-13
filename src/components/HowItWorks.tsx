'use client'

import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/AnimatedSection'

const steps = [
  {
    number: '01',
    title: 'Connect',
    description: 'Connect your Phantom or Solflare wallet',
  },
  {
    number: '02',
    title: 'Scan',
    description: 'We find empty token accounts holding rent SOL',
  },
  {
    number: '03',
    title: 'Claim',
    description: 'Close accounts and reclaim your SOL instantly',
  },
]

export default function HowItWorks() {
  return (
    <AnimatedSection className="w-full max-w-6xl mx-auto px-6">
      <h2 className="font-display text-xl font-bold text-white text-center mb-10">
        How It Works
      </h2>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <StaggerItem key={step.number}>
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 h-full">
              {/* Gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#9945FF] to-[#14F195]" />

              {/* Step Number */}
              <span className="text-5xl font-display font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                {step.number}
              </span>

              {/* Title */}
              <h3 className="mt-4 font-display text-base font-semibold text-white">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-2 font-sans text-sm text-claim-text-dim leading-relaxed">
                {step.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </AnimatedSection>
  )
}
