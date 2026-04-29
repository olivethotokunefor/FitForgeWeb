import { useEffect, useState } from 'react'

// Check if app is installed
const isAppInstalled = () => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (navigator as any).standalone === true
  const isInstalled = isStandalone || isIOSStandalone
  
  return isInstalled
}

export function InstallBanner() {
  const [isInstalled, setIsInstalled] = useState(true) // Start as true to avoid flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const installed = isAppInstalled()
    setIsInstalled(installed)

    // Check if on mobile device
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)
    setIsMobile(isMobileDevice)

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Android install
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isMobile && !isInstalled) {
      // iOS or other mobile browsers - show instructions
      showIOSInstructions()
    }
  }

  const showIOSInstructions = () => {
    // Create a modal with instructions for iOS
    const modal = document.createElement('div')
    modal.style.position = 'fixed'
    modal.style.top = '0'
    modal.style.left = '0'
    modal.style.right = '0'
    modal.style.bottom = '0'
    modal.style.background = 'rgba(0,0,0,0.9)'
    modal.style.zIndex = '9999'
    modal.style.display = 'flex'
    modal.style.alignItems = 'center'
    modal.style.justifyContent = 'center'
    modal.style.padding = '20px'
    
    modal.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; max-width: 320px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
        <h3 style="color: var(--white); margin-bottom: 16px;">Install FitForge</h3>
        <p style="color: var(--mid); margin-bottom: 20px; font-size: 14px;">Tap the Share button then "Add to Home Screen"</p>
        <div style="background: var(--surface2); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <span style="font-size: 32px;">📤</span>
            <span style="font-size: 24px; color: var(--orange);">→</span>
            <span style="font-size: 32px;">➕</span>
          </div>
          <div style="font-size: 12px; color: var(--mid); margin-top: 8px;">
            Share → Add to Home Screen
          </div>
        </div>
        <button id="close-modal" style="background: var(--orange); border: none; padding: 12px 24px; border-radius: 10px; color: #000; font-weight: 600; cursor: pointer; width: 100%;">
          Got it
        </button>
      </div>
    `
    
    document.body.appendChild(modal)
    document.getElementById('close-modal')?.addEventListener('click', () => {
      modal.remove()
    })
  }

  // Don't show if already installed
  if (isInstalled) return null

  return (
    <div className="install-banner">
      <div className="install-banner-content">
        <div className="install-banner-icon">📱</div>
        <div className="install-banner-text">
          <strong>Install FitForge App</strong>
          <p>Get the best experience with offline support and home screen access</p>
        </div>
        <button onClick={handleInstall} className="install-banner-btn">
          Install
        </button>
      </div>
    </div>
  )
}