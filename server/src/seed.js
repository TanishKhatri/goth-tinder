import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './models/User.js';
import { Swipe } from './models/Swipe.js';
import { Match } from './models/Match.js';
import { Message } from './models/Message.js';
import { STOCK_FEMME, STOCK_MASC } from './stockPhotos.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nocturne';

const names = [
  { firstName: 'Raven', gender: 'woman', interestedIn: ['woman', 'man'] },
  { firstName: 'Lucien', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Morgana', gender: 'woman', interestedIn: ['woman'] },
  { firstName: 'Damien', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Isolde', gender: 'woman', interestedIn: ['man'] },
  { firstName: 'Vincent', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Lilith', gender: 'woman', interestedIn: ['woman', 'man'] },
  { firstName: 'Sebastian', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Ophelia', gender: 'woman', interestedIn: ['man'] },
  { firstName: 'Dorian', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Seraphina', gender: 'woman', interestedIn: ['woman'] },
  { firstName: 'Valerius', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Belladonna', gender: 'woman', interestedIn: ['woman', 'man'] },
  { firstName: 'Caspian', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Rosalind', gender: 'woman', interestedIn: ['man'] },
  { firstName: 'Thorne', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Vesper', gender: 'nonbinary', interestedIn: ['woman', 'man'] },
  { firstName: 'Malachi', gender: 'man', interestedIn: ['woman'] },
  { firstName: 'Cordelia', gender: 'woman', interestedIn: ['woman'] },
  { firstName: 'Ambrose', gender: 'man', interestedIn: ['woman'] }
];

const bios = [
  'Midnight wanderer seeking someone to share dark poetry and red wine with.',
  'Artist of shadows. I collect antique mirrors and write verses about the moon.',
  'Vampire aesthetic, human heart. Looking for my eternal companion.',
  'Gothic literature enthusiast. My library is larger than my social circle.',
  'Professional candle lighter. I believe in magic, ghosts, and slow dances.',
  'Nocturnal by nature. Best conversations happen after 2 AM.',
  'Victorian mourning jewelry collector. Seeking someone who understands the beauty in darkness.',
  'Pianist who only plays in minor keys. Chopin is my love language.',
  'Taxidermy enthusiast with a heart of gold. Don\'t judge my moths.',
  'Witchy vibes only. Tarot, crystals, and midnight forest walks.',
  'Architecture student obsessed with gargoyles and flying buttresses.',
  'Poet of the macabre. My verses bleed ink and starlight.',
  'Vintage fashion lover. Corsets, lace, and velvet are my armor.',
  'Classical guitarist. I serenade the shadows between dusk and dawn.',
  'Horror film aficionado. The darker, the better. Let\'s watch Nosferatu.',
  'Graveyard shift nurse. I\'ve seen things. Looking for light in the dark.',
  'Midnight baker. My sourdough starter is older than most relationships.',
  'Antique book restorer. I give new life to forgotten stories.',
  'Cellist. The low notes resonate with my soul.',
  'Cryptid enthusiast. Mothman is real and I have proof.'
];

const interestsPool = [
  'gothic literature', 'vampire lore', 'dark poetry', 'vintage fashion', 'candle making',
  'tarot reading', 'midnight walks', 'classical music', 'horror films', 'taxonomy',
  'antique collecting', 'graveyard photography', 'witchcraft', 'victorian history',
  'dark academia', 'black metal', 'post-punk', 'industrial music', 'rituals',
  'shadow work', 'lunar cycles', 'crystal healing', 'herbalism', 'occult studies'
];

// Seed hubs are clustered in coastal New England (all within ~85km of each
// other) so every seeded user falls inside the default 100km maxDistance and
// the swipe deck is full and testable immediately.
const cities = [
  { city: 'Salem', lat: 42.5195, lng: -70.8967 },
  { city: 'Boston', lat: 42.3601, lng: -71.0589 },
  { city: 'Providence', lat: 41.8240, lng: -71.4128 }
];

// Goth-culture stock portraits hosted on Cloudinary (npm run upload-stock).
// women/nonbinary draw from the femme set, men from the masc set; each user
// gets 3 photos with a per-user offset so profiles look distinct. Falls back
// to generated avatars if the stock manifest is ever empty.
const DICEBEAR = (seed) =>
  `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=0a0a0d,1a1a2e,16213e`;

const stockPhotos = (gender, index) => {
  const pool = gender === 'man' ? STOCK_MASC : STOCK_FEMME;
  if (!pool.length) return [DICEBEAR(`seed-${index}`), DICEBEAR(`seed-${index}-2`), DICEBEAR(`seed-${index}-3`)];
  return [0, 1, 2].map(k => pool[(index * 2 + k) % pool.length]);
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await Promise.all([
      User.deleteMany({}),
      Swipe.deleteMany({}),
      Match.deleteMany({}),
      Message.deleteMany({})
    ]);
    console.log('Cleared existing data');
    
    const passwordHash = await bcrypt.hash('nocturne123', 12);
    const users = [];
    
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      const birthdate = randomDate(new Date(1985, 0, 1), new Date(2004, 0, 1));
      const cityData = cities[i % cities.length];
      const userInterests = interestsPool.sort(() => 0.5 - Math.random()).slice(0, 5);
      
      const user = await User.create({
        email: `${n.firstName.toLowerCase()}${i}@nocturne.test`,
        passwordHash,
        firstName: n.firstName,
        birthdate,
        gender: n.gender,
        interestedIn: n.interestedIn,
        bio: bios[i],
        photos: stockPhotos(n.gender, i),
        interests: userInterests,
        location: cityData,
        preferences: {
          minAge: 20,
          maxAge: 45,
          maxDistance: 100
        }
      });
      users.push(user);
      console.log(`Created user: ${n.firstName} (${n.gender})`);
    }
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, users.length); j++) {
        const user1 = users[i];
        const user2 = users[j];
        
        if (user2.interestedIn.includes(user1.gender) && user1.interestedIn.includes(user2.gender)) {
          if (Math.random() > 0.3) {
            const direction1 = Math.random() > 0.4 ? 'like' : 'pass';
            await Swipe.create({ swiperId: user1._id, swipedId: user2._id, direction: direction1 });
            
            if (direction1 === 'like' && Math.random() > 0.3) {
              await Swipe.create({ swiperId: user2._id, swipedId: user1._id, direction: 'like' });
              const [u1, u2] = [user1._id, user2._id].sort((a, b) => a.toString().localeCompare(b.toString()));
              const match = await Match.create({ user1Id: u1, user2Id: u2 });
              
              const msgCount = Math.floor(Math.random() * 5) + 1;
              for (let k = 0; k < msgCount; k++) {
                const sender = Math.random() > 0.5 ? user1._id : user2._id;
                await Message.create({
                  matchId: match._id,
                  senderId: sender,
                  content: ['Hey there', 'Love your profile', 'Your bio is poetic', 'Midnight walks?', 'Favorite poet?'][k % 5],
                  sentAt: new Date(match.matchedAt.getTime() + k * 3600000)
                });
              }
              console.log(`Created match: ${user1.firstName} x ${user2.firstName}`);
            } else {
              await Swipe.create({ swiperId: user2._id, swipedId: user1._id, direction: 'pass' });
            }
          }
        }
      }
    }
    
    console.log('Seed complete!');
    console.log(`Created ${users.length} users`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();