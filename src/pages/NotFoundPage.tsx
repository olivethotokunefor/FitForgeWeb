import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center">
        <div className="text-lg font-semibold">Page not found</div>
        <div className="mt-2 text-sm text-neutral-400">
          The page you’re looking for doesn’t exist.
        </div>
        <Link
          to="/app/dashboard"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-medium text-white hover:bg-violet-400"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
