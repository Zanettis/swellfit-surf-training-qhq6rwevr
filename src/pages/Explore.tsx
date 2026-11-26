import { useEffect } from 'react'

export default function Explore() {
  useEffect(() => {
    document.title = 'SwellFit — Explore'
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-bold tracking-tight">Explore</h1>
      <p className="text-muted-foreground">Programs & Breathwork — Coming in Stage 4</p>
    </div>
  )
}
