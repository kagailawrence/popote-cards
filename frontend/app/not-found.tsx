import Link from 'next/link'
import { HelpCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center mx-auto text-pink-600 dark:text-pink-400">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
            The page or resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back Home
        </Link>
      </div>
    </div>
  )
}
