import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const hours = [
  ['Tue – Thu', '6PM – 1AM'],
  ['Fri – Sat', '6PM – 3AM'],
  ['Sunday', '6PM – 12AM'],
  ['Monday', 'Closed'],
]

export function Footer() {
  return (
    <footer className="border-t border-SilentKrowd-border py-16 md:py-24">
      <Container>
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link to="/" className="font-serif text-3xl tracking-[0.15em] text-SilentKrowd-white">
              SilentKrowd <span className="text-SilentKrowd-gold">Luxury</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-SilentKrowd-muted">
              A destination for unforgettable nights. Lounge, dining, and nightlife reimagined.
            </p>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-6 text-[0.65rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Navigate</h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                Home
              </Link>
              <Link to="/menu" className="text-sm font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                Menu
              </Link>
              <Link to="/gallery" className="text-sm font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                Gallery
              </Link>
              <Link to="/reservations" className="text-sm font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
                Reservations
              </Link>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-6 text-[0.65rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Hours</h4>
            <div className="flex flex-col gap-3">
              {hours.map(([day, time]) => (
                <p key={day} className="text-sm font-light text-SilentKrowd-muted">
                  {day}: {time}
                </p>
              ))}
            </div>
          </div>
          <div className="md:col-span-4">
            <h4 className="mb-6 text-[0.65rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">Contact</h4>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-light text-SilentKrowd-muted">Along Aka Avenue Off Jakpa/Refinery Road, </p>
              <p className="text-sm font-light text-SilentKrowd-muted">Effurun, Delta State</p>
              <a href="tel:+2347016913087" className="text-sm font-light text-SilentKrowd-white transition-colors hover:text-SilentKrowd-gold">
                (+234)7016913087
              </a>
              <a href="mailto:silentkrowd@gmail.com" className="text-sm font-light text-SilentKrowd-white transition-colors hover:text-SilentKrowd-gold">
                silentkrowd@gmail.com
              </a>
            </div>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Instagram" className="text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-gold">
                <Instagram size={20} />
              </a>
              <a href="#" aria-label="Facebook" className="text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-gold">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-gold">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-SilentKrowd-border pt-8 md:flex-row">
          <p className="text-xs font-light text-SilentKrowd-muted">© {new Date().getFullYear()} SilentKrowd Luxury. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
              Privacy
            </a>
            <a href="#" className="text-xs font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
              Terms
            </a>
            <a href="#" className="text-xs font-light text-SilentKrowd-muted transition-colors hover:text-SilentKrowd-white">
              Accessibility
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
