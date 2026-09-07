import Link from 'next/link'
import { Sparkles, MapPin, Award, CheckCircle2, ShieldCheck, Heart, Truck, Palette, FileText } from 'lucide-react'

export function SeoRichContent() {
  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 border-t border-zinc-200 dark:border-zinc-800">
      {/* Primary Educational Article Section for Search Engines */}
      <article className="prose dark:prose-invert max-w-none space-y-12">
        {/* Banner 1: Kenya National Examinations Coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 dark:text-pink-400 block">
              KENYA NATIONAL EXAMINATIONS PREMIER SERVICE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Direct School Gate Delivery for KCSE, KPSEA & IGCSE Candidates
            </h2>
            <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
              Popote Card Delivery is Kenya’s first dedicated print-on-demand platform specializing in high-grade physical success cards delivered directly to secondary and primary schools across the nation. During the high-pressure KNEC examination season (KCSE and KPSEA), candidate morale and parental encouragement are paramount.
            </p>
            <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
              We bridge the geographic gap between parents, relatives, sponsors, and students studying in national boarding schools, county schools, and private academies across all 47 counties in Kenya.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Nairobi, Central & Rift Valley</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Western, Nyanza & Coast</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Eastern & North Eastern</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Private & Public Institutions</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-pink-400 font-extrabold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" /> Nationwide Logistics Hubs
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-bold">Nairobi Central Hub:</span>
                  <span className="text-zinc-400">GPO / Industrial Area</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-bold">Rift Valley Hub:</span>
                  <span className="text-zinc-400">Nakuru CBD / Eldoret</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="font-bold">Western & Nyanza Hub:</span>
                  <span className="text-zinc-400">Kisumu / Kakamega</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="font-bold">Coast Regional Hub:</span>
                  <span className="text-zinc-400">Mombasa Island</span>
                </li>
              </ul>
              <div className="pt-2 text-[10px] text-pink-300 text-center font-mono">
                SAME-DAY & NEXT-DAY EXPRESS DELIVERY
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid 2: 350GSM Luxury Finishing & Calligraphy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              350GSM Gold Foil Finishing
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Every Popote card is manufactured using ultra-thick 350GSM cardstock paper with gold foil stamping, metallic inks, and matte/gloss protective lamination designed to endure handling and preserve memories for decades.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-500">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Candidate Photo & Handwritten Fonts
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Personalize Page 2 with high-resolution photo inserts of your candidate, and compose custom messages formatted in handwritten calligraphy typography to convey deep warmth, faith, and academic confidence.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm card-hover-effect">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Physical Delivery Note Proof
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Eliminate anxiety with our transparent digital proof of delivery. Riders scan and upload signed delivery notes and gate photos directly onto your live online tracking timeline upon successful school gate handover.
            </p>
          </div>
        </div>
      </article>

      {/* SEO Regional Keyword Tags Cloud */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
          Popular Search Terms & Delivery Schools Covered in Kenya:
        </h4>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
          {[
            'KCSE Success Cards Kenya',
            'Alliance High School Delivery',
            'Kenya High Success Cards',
            'Moi Girls Eldoret Delivery',
            'Mang\'u High Success Card',
            'Loreto Limuru Exam Cards',
            'Maranda High School Delivery',
            'St. Mary\'s Yala Success Cards',
            'Maseno School Exam Delivery',
            'Kapsabet High School Cards',
            'Lugulu Girls Success Card',
            'Pangani Girls Success Cards',
            'Lenana School Card Delivery',
            'M-Pesa Success Card Order',
            'Custom Photo Success Cards Nairobi',
            'KPSEA Grade 6 Success Cards',
            '350GSM Gold Foil Success Cards',
          ].map((kw, i) => (
            <span key={i} className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
