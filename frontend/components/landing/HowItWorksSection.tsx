'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Palette, Edit3, Smartphone, Printer, Truck, CheckCircle2, ArrowRight, ShieldCheck, MapPin, FileCheck } from 'lucide-react'

interface SystemStep {
  stepNumber: number
  title: string
  subtitle: string
  icon: any
  badge: string
  description: string
  highlights: string[]
  visualTag: string
  color: string
}

const SYSTEM_STEPS: SystemStep[] = [
  {
    stepNumber: 1,
    title: 'Choose Card Design & Size',
    subtitle: 'Browse 50+ Curated Designs for KCSE, KPSEA & Graduation',
    icon: Palette,
    badge: 'Step 1 • Catalog Selection',
    description: 'Select from our catalog of premium 4-page exam success cards. Choose your preferred physical format from A5 (compact), A4 (deluxe standard), or A3 (giant jumbo print) with gold foil embossing options.',
    highlights: [
      '350GSM thick luxury cardstock options',
      'Gold foil, metallic ink & glossy finishes',
      'KCSE, KPSEA, IGCSE & Graduation themes',
    ],
    visualTag: '50+ Verified Card Templates',
    color: 'from-pink-500 to-rose-600',
  },
  {
    stepNumber: 2,
    title: 'Personalize Photo & Calligraphy',
    subtitle: 'Upload Candidate Passport & Custom Handwritten Encouragement',
    icon: Edit3,
    badge: 'Step 2 • Customization Studio',
    description: 'Use our online editor to upload a candidate photo insert, specify recipient details (School Name, Student Class & Index Number), and type your personalized encouragement message rendered in elegant calligraphy typography.',
    highlights: [
      'High-res candidate photo printing insert',
      'Custom handwritten calligraphy font styles',
      'Add family signatures & index number',
    ],
    visualTag: 'Instant 4-Page Live Preview',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    stepNumber: 3,
    title: 'Instant M-Pesa Checkout',
    subtitle: '100% Secure Express Payment via M-Pesa STK Push',
    icon: Smartphone,
    badge: 'Step 3 • Instant Checkout',
    description: 'Pay seamlessly using M-Pesa with our automated STK Push integration. Zero account registration required — your phone receives a prompt, you confirm your PIN, and your card is immediately queued for processing.',
    highlights: [
      'Direct M-Pesa STK Push on phone',
      'Instant SMS order confirmation & tracking link',
      'Zero hidden fees, transparent pricing',
    ],
    visualTag: 'M-Pesa Express Payment',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    stepNumber: 4,
    title: 'Print Routing',
    subtitle: 'High-Res Thermal Printing at a Print Hub',
    icon: Printer,
    badge: 'Step 4 • Precision Printing',
    description: 'Our intelligent routing system dispatches your card order to  print hub (Nairobi, Nakuru, Eldoret, Kisumu, or Mombasa). The card is thermally printed on 350GSM cardstock, gold foil sealed, and packed in a protective waterproof luxury envelope.',
    highlights: [
      'Nairobi, Nakuru, Eldoret, Kisumu & Mombasa hubs',
      'Gold foil embossing & thermal color calibration',
      'Waterproof sealed protective envelope',
    ],
    visualTag: 'Print Hub Dispatch in 2 Hours',
    color: 'from-amber-500 to-orange-600',
  },
  {
    stepNumber: 5,
    title: 'Direct School Gate Delivery & Proof',
    subtitle: 'Guaranteed Doorstep & School Gate Delivery with Scan Proof',
    icon: Truck,
    badge: 'Step 5 • Delivery & Proof',
    description: 'Our dedicated Popote delivery riders hand-deliver the success card straight to the school administration desk or gate matron. The rider captures a physical delivery note scan and recipient photo proof, automatically updated on your live tracking timeline.',
    highlights: [
      'Direct delivery to candidate at school',
      'Verified delivery note photo uploaded to tracker',
      'Real-time SMS updates to sender upon delivery',
    ],
    visualTag: 'Guaranteed 100% School Gate Access',
    color: 'from-blue-500 to-cyan-600',
  },
]

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number>(1)
  const currentStep = SYSTEM_STEPS.find((s) => s.stepNumber === activeStep) || SYSTEM_STEPS[0]

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden" id="how-it-works">
      {/* Background Accent Lines */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            How Popote Card Delivery Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            From your phone screen to the candidate’s hands at school — here is how we ensure every exam success card is printed to perfection and delivered on time nationwide.
          </p>
        </div>

        {/* Step Numbers Navigation Bar */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-5xl mx-auto">
          {SYSTEM_STEPS.map((step) => {
            const isActive = step.stepNumber === activeStep
            const StepIcon = step.icon

            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStep(step.stepNumber)}
                className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 relative ${isActive
                  ? 'border-pink-500 bg-white dark:bg-zinc-900 shadow-xl ring-2 ring-pink-500/30 scale-105 z-10'
                  : 'border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/40 hover:border-pink-300 hover:bg-white dark:hover:bg-zinc-900'
                  }`}
              >
                <div
                  className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-extrabold text-xs sm:text-base text-white shadow-md bg-gradient-to-br ${step.color} transition-transform ${isActive ? 'scale-110 rotate-3' : ''
                    }`}
                >
                  <StepIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>

                <div className="text-center">
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider block ${isActive ? 'text-pink-600 dark:text-pink-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                    Step 0{step.stepNumber}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hidden md:block truncate max-w-[120px]">
                    {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                  </span>
                </div>

                {/* Active Indicator Pin */}
                {isActive && (
                  <div className="absolute -bottom-2 w-3 h-3 bg-pink-500 rotate-45 rounded-sm" />
                )}
              </button>
            )
          })}
        </div>

        {/* Detailed Step Active Card Showcase */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Side */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-extrabold">
                <span>{currentStep.badge}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-pink-600 dark:text-pink-400">
                  {currentStep.subtitle}
                </p>
              </div>

              <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                {currentStep.description}
              </p>

              {/* Feature Highlights Bullet Checklist */}
              <div className="space-y-2.5 pt-2">
                {currentStep.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {activeStep > 1 && (
                  <button
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-extrabold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    &larr; Previous Step
                  </button>
                )}

                {activeStep < 5 ? (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    Next Step &rarr;
                  </button>
                ) : (
                  <Link
                    href="/catalog"
                    className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    Start Your Order Now <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Visual Interactive Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-zinc-950 border border-zinc-800 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-pink-400 font-bold">
                    SYSTEM STAGE 0{currentStep.stepNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold border border-pink-500/30">
                    {currentStep.visualTag}
                  </span>
                </div>

                {/* Dynamic Step Graphic Visual */}
                <div className="aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center shadow-xl text-white transform group-hover:scale-110 transition-transform duration-300`}>
                    <currentStep.icon className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-white">
                      {currentStep.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Popote Card Delivery Kenya Workflow
                    </p>
                  </div>

                  <div className="w-full pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Process</span>
                    <span className="font-mono text-amber-400">100% Guaranteed</span>
                  </div>
                </div>

                <div className="text-center text-[11px] text-zinc-400 italic">
                  "Every step is tracked in real-time on your customer portal with SMS alerts."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
