export interface Artist {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  price: number;
  specialties: string[];
  image: string;
  verified: boolean;
}

const portraits = [
  "https://images.unsplash.com/photo-1664575599618-8f6bd76fc670?w=600&q=80",
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=600&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80",
  "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=600&q=80",
  "https://images.unsplash.com/photo-1581824283135-0666cf353f35?w=600&q=80",
  "https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=600&q=80",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
];

export const artists: Artist[] = [
  { id: "1", name: "Aanya Kapoor", city: "Mumbai", rating: 4.9, reviews: 312, price: 4999, specialties: ["Bridal Makeup", "HD Makeup"], image: portraits[0], verified: true },
  { id: "2", name: "Priya Sharma", city: "Delhi", rating: 4.8, reviews: 245, price: 1499, specialties: ["Mehndi", "Bridal Mehndi"], image: portraits[1], verified: true },
  { id: "3", name: "Riya Mehta", city: "Bangalore", rating: 4.9, reviews: 410, price: 3499, specialties: ["Party Makeup", "Hair Styling"], image: portraits[2], verified: true },
  { id: "4", name: "Sana Khan", city: "Hyderabad", rating: 4.7, reviews: 188, price: 999, specialties: ["Mehndi", "Nail Art"], image: portraits[3], verified: true },
  { id: "5", name: "Nikita Rao", city: "Pune", rating: 4.9, reviews: 276, price: 5499, specialties: ["Bridal Makeup", "Saree Draping"], image: portraits[4], verified: true },
  { id: "6", name: "Diya Verma", city: "Jaipur", rating: 4.8, reviews: 198, price: 2499, specialties: ["Wedding Mehndi"], image: portraits[5], verified: true },
  { id: "7", name: "Meera Iyer", city: "Chennai", rating: 4.9, reviews: 354, price: 3999, specialties: ["Bridal Makeup", "Hair"], image: portraits[6], verified: true },
  { id: "8", name: "Tanya Singh", city: "Kolkata", rating: 4.7, reviews: 142, price: 1999, specialties: ["Party Makeup", "Mehndi"], image: portraits[7], verified: true },
];

export const cities = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Jaipur", "Chennai", "Kolkata"];

export const reviews = [
  { id: 1, name: "Ananya R.", role: "Bride", text: "GlamBook made my wedding day perfect! Booked Aanya for bridal makeup — flawless work and so professional.", rating: 5, image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80" },
  { id: 2, name: "Pooja K.", role: "Engagement Party", text: "Loved the mehndi designs. Smooth booking, fair pricing, and the artist arrived right on time.", rating: 5, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80" },
  { id: 3, name: "Sneha M.", role: "Reception", text: "From hair to makeup to saree draping — one platform, zero stress. Highly recommended!", rating: 5, image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&q=80" },
  { id: 4, name: "Kavya S.", role: "Sangeet", text: "The portfolio photos really helped me choose. Service was 10x better than expected.", rating: 5, image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80" },
];
