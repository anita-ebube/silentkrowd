import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Space } from '@/data/spaces'

export function SpaceModal({ space, onClose }: { space: Space | null; onClose: () => void }) {
  return (
    <Modal open={!!space} onClose={onClose}>
      {space && (
        <div className="overflow-hidden rounded-sm">
          <div className="relative h-[300px] md:h-[450px]">
            <img
              src={`https://picsum.photos/seed/${space.img}/1200/600`}
              alt={space.title}
              className="h-full w-full object-cover brightness-50 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-SilentKrowd-charcoal via-transparent to-transparent" />
          </div>
          <div className="relative -mt-20 bg-SilentKrowd-charcoal p-8 md:p-12">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-SilentKrowd-gold">{space.label}</span>
            <h3 className="mb-4 mt-2 font-serif text-3xl text-SilentKrowd-white md:text-4xl">{space.title}</h3>
            <p className="mb-8 max-w-lg text-sm font-light leading-relaxed text-SilentKrowd-muted">{space.desc}</p>
            <div className="mb-8 flex flex-wrap gap-4">
              {space.features.map((f) => (
                <span
                  key={f}
                  className="border border-SilentKrowd-gold/20 px-3 py-1 text-[0.6rem] uppercase tracking-wider text-SilentKrowd-gold/70"
                >
                  {f}
                </span>
              ))}
            </div>
            <Button variant="filled" href="/reservations" onClick={onClose}>
              Reserve This Space
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
