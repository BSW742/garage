import listingsData from '../data/listings.json';

export interface Listing {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  price: number;
  location: string;
  description: string;
  photos: string[];
  sellerContact: {
    email: string;
    phone?: string;
  };
  createdAt: string;
}

const listings: Listing[] = listingsData as Listing[];

export function getAllListings(): Listing[] {
  return listings;
}

export function getListingById(id: string): Listing | undefined {
  return listings.find(l => l.id === id);
}

export interface FilterOptions {
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  make?: string;
}

export function filterListings(options: FilterOptions): Listing[] {
  return listings.filter(listing => {
    if (options.location && listing.location.toLowerCase() !== options.location.toLowerCase()) {
      return false;
    }
    if (options.maxPrice && listing.price > options.maxPrice) {
      return false;
    }
    if (options.minPrice && listing.price < options.minPrice) {
      return false;
    }
    if (options.make && listing.make.toLowerCase() !== options.make.toLowerCase()) {
      return false;
    }
    return true;
  });
}

export function getFeaturedListings(count: number = 6): Listing[] {
  return listings.slice(0, count);
}

export function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Listing {
  const newListing: Listing = {
    ...listing,
    id: `${listing.make.toLowerCase()}-${listing.year}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  listings.unshift(newListing);
  return newListing;
}
