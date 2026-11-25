import { useEffect, useRef, type ReactNode } from 'react'

const PX_PER_FRAME = 0.85

type Props = {
  children: ReactNode
  /** Re-run when logo count or sources change (affects track width). */
  trackKey: string
}

/**
 * Footer logo strip: CSS marquee on desktop; rAF loop on touch devices (iOS often skips CSS transform animations).
 */
export function MemberStripMarquee({ children, trackKey }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchUi = window.matchMedia('(hover: none) and (pointer: coarse)')

    let raf = 0
    let offset = 0

    const clearJs = () => {
      cancelAnimationFrame(raf)
      raf = 0
      track.style.transform = ''
      track.style.willChange = ''
      track.classList.remove('member-track-css')
    }

    const runJs = () => {
      clearJs()
      track.style.willChange = 'transform'

      const tick = () => {
        const half = track.scrollWidth / 2
        if (half > 1) {
          offset -= PX_PER_FRAME
          if (-offset >= half) offset = 0
          track.style.transform = `translate3d(${offset}px,0,0)`
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const apply = () => {
      clearJs()
      offset = 0

      if (reduceMotion.matches) return

      if (touchUi.matches) {
        runJs()
        return
      }

      track.classList.add('member-track-css')
    }

    apply()

    const onResize = () => {
      offset = 0
      apply()
    }

    reduceMotion.addEventListener('change', apply)
    touchUi.addEventListener('change', apply)
    window.addEventListener('resize', onResize)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(track)

    const imgs = track.querySelectorAll('img')
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener('load', onResize, { once: true })
    })

    return () => {
      clearJs()
      reduceMotion.removeEventListener('change', apply)
      touchUi.removeEventListener('change', apply)
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [trackKey])

  return (
    <div ref={trackRef} className="flex w-max items-center">
      {children}
    </div>
  )
}