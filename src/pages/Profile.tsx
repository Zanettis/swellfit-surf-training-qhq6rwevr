import { useEffect } from 'react'

export default function Profile() {
  useEffect(() => {
    document.title = 'SwellFit — Profile'
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-bold tracking-tight">Profile</h1>
      <p className="text-muted-foreground">Surfer Profile & Settings — Coming in Stage 4</p>
    </div>
  )
}
