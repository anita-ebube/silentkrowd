// src/pages/OrderSuccess.tsx
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { orderNumber?: string; phone?: string } | null

  if (!state?.orderNumber) {
    // Landed here directly (refresh, bookmark) with no order context — send
    // to tracking instead of showing a confirmation with nothing to confirm.
    return <Navigate to="/track-order" replace />
  }

  function goToTracking() {
    navigate('/track-order', { state: { orderNumber: state!.orderNumber, phone: state!.phone } })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-SilentKrowd-black py-24">
      <Container className="max-w-lg text-center">
        <CheckCircle2 size={56} className="mx-auto mb-6 text-SilentKrowd-gold" />
        <h1 className="mb-3 font-serif text-3xl text-SilentKrowd-white">Order Placed</h1>
        <p className="mb-1 text-SilentKrowd-muted">Thank you — your payment was successful.</p>
        <p className="mb-8 text-lg tracking-wide text-SilentKrowd-gold">{state.orderNumber}</p>
        <p className="mb-10 text-sm text-SilentKrowd-muted">
          Keep this order number and the phone number you checked out with — you'll need both to
          track your order.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="filled" onClick={goToTracking}>
            Track Order
          </Button>
          <Link
            to="/menu"
            className="inline-flex items-center px-6 text-sm text-SilentKrowd-muted underline-offset-4 hover:text-SilentKrowd-white hover:underline"
          >
            Back to Menu
          </Link>
        </div>
      </Container>
    </div>
  )
}

