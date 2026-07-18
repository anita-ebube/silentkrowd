import { memo, useDeferredValue, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Heart, SearchX } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { MenuItemModal } from '@/components/ui/MenuItemModal'
import { menuData, categories, type MenuCategory, type MenuItem } from '@/data/menu'
import { useCart } from '@/context/CartContext'
import { cn } from '@/utils/cn'

/* ───────────────────────── Image relevance helper ───────────────────────── */

const CATEGORY_FALLBACK: Record<MenuCategory, string> = {
  food: 'gourmet,plate',
  drinks: 'cocktail,drink',
  wine: 'wine,glass',
  spirits: 'whiskey,bottle',
  desserts: 'dessert,cake',
}

const KEYWORD_BANK = [
  'chicken', 'beef', 'fish', 'tilapia', 'croaker', 'shrimp', 'prawns', 'pizza',
  'pasta', 'noodles', 'rice', 'salad', 'burger', 'shawarma', 'omelette', 'egg',
  'juice', 'smoothie', 'milkshake', 'coffee', 'cappuccino', 'espresso', 'tea',
  'cocktail', 'mojito', 'daiquiri', 'wine', 'champagne', 'whiskey', 'vodka',
  'rum', 'gin', 'tequila', 'cognac', 'beer', 'shisha', 'chocolate', 'dumplings',
  'spring rolls', 'fries', 'turkey', 'sausage', 'soup', 'pineapple', 'orange',
  'watermelon', 'strawberry', 'banana', 'lemonade',
]

function getImageKeywords(item: MenuItem) {
  const lower = item.name.toLowerCase()
  const matched = KEYWORD_BANK.filter((k) => lower.includes(k)).slice(0, 2)
  const tags = matched.length > 0 ? matched.join(',') : CATEGORY_FALLBACK[item.category]
  return tags.replace(/\s+/g, '')
}

function getImageUrl(item: MenuItem) {
  return `https://loremflickr.com/500/500/${getImageKeywords(item)}?lock=${item.id}`
}

/* ───────────────────────── Shared animation variants ───────────────────────── */

const blurRevealVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 140, damping: 20 },
  },
}

const staggerContainer = (stagger = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.94, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 130, damping: 18 },
  },
}

/* ───────────────────────── Menu card: CSS-based hover effects ───────────────────────── */

const MenuCard = memo(function MenuCard({
  item,
  index,
  isFavorite,
  onOpen,
  onToggleFav,
  onAdd,
}: {
  item: MenuItem
  index: number
  isFavorite: boolean
  onOpen: () => void
  onToggleFav: () => void
  onAdd: () => void
}) {
  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
      style={{ transitionDelay: `${(index % 4) * 0.05}s` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-SilentKrowd-border bg-SilentKrowd-glass shadow-lg shadow-black/20 transition-shadow duration-500 hover:shadow-2xl hover:shadow-SilentKrowd-gold/10"
    >
      {/* Image */}
      <div
        onClick={onOpen}
        data-cursor-hover
        className="relative h-56 cursor-pointer overflow-hidden md:h-64"
      >
        <motion.img
          src={getImageUrl(item)}
          alt={item.name}
          loading="lazy"
          whileHover={{ scale: 1.12 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="h-full w-full object-cover brightness-[0.85] contrast-105 saturate-[0.95]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-SilentKrowd-black/60 via-SilentKrowd-black/5 to-transparent" />

        {/* Glowing ring on hover (CSS-only) */}
        <div className="pointer-events-none absolute inset-0 rounded-t-2xl ring-1 ring-inset ring-SilentKrowd-gold/0 shadow-[0_0_0_0_rgba(212,175,55,0)] transition-all duration-500 group-hover:ring-SilentKrowd-gold/30 group-hover:shadow-[0_0_28px_4px_rgba(212,175,55,0.18)]" />

        {/* Number badge */}
        <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-SilentKrowd-gold text-[0.6rem] font-semibold text-SilentKrowd-black">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Category pill */}
        <span className="absolute right-4 top-4 rounded-full bg-SilentKrowd-black/60 px-3 py-1 text-[0.6rem] uppercase tracking-[0.15em] text-SilentKrowd-white backdrop-blur-sm">
          {item.category}
        </span>

        {/* Favorite */}
        <motion.button
          aria-label="Toggle favorite"
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFav()
          }}
          className={cn(
            'absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-SilentKrowd-black/50 backdrop-blur-sm transition-colors',
            isFavorite ? 'text-red-400' : 'text-SilentKrowd-white/70 hover:text-red-400',
          )}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </motion.button>
      </div>

      {/* Content */}
      <div onClick={onOpen} className="flex flex-1 cursor-pointer flex-col gap-3 p-5">
        <h3 className="font-serif text-lg text-SilentKrowd-white transition-colors group-hover:text-SilentKrowd-gold md:text-xl">
          {item.name}
        </h3>
        <span className="block h-px w-8 bg-SilentKrowd-gold/40 transition-all duration-500 group-hover:w-14" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-serif text-lg text-SilentKrowd-gold">
            {item.price > 0 ? `₦${item.price.toLocaleString()}` : 'Ask Server'}
          </span>
          <motion.button
            aria-label="Add to order"
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-SilentKrowd-gold text-SilentKrowd-black transition-colors hover:bg-SilentKrowd-goldLight hover:scale-110"
          >
            <Plus size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
})

/* ───────────────────────── Page ───────────────────────── */

export default function Menu() {
  const [category, setCategory] = useState<MenuCategory | 'food'>('food')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [detail, setDetail] = useState<MenuItem | null>(null)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const { addItem } = useCart()

 const items = useMemo(() => {
  const q = deferredSearch.toLowerCase()
  return menuData.filter((item) => {
    const matchesCategory = item.category === category
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.category.includes(q)
    return matchesCategory && matchesSearch
  })
}, [category, deferredSearch])

  function toggleFav(id: number) {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="pb-32 pt-24">
      <>
        <title>Menu — SilentKrowd</title>
        <meta name="description" content="Explore SilentKrowd's menu of signature dishes, cocktails, wine, champagne, and desserts." />
      </>

      <Container className="mb-12">
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          animate="show"
          className="mb-8 flex flex-col gap-6 md:flex-row md:items-center"
        >
          <motion.h1 variants={blurRevealVariants} className="font-serif text-4xl text-SilentKrowd-white md:text-5xl">
            The Menu
          </motion.h1>
          <motion.div variants={blurRevealVariants} className="relative max-w-md flex-1 md:ml-auto">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-SilentKrowd-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes, cocktails..."
              aria-label="Search menu"
              className="w-full rounded-sm border border-SilentKrowd-border bg-SilentKrowd-glass py-3 pl-11 pr-4 text-sm font-light text-SilentKrowd-white placeholder-SilentKrowd-muted transition-colors focus:border-SilentKrowd-gold/30 focus:outline-none"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.04, 0.1)}
          initial="hidden"
          animate="show"
          className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-4 no-scrollbar md:mx-0 md:px-0"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              variants={blurRevealVariants}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => setCategory(cat.value)}
              className={cn(
                'whitespace-nowrap border px-6 py-2.5 text-[0.7rem] uppercase tracking-[0.15em] transition-all',
                category === cat.value
                  ? 'border-SilentKrowd-gold/40 bg-SilentKrowd-gold/[0.06] text-SilentKrowd-gold'
                  : 'border-SilentKrowd-border text-SilentKrowd-muted hover:border-SilentKrowd-gold/40 hover:text-SilentKrowd-gold',
              )}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>
      </Container>

      <Container>
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="flex flex-col items-center py-20 text-center"
          >
            <SearchX size={48} className="mb-4 text-SilentKrowd-muted/30" />
            <p className="text-sm text-SilentKrowd-muted">No items found</p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  index={i}
                  isFavorite={favorites.has(item.id)}
                  onOpen={() => setDetail(item)}
                  onToggleFav={() => toggleFav(item.id)}
                  onAdd={() => addItem(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Container>

      <MenuItemModal item={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
