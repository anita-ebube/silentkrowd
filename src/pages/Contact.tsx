import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import contactImg from '@/assets/home/outdoor.jpg'

const details = [
  { icon: MapPin, label: 'Address', value: 'Along Aka Avenue Off Jakpa/Refinery Road' },
  { icon: Phone, label: 'Phone', value: '(+234)7016913087' },
  { icon: Mail, label: 'Email', value: 'silentkrowd@gmail.com' },
  { icon: Clock, label: 'Hours', value: 'Tue–Sun, 6PM – 3AM · Closed Mondays' },
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const { error: insertError } = await supabase.from('contact_messages').insert({
      full_name: formData.get('fullName') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    })

    setLoading(false)

    if (insertError) {
      setError('Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="min-h-screen pb-32 pt-40">
      <>
        <title>Contact — SilentKrowd</title>
        <meta name="description" content="Get in touch with SilentKrowd for private events, press inquiries, or general questions." />
      </>
      <Container className="mb-20 text-center">
        <span className="mb-4 block text-[0.6rem] uppercase tracking-[0.4em] text-SilentKrowd-gold">
          Get in Touch
        </span>
        <h1 className="font-serif text-4xl text-SilentKrowd-white md:text-6xl">
          Let's start a <em className="text-SilentKrowd-gold not-italic">conversation</em>
        </h1>
      </Container>

      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-10 h-[280px] overflow-hidden rounded-sm border border-SilentKrowd-border md:h-[360px]">
              <img
                src={contactImg}
                alt="Map to SilentKrowd"
                className="h-full w-full object-cover brightness-50 contrast-110 saturate-50"
              />
            </div>
            <div className="space-y-6">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-SilentKrowd-gold/30 text-SilentKrowd-gold">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-SilentKrowd-gold">{label}</p>
                    <p className="mt-1 text-sm font-light text-SilentKrowd-white/80">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-full flex-col items-center justify-center rounded-sm border border-SilentKrowd-gold/20 bg-SilentKrowd-glass p-12 text-center"
              >
                <CheckCircle2 size={44} className="mb-4 text-SilentKrowd-gold" />
                <h2 className="mb-2 font-serif text-2xl text-SilentKrowd-white">Message sent</h2>
                <p className="max-w-sm text-sm font-light text-SilentKrowd-muted">
                  Thank you for reaching out. Our team will respond within one business day.
                </p>
              </motion.div>
            ) : (
              <motion.form
                ref={formRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6 rounded-sm border border-SilentKrowd-border bg-SilentKrowd-glass p-8 md:p-10"
              >
                {error && (
                  <p className="rounded-sm border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField label="Name" name="fullName" type="text" />
                  <FormField label="Email" name="email" type="email" />
                </div>
                <FormField label="Subject" name="subject" type="text" />
                <div>
                  <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={6}
                    required
                    className="w-full resize-none rounded-sm border border-SilentKrowd-border bg-SilentKrowd-black/40 p-4 text-sm font-light text-SilentKrowd-white transition-colors focus:border-SilentKrowd-gold/30 focus:outline-none"
                  />
                </div>
                <Button variant="filled" type="submit" disabled={loading} className="w-full justify-center">
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </motion.form>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

function FormField({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.15em] text-SilentKrowd-muted">{label}</label>
      <input
        type={type}
        name={name}
        required
        className="w-full rounded-sm border border-SilentKrowd-border bg-SilentKrowd-black/40 p-4 text-sm font-light text-SilentKrowd-white transition-colors focus:border-SilentKrowd-gold/30 focus:outline-none"
      />
    </div>
  )
}
