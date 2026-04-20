export interface Host {
  id: string
  name: string
  avatar: string
  joined: string
  trips: number
  rating: number
  responseRate: number
  responseTime: string
  verified: boolean
  allStar: boolean
}

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  date: string
  body: string
}

export interface Car {
  id: string
  make: string
  model: string
  year: number
  trim?: string
  slug: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  trips: number
  location: string
  distance: string
  transmission: 'Automatic' | 'Manual'
  fuelType: 'Gasoline' | 'Electric' | 'Hybrid' | 'Diesel'
  seats: number
  doors: number
  mpg: string
  range?: string
  category: 'EV' | 'SUV' | 'Luxury' | 'Convertible' | 'Truck' | 'Sports' | 'Classic' | 'Compact' | 'Minivan'
  image: string
  gallery: string[]
  features: string[]
  description: string
  unavailable?: string[]
  host: Host
  reviews: Review[]
  instantBook: boolean
  deliveryAvailable: boolean
  badges?: string[]
}

const HOSTS: Record<string, Host> = {
  h1: { id: 'h1', name: 'Alejandro R.', avatar: 'AR', joined: 'Oct 2022', trips: 412, rating: 4.96, responseRate: 100, responseTime: '< 1 hour', verified: true, allStar: true },
  h2: { id: 'h2', name: 'Nia W.',       avatar: 'NW', joined: 'Mar 2021', trips: 287, rating: 4.93, responseRate: 98,  responseTime: '< 1 hour', verified: true, allStar: true },
  h3: { id: 'h3', name: 'Mateo L.',     avatar: 'ML', joined: 'Jan 2023', trips: 128, rating: 4.88, responseRate: 96,  responseTime: '< 2 hours', verified: true, allStar: false },
  h4: { id: 'h4', name: 'Priya S.',     avatar: 'PS', joined: 'Aug 2020', trips: 534, rating: 4.97, responseRate: 100, responseTime: '< 1 hour', verified: true, allStar: true },
  h5: { id: 'h5', name: 'Derek J.',     avatar: 'DJ', joined: 'May 2023', trips: 72,  rating: 4.84, responseRate: 92,  responseTime: '< 3 hours', verified: true, allStar: false },
  h6: { id: 'h6', name: 'Sofia G.',     avatar: 'SG', joined: 'Feb 2022', trips: 201, rating: 4.91, responseRate: 99,  responseTime: '< 1 hour', verified: true, allStar: true },
  h7: { id: 'h7', name: 'Ravi K.',      avatar: 'RK', joined: 'Nov 2021', trips: 356, rating: 4.95, responseRate: 100, responseTime: '< 1 hour', verified: true, allStar: true },
  h8: { id: 'h8', name: 'Chloe M.',     avatar: 'CM', joined: 'Jul 2023', trips: 45,  rating: 4.78, responseRate: 88,  responseTime: '< 4 hours', verified: true, allStar: false },
}

const SAMPLE_REVIEWS: Review[] = [
  { id: 'r1', author: 'James T.',  avatar: 'JT', rating: 5, date: '2026-03-14', body: 'Spotless, fast, and the pickup was painless. Host was super communicative. Will rent again next weekend.' },
  { id: 'r2', author: 'Mia R.',    avatar: 'MR', rating: 5, date: '2026-03-02', body: 'Best rental experience I have had. Car was fresh detailed, smelled amazing, and the price was unbeatable.' },
  { id: 'r3', author: 'Brandon L.',avatar: 'BL', rating: 4, date: '2026-02-19', body: 'Car is great. Pickup took a little longer than expected but the host was very apologetic and gave us a bottle of water.' },
  { id: 'r4', author: 'Simone K.', avatar: 'SK', rating: 5, date: '2026-02-07', body: 'Ran like a dream on the coast drive to Big Sur. Everything just works — a very premium feel.' },
  { id: 'r5', author: 'Tyler P.',  avatar: 'TP', rating: 5, date: '2026-01-22', body: 'Absolute unit. Highly recommend. The host even left us charging cables + a bottle of water 10/10.' },
]

export const cars: Car[] = [
  {
    id: 'tesla-model-3-2024',
    slug: 'tesla-model-3-2024',
    make: 'Tesla', model: 'Model 3', year: 2024, trim: 'Long Range',
    price: 89, originalPrice: 112, rating: 4.96, reviewCount: 148, trips: 212,
    location: 'San Francisco, CA', distance: '0.8 mi away',
    transmission: 'Automatic', fuelType: 'Electric', seats: 5, doors: 4, mpg: '134 MPGe', range: '358 mi',
    category: 'EV',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Autopilot', 'Supercharger access', 'Bluetooth', 'USB-C charger', 'Glass roof', 'Heated seats', 'Premium audio'],
    description: 'Pristine Long Range Model 3. Recently detailed, tires at 90%, full cabin filter service completed last month. Perfect for weekend trips — chargers in the trunk and a premium sound system that will make your road playlist feel like a concert.',
    host: HOSTS.h1,
    reviews: SAMPLE_REVIEWS.slice(0, 5),
    instantBook: true, deliveryAvailable: true, badges: ['Deal', 'All-Star Host'],
  },
  {
    id: 'porsche-911-carrera-2023',
    slug: 'porsche-911-carrera-2023',
    make: 'Porsche', model: '911', year: 2023, trim: 'Carrera S',
    price: 389, rating: 4.98, reviewCount: 64, trips: 82,
    location: 'Los Angeles, CA', distance: '3.2 mi away',
    transmission: 'Automatic', fuelType: 'Gasoline', seats: 4, doors: 2, mpg: '20 city / 28 hwy',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Sport Chrono', 'Ceramic brakes', 'Launch control', 'Bose premium audio', 'Adaptive cruise', 'Heated seats'],
    description: 'Carrera S in Guards Red. Sport Chrono Package, ceramic composite brakes. Immaculately maintained and garage kept. Perfect for a special occasion, a canyon drive, or just turning heads down PCH.',
    host: HOSTS.h2,
    reviews: SAMPLE_REVIEWS,
    instantBook: false, deliveryAvailable: true, badges: ['Rare find'],
  },
  {
    id: 'jeep-wrangler-2023',
    slug: 'jeep-wrangler-2023',
    make: 'Jeep', model: 'Wrangler', year: 2023, trim: 'Rubicon 4xe',
    price: 132, rating: 4.91, reviewCount: 97, trips: 118,
    location: 'Denver, CO', distance: '1.4 mi away',
    transmission: 'Automatic', fuelType: 'Hybrid', seats: 5, doors: 4, mpg: '49 MPGe',
    category: 'Truck',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['4WD', 'Removable top', 'Tow hitch', 'Off-road tires', 'Skid plates', 'Apple CarPlay'],
    description: 'Rubicon 4xe, ready for trails or quick mountain escapes. Plug-in hybrid means you can cruise the city on electric then tackle Rocky Mountain terrain with the full drivetrain.',
    host: HOSTS.h3,
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    instantBook: true, deliveryAvailable: false, badges: ['Adventure ready'],
  },
  {
    id: 'mercedes-amg-gt-2022',
    slug: 'mercedes-amg-gt-2022',
    make: 'Mercedes-Benz', model: 'AMG GT', year: 2022, trim: 'GT C Roadster',
    price: 495, rating: 4.94, reviewCount: 41, trips: 52,
    location: 'Miami, FL', distance: '2.1 mi away',
    transmission: 'Automatic', fuelType: 'Gasoline', seats: 2, doors: 2, mpg: '16 city / 22 hwy',
    category: 'Convertible',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Convertible top', 'AMG Performance pack', 'Burmester audio', 'Heated & cooled seats', 'Lane assist'],
    description: 'AMG GT C Roadster, twin-turbo V8, convertible. South Beach or Ocean Drive — this car was made for the coast. Host meets you personally, no counters.',
    host: HOSTS.h4,
    reviews: SAMPLE_REVIEWS.slice(1, 5),
    instantBook: false, deliveryAvailable: true, badges: ['Luxury'],
  },
  {
    id: 'rivian-r1t-2024',
    slug: 'rivian-r1t-2024',
    make: 'Rivian', model: 'R1T', year: 2024, trim: 'Adventure',
    price: 165, rating: 4.89, reviewCount: 58, trips: 73,
    location: 'Austin, TX', distance: '0.5 mi away',
    transmission: 'Automatic', fuelType: 'Electric', seats: 5, doors: 4, mpg: '70 MPGe', range: '314 mi',
    category: 'EV',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Quad motors', 'Gear tunnel', 'Camp kitchen compatible', 'Tank turn', 'Rivian charger'],
    description: 'Adventure trim R1T. Gear tunnel stocked with recovery gear. Take it to Big Bend, the Hill Country, or just use it to look cool at Home Depot.',
    host: HOSTS.h5,
    reviews: SAMPLE_REVIEWS.slice(0, 4),
    instantBook: true, deliveryAvailable: true, badges: ['New'],
  },
  {
    id: 'honda-civic-2024',
    slug: 'honda-civic-2024',
    make: 'Honda', model: 'Civic', year: 2024, trim: 'Si',
    price: 52, originalPrice: 68, rating: 4.87, reviewCount: 203, trips: 318,
    location: 'Seattle, WA', distance: '0.9 mi away',
    transmission: 'Manual', fuelType: 'Gasoline', seats: 5, doors: 4, mpg: '31 city / 38 hwy',
    category: 'Compact',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['6-speed manual', 'Apple CarPlay', 'Android Auto', 'Adaptive cruise', 'Bluetooth'],
    description: 'Fresh Si — fun, economical, and reliable. A blast to drive in the twisty bits, but commuting-friendly and sips gas.',
    host: HOSTS.h6,
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    instantBook: true, deliveryAvailable: false, badges: ['Deal'],
  },
  {
    id: 'ford-f150-lightning-2024',
    slug: 'ford-f150-lightning-2024',
    make: 'Ford', model: 'F-150 Lightning', year: 2024, trim: 'Lariat ER',
    price: 149, rating: 4.92, reviewCount: 81, trips: 112,
    location: 'Phoenix, AZ', distance: '1.8 mi away',
    transmission: 'Automatic', fuelType: 'Electric', seats: 5, doors: 4, mpg: '78 MPGe', range: '320 mi',
    category: 'Truck',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Pro Power Onboard', 'Frunk', '4WD', 'Tow package', 'Heated seats', 'BlueCruise'],
    description: 'Lightning Lariat — all the utility of the F-150 with instant EV torque. Pro Power Onboard can run power tools, tailgate parties, or your next camping trip.',
    host: HOSTS.h7,
    reviews: SAMPLE_REVIEWS.slice(2),
    instantBook: true, deliveryAvailable: true, badges: ['All-Star Host'],
  },
  {
    id: 'ford-mustang-1967',
    slug: 'ford-mustang-1967',
    make: 'Ford', model: 'Mustang', year: 1967, trim: 'Fastback',
    price: 275, rating: 4.99, reviewCount: 28, trips: 34,
    location: 'Nashville, TN', distance: '4.7 mi away',
    transmission: 'Manual', fuelType: 'Gasoline', seats: 4, doors: 2, mpg: '14 city / 20 hwy',
    category: 'Classic',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Classic 289 V8', '4-speed manual', 'Restored interior', 'Modern sound system'],
    description: 'A fully restored 1967 Fastback in Highland Green. The driving experience is unmatched — raw, loud, and oh so good. Make your next date night unforgettable.',
    host: HOSTS.h8,
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    instantBook: false, deliveryAvailable: false, badges: ['Rare find', 'Classic'],
  },
  {
    id: 'bmw-m5-2024',
    slug: 'bmw-m5-2024',
    make: 'BMW', model: 'M5', year: 2024, trim: 'Competition',
    price: 310, rating: 4.93, reviewCount: 37, trips: 46,
    location: 'New York, NY', distance: '0.3 mi away',
    transmission: 'Automatic', fuelType: 'Gasoline', seats: 5, doors: 4, mpg: '15 city / 22 hwy',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=75',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['M Competition pack', 'Carbon fiber trim', 'Harman Kardon audio', 'Heated & cooled seats', 'Night vision'],
    description: 'M5 Competition. Twin-turbo V8 making 617hp. Sleek, luxurious, and mind-bogglingly fast. Perfect for making an entrance anywhere in the city.',
    host: HOSTS.h1,
    reviews: SAMPLE_REVIEWS.slice(0, 3),
    instantBook: true, deliveryAvailable: true, badges: ['Luxury'],
  },
  {
    id: 'toyota-sienna-2023',
    slug: 'toyota-sienna-2023',
    make: 'Toyota', model: 'Sienna', year: 2023, trim: 'XLE Hybrid',
    price: 95, rating: 4.88, reviewCount: 142, trips: 201,
    location: 'Chicago, IL', distance: '2.5 mi away',
    transmission: 'Automatic', fuelType: 'Hybrid', seats: 8, doors: 4, mpg: '36 city / 36 hwy',
    category: 'Minivan',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['8 seats', 'Sliding doors', 'Rear entertainment', 'Tri-zone climate', 'Apple CarPlay'],
    description: 'Perfect family hauler or group road-tripper. 8 seats, rear entertainment, and 36 MPG means you can take it further without stopping at the pump.',
    host: HOSTS.h6,
    reviews: SAMPLE_REVIEWS.slice(1, 4),
    instantBook: true, deliveryAvailable: true,
  },
  {
    id: 'range-rover-sport-2024',
    slug: 'range-rover-sport-2024',
    make: 'Land Rover', model: 'Range Rover Sport', year: 2024, trim: 'SE P400',
    price: 245, rating: 4.9, reviewCount: 52, trips: 61,
    location: 'Aspen, CO', distance: '1.1 mi away',
    transmission: 'Automatic', fuelType: 'Gasoline', seats: 5, doors: 4, mpg: '19 city / 26 hwy',
    category: 'SUV',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['4WD', 'Air suspension', 'Meridian audio', 'Heated & cooled seats', 'Panoramic roof'],
    description: 'Range Rover Sport SE. Polished, capable, and seriously luxurious. Takes you to the slopes and the après-ski dinner in style.',
    host: HOSTS.h4,
    reviews: SAMPLE_REVIEWS.slice(2, 5),
    instantBook: false, deliveryAvailable: true, badges: ['Luxury'],
  },
  {
    id: 'mazda-miata-2023',
    slug: 'mazda-miata-2023',
    make: 'Mazda', model: 'MX-5 Miata', year: 2023, trim: 'Club',
    price: 78, rating: 4.95, reviewCount: 91, trips: 127,
    location: 'San Diego, CA', distance: '0.7 mi away',
    transmission: 'Manual', fuelType: 'Gasoline', seats: 2, doors: 2, mpg: '26 city / 34 hwy',
    category: 'Convertible',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=70',
    gallery: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=75',
    ],
    features: ['Soft top', '6-speed manual', 'BBS wheels', 'Brembo brakes', 'Bose audio'],
    description: 'The driving purist\'s dream. Club trim with BBS wheels and Brembos. Drop the top, find a coastal road, and feel the sun.',
    host: HOSTS.h3,
    reviews: SAMPLE_REVIEWS.slice(0, 5),
    instantBook: true, deliveryAvailable: true, badges: ['Deal'],
  },
]

// Inline SVG path data for category icons. Keeping them inline avoids a
// dependency on @iconify/json (which is ~50MB when installed unfiltered)
// and guarantees the icons ship with the example with zero setup.
// Each entry is the `<path>` content for a 24x24 viewBox, stroke-based.
export const categories = [
  { id: 'ev',          label: 'Electric',    svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>' },
  { id: 'suv',         label: 'SUV',         svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 17h18M3 17v-4a2 2 0 0 1 2-2h3l2-4h6l3 4h3a2 2 0 0 1 0 4v2M3 17h2a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0"/>' },
  { id: 'luxury',      label: 'Luxury',      svg: '<path stroke-linecap="round" stroke-linejoin="round" d="m2 7 5 5 5-8 5 8 5-5-2 13H4L2 7z"/>' },
  { id: 'convertible', label: 'Convertible', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 18h16M2 14c0-1 .5-2 2-2h2l3-6h7c2 0 3 1 4 2l1 4c1 0 1 1 1 2v1M6 18a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/>' },
  { id: 'truck',       label: 'Truck',       svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 17V7a1 1 0 0 1 1-1h10v11M14 10h5l2 3v4h-2M7 17a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M3 17h2m6 0h6"/>' },
  { id: 'sports',      label: 'Sports',      svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 2a10 10 0 1 0 10 10M12 12l5-5M12 12l-3 5"/><circle cx="12" cy="12" r="2"/>' },
  { id: 'classic',     label: 'Classic',     svg: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" d="M12 3v6m0 6v6m9-9h-6m-6 0H3"/>' },
  { id: 'compact',     label: 'Compact',     svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 14h18M4 14l2-5a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 5v4h-2m-12 0H4v-4m4 4a2 2 0 1 0 4 0m4 0a2 2 0 1 0 4 0"/>' },
  { id: 'minivan',     label: 'Minivan',     svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 16h18M3 16V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 12h18M7 16a2 2 0 1 0 4 0m2 0a2 2 0 1 0 4 0"/>' },
]

export const cities = [
  { name: 'San Francisco', state: 'CA', listings: 3428, image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=70' },
  { name: 'Los Angeles',   state: 'CA', listings: 5719, image: 'https://images.unsplash.com/photo-1515896769750-31548aa180ed?auto=format&fit=crop&w=800&q=70' },
  { name: 'New York',      state: 'NY', listings: 2891, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=70' },
  { name: 'Miami',         state: 'FL', listings: 2104, image: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=800&q=70' },
  { name: 'Austin',        state: 'TX', listings: 1632, image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?auto=format&fit=crop&w=800&q=70' },
  { name: 'Seattle',       state: 'WA', listings: 1845, image: 'https://images.unsplash.com/photo-1438401171849-74ac270044ee?auto=format&fit=crop&w=800&q=70' },
]

export function getCar(id: string): Car | undefined {
  return cars.find(c => c.id === id || c.slug === id)
}
