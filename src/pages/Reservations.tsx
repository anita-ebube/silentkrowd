import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

const partySizes = ['1', '2', '3', '4', '5', '6', '7+']
const times = ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM']

export default function Reservations() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen pb-32 pt-40">
      <>
        <title>Reservations — SilentKrowd</title>
        <meta name="description" content="Reserve your table at SilentKrowd. Limited seating each evening for an intimate experience." />
      </>
      <Container className="max-w-[720px]">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
            Reserve Your Evening
          </span>
          <h1 className="font-serif text-4xl text-SilentKrowd-white md:text-6xl">
            Book a <em className="text-SilentKrowd-gold not-italic">table</em>
          </h1>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-sm border border-SilentKrowd-gold/20 bg-SilentKrowd-glass p-12 text-center"
          >
            <CheckCircle2 size={44} className="mb-4 text-SilentKrowd-gold" />
            <h2 className="mb-2 font-serif text-2xl text-SilentKrowd-white">Request received</h2>
            <p className="max-w-sm text-sm font-light text-SilentKrowd-muted">
              Thank you. A member of our team will confirm your reservation by email within 24 hours.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-sm border border-SilentKrowd-border bg-SilentKrowd-glass p-8 md:p-12"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Full name" type="text" required />
              <Field label="Email" type="email" required />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Phone" type="tel" required />
              <Field label="Date" type="date" required />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">
                  Party size
                </label>
                <div className="flex flex-wrap gap-2">
                  {partySizes.map((size) => (
                    <PillOption key={size} name="partySize" value={size} />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">
                  Preferred time
                </label>
                <div className="flex flex-wrap gap-2">
                  {times.map((time) => (
                    <PillOption key={time} name="time" value={time} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">
                Special requests
              </label>
              <textarea
                rows={4}
                placeholder="Anniversary, dietary needs, seating preference..."
                className="w-full resize-none rounded-sm border border-SilentKrowd-border bg-SilentKrowd-black/40 p-4 text-sm font-light text-SilentKrowd-white placeholder-SilentKrowd-muted/60 transition-colors focus:border-SilentKrowd-gold/30 focus:outline-none"
              />
            </div>
            <Button variant="filled" type="submit" className="w-full justify-center">
              Confirm Reservation
            </Button>
          </motion.form>
        )}
      </Container>
    </div>
  )
}

function Field({ label, type, required }: { label: string; type: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">{label}</label>
      <input
        type={type}
        required={required}
        className="w-full rounded-sm border border-SilentKrowd-border bg-SilentKrowd-black/40 p-4 text-sm font-light text-SilentKrowd-white transition-colors focus:border-SilentKrowd-gold/30 focus:outline-none"
      />
    </div>
  )
}

function PillOption({ name, value }: { name: string; value: string }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} className="peer sr-only" required />
      <span className="block border border-SilentKrowd-border px-4 py-2 text-xs text-SilentKrowd-muted transition-colors peer-checked:border-SilentKrowd-gold/40 peer-checked:bg-SilentKrowd-gold/[0.08] peer-checked:text-SilentKrowd-gold hover:border-SilentKrowd-gold/30">
        {value}
      </span>
    </label>
  )
}
