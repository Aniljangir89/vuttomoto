import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Bike Auction Platform Database...');

  // Reset existing data
  await prisma.bid.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.motorcycle.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@auction.com',
      passwordHash: defaultPasswordHash,
      name: 'Apex Admin',
      role: 'ADMIN'
    }
  });

  const seller = await prisma.user.create({
    data: {
      email: 'seller@auction.com',
      passwordHash: defaultPasswordHash,
      name: 'Moto Garage Co.',
      role: 'SELLER'
    }
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: 'buyer1@auction.com',
      passwordHash: defaultPasswordHash,
      name: 'Alex Rivera (Buyer)',
      role: 'BUYER'
    }
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@auction.com',
      passwordHash: defaultPasswordHash,
      name: 'Elena Rostova (Collector)',
      role: 'BUYER'
    }
  });

  console.log('Users created:', { admin: admin.email, seller: seller.email, buyer1: buyer1.email, buyer2: buyer2.email });

  const now = new Date();
  const endIn30Mins = new Date(now.getTime() + 30 * 60 * 1000);
  const endIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const startIn1Hour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const endIn24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endedYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Bike 1: Ducati Panigale V4 S
  const ducati = await prisma.motorcycle.create({
    data: {
      make: 'Ducati',
      model: 'Panigale V4 S',
      year: 2023,
      mileage: 1850,
      engineCc: 1103,
      condition: 'Mint',
      titleStatus: 'Clean',
      sellerId: seller.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80'
      ]),
      specsJson: JSON.stringify({
        horsepower: '215 HP',
        torque: '124 Nm',
        weight: '195.5 kg (Curbside)',
        topSpeed: '300+ km/h',
        exhaust: 'Akrapovič Full Titanium',
        brakes: 'Brembo Stylema R',
        suspension: 'Öhlins NPX 25/30 Pressurized'
      })
    }
  });

  const auc1 = await prisma.auction.create({
    data: {
      motorcycleId: ducati.id,
      title: '2023 Ducati Panigale V4 S - Akrapovič Exhaust & Track Pack',
      description: 'Meticulously maintained Ducati Panigale V4 S. Pristine condition with zero track time. Fitted with Akrapovič titanium racing line, carbon fiber winglets, and Öhlins active suspension.',
      startingBid: 18000,
      reservePrice: 24000,
      minBidIncrement: 250,
      currentBid: 22500,
      winningUserId: buyer2.id,
      status: 'LIVE',
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      endTime: endIn30Mins,
      antiSnipeSeconds: 120
    }
  });

  // Add initial bids for Auction 1
  await prisma.bid.createMany({
    data: [
      { auctionId: auc1.id, userId: buyer1.id, amount: 18500, timestamp: new Date(now.getTime() - 90 * 60 * 1000) },
      { auctionId: auc1.id, userId: buyer2.id, amount: 20000, timestamp: new Date(now.getTime() - 60 * 60 * 1000) },
      { auctionId: auc1.id, userId: buyer1.id, amount: 21000, timestamp: new Date(now.getTime() - 30 * 60 * 1000) },
      { auctionId: auc1.id, userId: buyer2.id, amount: 22500, timestamp: new Date(now.getTime() - 10 * 60 * 1000) }
    ]
  });

  // Bike 2: BMW S1000RR M Package
  const bmw = await prisma.motorcycle.create({
    data: {
      make: 'BMW',
      model: 'S1000RR M Package',
      year: 2024,
      mileage: 420,
      engineCc: 999,
      condition: 'Mint',
      titleStatus: 'Clean',
      sellerId: seller.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=1200&q=80'
      ]),
      specsJson: JSON.stringify({
        horsepower: '205 HP',
        torque: '113 Nm',
        weight: '193.5 kg',
        topSpeed: '303 km/h',
        wheels: 'M Carbon Wheels',
        electronics: 'BMW Dynamic Damping Control'
      })
    }
  });

  const auc2 = await prisma.auction.create({
    data: {
      motorcycleId: bmw.id,
      title: '2024 BMW S1000RR M Package - Carbon Wheels & M Endurance Chain',
      description: 'Brand new 2024 BMW S1000RR equipped with factory M Package, carbon fiber wheels, lightweight battery, and dynamic brake control.',
      startingBid: 16000,
      reservePrice: 21000,
      minBidIncrement: 200,
      currentBid: 19400,
      winningUserId: buyer1.id,
      status: 'LIVE',
      startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      endTime: endIn2Hours,
      antiSnipeSeconds: 120
    }
  });

  await prisma.bid.createMany({
    data: [
      { auctionId: auc2.id, userId: buyer2.id, amount: 17000, timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
      { auctionId: auc2.id, userId: buyer1.id, amount: 18200, timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { auctionId: auc2.id, userId: buyer2.id, amount: 19000, timestamp: new Date(now.getTime() - 45 * 60 * 1000) },
      { auctionId: auc2.id, userId: buyer1.id, amount: 19400, timestamp: new Date(now.getTime() - 15 * 60 * 1000) }
    ]
  });

  // Bike 3: Kawasaki Ninja H2 Carbon
  const kawasaki = await prisma.motorcycle.create({
    data: {
      make: 'Kawasaki',
      model: 'Ninja H2 Carbon',
      year: 2022,
      mileage: 3100,
      engineCc: 998,
      condition: 'Excellent',
      titleStatus: 'Clean',
      sellerId: seller.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80'
      ]),
      specsJson: JSON.stringify({
        horsepower: '228 HP (Supercharged)',
        torque: '141.7 Nm',
        weight: '238 kg',
        topSpeed: '337 km/h',
        supercharger: 'Kawasaki In-House Centrifugal Supercharger'
      })
    }
  });

  await prisma.auction.create({
    data: {
      motorcycleId: kawasaki.id,
      title: '2022 Kawasaki Ninja H2 Carbon - Supercharged Beast #042/120',
      description: 'Limited edition Supercharged H2 with carbon fiber front cowl, mirror-finish silver paint, Brembo Stylema calipers, and quickshifter.',
      startingBid: 25000,
      reservePrice: 32000,
      minBidIncrement: 500,
      currentBid: 25000,
      status: 'SCHEDULED',
      startTime: startIn1Hour,
      endTime: endIn24Hours,
      antiSnipeSeconds: 120
    }
  });

  // Bike 4: Yamaha YZF-R1M
  const yamaha = await prisma.motorcycle.create({
    data: {
      make: 'Yamaha',
      model: 'YZF-R1M',
      year: 2021,
      mileage: 4800,
      engineCc: 998,
      condition: 'Excellent',
      titleStatus: 'Clean',
      sellerId: seller.id,
      imagesJson: JSON.stringify([
        'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80'
      ]),
      specsJson: JSON.stringify({
        horsepower: '200 HP',
        torque: '113.3 Nm',
        suspension: 'Öhlins Electronic Racing Suspension (ERS)',
        fairings: 'Full Carbon Fiber Bodywork'
      })
    }
  });

  await prisma.auction.create({
    data: {
      motorcycleId: yamaha.id,
      title: '2021 Yamaha YZF-R1M - Full Carbon Body & Öhlins ERS',
      description: 'Factory original R1M with carbon fiber bodywork, Öhlins electronic suspension, and telemetry data logger.',
      startingBid: 14000,
      reservePrice: 17500,
      minBidIncrement: 200,
      currentBid: 18500,
      winningUserId: buyer2.id,
      status: 'SOLD',
      startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      endTime: endedYesterday,
      antiSnipeSeconds: 120
    }
  });

  console.log('Database successfully seeded with realistic motorcycles, auctions, and bids!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
