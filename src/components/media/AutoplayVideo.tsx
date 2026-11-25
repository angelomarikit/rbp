import { useEffect, useRef } from 'react'

type Props = {
  src: string
  className?: string
}

/** Muted background video — browsers often need an explicit play() after load. */
export function AutoplayVideo({ src, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.muted = true
    el.defaultMuted = true
    const play = () => {
      void el.play().catch(() => {})
    }
    play()
    el.addEventListener('loadeddata', play)
    el.addEventListener('canplay', play)
    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
    }
  }, [src])

  return (
    <video
      ref={ref}
      key={src}
      className={className}
      src={src}
      autoPlay
      muted
      playsInline
      loop
      preload="auto"
    />
  )
}