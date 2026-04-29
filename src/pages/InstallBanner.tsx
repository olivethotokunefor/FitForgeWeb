// src/components/InstallBanner.tsx
import { useEffect, useState } from 'react'

// Check if app is installed
const isAppInstalled = () => {
  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (navigator as any).standalone === true
  return isStandalone || isIOSStandalone
}

export function InstallBanner() {
  const [isInstalled, setIsInstalled] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const installed = isAppInstalled()
    setIsInstalled(installed)

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    if (/android/.test(userAgent)) {
      setPlatform('android')
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
    } else {
      setPlatform('other')
    }

    // Listen for beforeinstallprompt event (Android/Chrome only)
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
    if (deferredPrompt && platform === 'android') {
      // Chrome/Android - trigger native install
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // Show instructions for all cases without native prompt
      setShowInstructions(true)
    }
  }

  const closeInstructions = () => {
    setShowInstructions(false)
  }

  // Don't show banner if already installed
  if (isInstalled) return null

  return (
    <>
      {/* Install Banner */}
      <div className="install-banner">
        <div className="install-banner-content">
          <div className="install-banner-icon">
            {platform === 'android' ? '🤖' : '📱'}
          </div>
          <div className="install-banner-text">
            <strong>Install FitForge App</strong>
            <p>
              {platform === 'android' 
                ? 'Install in one click for offline access and home screen launch'
                : platform === 'ios'
                ? 'Add to Home Screen for the best experience'
                : 'Install app for better experience'}
            </p>
          </div>
          <button onClick={handleInstall} className="install-banner-btn">
            {platform === 'android' ? 'Install' : 'Add to Home Screen'}
          </button>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="install-modal-overlay" onClick={closeInstructions}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <button className="install-modal-close" onClick={closeInstructions}>✕</button>
            
            <div className="install-modal-icon">
              {platform === 'ios' ? '📱' : '🤖'}
            </div>
            <h3>Install FitForge on {platform === 'ios' ? 'iPhone/iPad' : 'Android'}</h3>
            
            {platform === 'ios' ? (
              <div className="install-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    Tap the <strong>Share button</strong> at the bottom of the screen
                    <div className="step-icon">📤</div>
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                    <div className="step-icon">➕</div>
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    Tap <strong>"Add"</strong> in the top right corner
                  </div>
                </div>
              </div>
            ) : platform === 'android' ? (
              <div className="install-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    Tap the <strong>Chrome menu button</strong> (three dots ⋮) in the top right corner
                    <div className="step-icon">⋮</div>
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
                    <div className="step-icon">📲</div>
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    Tap <strong>"Install"</strong> on the confirmation popup
                    <div className="step-icon">✅</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="install-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    Open Chrome or Samsung Internet browser
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    Tap the menu button (⋮) in the top/bottom corner
                  </div>
                </div>
                <div className="step-arrow">↓</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    Select "Install app" or "Add to Home screen"
                  </div>
                </div>
              </div>
            )}
            
            <button className="install-modal-btn" onClick={closeInstructions}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}