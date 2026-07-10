import { onBeforeUnmount, onMounted } from 'vue'

interface CinematicScrollOptions {
  parallaxRate?: number
  scaledParallaxRate?: number
}

export function useCinematicScroll(options: CinematicScrollOptions = {}) {
  const { parallaxRate = 0.3, scaledParallaxRate = 0.4 } = options
  let cleanup: (() => void) | undefined

  onMounted(() => {
    const containers = Array.from(document.querySelectorAll<HTMLElement>('.hide-scrollbar'))
    const handlers = containers.map((container) => {
      const handler = (event: WheelEvent) => {
        if (event.deltaY === 0 || container.scrollWidth <= container.clientWidth) return
        event.preventDefault()
        container.scrollLeft += event.deltaY
      }

      container.addEventListener('wheel', handler, { passive: false })
      return { container, handler }
    })

    const heroBackground = document.querySelector<HTMLElement>('#hero-bg')
    const parallaxLayer = heroBackground ?? document.querySelector<HTMLElement>('.hero-gradient')
    const handleScroll = () => {
      if (!parallaxLayer) return
      const rate = heroBackground ? scaledParallaxRate : parallaxRate
      const scale = heroBackground ? ' scale(1.05)' : ''
      parallaxLayer.style.transform = `translateY(${window.scrollY * rate}px)${scale}`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    cleanup = () => {
      window.removeEventListener('scroll', handleScroll)
      handlers.forEach(({ container, handler }) => container.removeEventListener('wheel', handler))
    }
  })

  onBeforeUnmount(() => cleanup?.())
}
