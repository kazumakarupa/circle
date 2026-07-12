export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string
  languages: string[]
  prefecture: string
  city: string
  phone_verified: boolean
  created_at: string
}

export type Home = {
  id: string
  owner_id: string
  title: string
  description: string
  neighborhood: string
  property_type: 'house' | 'apartment'
  accommodation_type: 'entire' | 'private_room'
  residence_type: 'primary' | 'secondary'
  prefecture: string
  city: string
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  size_m2: number | null
  amenities: string[]
  children_welcome: boolean
  pets_welcome: boolean
  smoking_allowed: boolean
  rules_note: string
  photos: string[]
  gp_per_night: number
  status: 'draft' | 'online'
  created_at: string
  owner?: Profile
}

export type Availability = {
  id: string
  home_id: string
  start_date: string
  end_date: string
  exchange_type: 'any' | 'reciprocal' | 'gp'
  min_nights: number
}

export type Conversation = {
  id: string
  home_id: string
  guest_id: string
  host_id: string
  created_at: string
  home?: Home
  guest?: Profile
  host?: Profile
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Exchange = {
  id: string
  conversation_id: string
  home_id: string
  host_id: string
  guest_id: string
  start_date: string
  end_date: string
  guests_count: number
  exchange_type: 'reciprocal' | 'gp'
  gp_amount: number
  status: 'requested' | 'pre_approved' | 'finalized' | 'canceled' | 'completed'
  created_at: string
  home?: Home
  host?: Profile
  guest?: Profile
}

export type Review = {
  id: string
  exchange_id: string
  home_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_role: 'guest' | 'host'
  rating: number
  cleanliness: number | null
  communication: number | null
  accuracy: number | null
  body: string
  reply: string | null
  created_at: string
  reviewer?: Profile
}

export type LedgerEntry = {
  id: string
  user_id: string
  delta: number
  reason: string
  exchange_id: string | null
  created_at: string
}
