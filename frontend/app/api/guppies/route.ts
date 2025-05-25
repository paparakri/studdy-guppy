// app/api/guppies/route.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { s3Client } from '@/lib/aws-config';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface Guppy {
  id: string;
  type: "common" | "rare" | "epic" | "legendary" | "shiny";
  x: number;
  y: number;
  direction: number;
  speed: number;
  color: string;
  size: number;
  earnedAt: string;
  earnedFromMinutes: number;
}

interface GuppyData {
  userId: string;
  fish: Guppy[];
  totalStudyTime: number; // in minutes
  totalGuppies: number;
  lastRewardTime: string;
  studyStreak: number;
  lastStudyDate: string;
  createdAt: string;
  updatedAt: string;
}

const FISH_TYPES = {
  common: { color: "#60A5FA", rarity: "Common", chance: 0.6, minutesRequired: 15 },
  rare: { color: "#A855F7", rarity: "Rare", chance: 0.25, minutesRequired: 30 },
  epic: { color: "#EF4444", rarity: "Epic", chance: 0.1, minutesRequired: 60 },
  legendary: { color: "#F59E0B", rarity: "Legendary", chance: 0.04, minutesRequired: 120 },
  shiny: { color: "#10B981", rarity: "Shiny", chance: 0.01, minutesRequired: 180 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';

    const guppyData = await getGuppyData(userId);
    
    return NextResponse.json({
      success: true,
      data: guppyData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get guppies error:', error);
    return NextResponse.json(
      { error: 'Failed to get guppy data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, studyMinutes } = await request.json();

    if (!userId || !studyMinutes) {
      return NextResponse.json(
        { error: 'userId and studyMinutes are required' },
        { status: 400 }
      );
    }

    // Get current guppy data
    let guppyData = await getGuppyData(userId);
    
    // Update study time
    guppyData.totalStudyTime += studyMinutes;
    guppyData.updatedAt = new Date().toISOString();
    
    // Update study streak
    const today = new Date().toDateString();
    const lastStudyDate = new Date(guppyData.lastStudyDate).toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (lastStudyDate === today) {
      // Same day, keep streak
    } else if (lastStudyDate === yesterday) {
      // Consecutive day, increment streak
      guppyData.studyStreak += 1;
    } else {
      // Streak broken, reset to 1
      guppyData.studyStreak = 1;
    }
    guppyData.lastStudyDate = new Date().toISOString();

    // Calculate new guppies to award
    const newGuppies = calculateGuppyRewards(guppyData, studyMinutes);
    
    // Add new guppies to the aquarium
    guppyData.fish.push(...newGuppies);
    guppyData.totalGuppies = guppyData.fish.length;
    guppyData.lastRewardTime = new Date().toISOString();

    // Save updated data
    await saveGuppyData(guppyData);

    return NextResponse.json({
      success: true,
      data: guppyData,
      newGuppies: newGuppies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update guppies error:', error);
    return NextResponse.json(
      { error: 'Failed to update guppy data' },
      { status: 500 }
    );
  }
}

async function getGuppyData(userId: string): Promise<GuppyData> {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: `guppies/${userId}-guppy-data.json`
    }));

    const data = await response.Body?.transformToString();
    return data ? JSON.parse(data) : createInitialGuppyData(userId);
  } catch (error) {
    console.log('No existing guppy data found, creating new');
    return createInitialGuppyData(userId);
  }
}

async function saveGuppyData(guppyData: GuppyData): Promise<void> {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `guppies/${guppyData.userId}-guppy-data.json`,
    Body: JSON.stringify(guppyData, null, 2),
    ContentType: 'application/json'
  }));
}

function createInitialGuppyData(userId: string): GuppyData {
  return {
    userId,
    fish: [],
    totalStudyTime: 0,
    totalGuppies: 0,
    lastRewardTime: new Date().toISOString(),
    studyStreak: 0,
    lastStudyDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function calculateGuppyRewards(guppyData: GuppyData, studyMinutes: number): Guppy[] {
  const newGuppies: Guppy[] = [];
  
  // Base reward: 1 common guppy per 15 minutes of study
  const commonGuppiesEarned = Math.floor(studyMinutes / FISH_TYPES.common.minutesRequired);
  
  for (let i = 0; i < commonGuppiesEarned; i++) {
    newGuppies.push(createGuppy("common", studyMinutes));
  }
  
  // Rare rewards based on total study time milestones
  const totalMinutes = guppyData.totalStudyTime + studyMinutes;
  const previousTotal = guppyData.totalStudyTime;
  
  // Check for milestone rewards
  const milestones = [
    { minutes: 30, type: "rare" as const },
    { minutes: 60, type: "rare" as const },
    { minutes: 120, type: "epic" as const },
    { minutes: 180, type: "epic" as const },
    { minutes: 300, type: "legendary" as const },
    { minutes: 480, type: "legendary" as const },
    { minutes: 600, type: "shiny" as const }
  ];
  
  milestones.forEach(milestone => {
    if (totalMinutes >= milestone.minutes && previousTotal < milestone.minutes) {
      newGuppies.push(createGuppy(milestone.type, studyMinutes));
    }
  });
  
  // Streak bonuses
  if (guppyData.studyStreak >= 3 && guppyData.studyStreak % 3 === 0) {
    newGuppies.push(createGuppy("rare", studyMinutes));
  }
  
  if (guppyData.studyStreak >= 7) {
    newGuppies.push(createGuppy("epic", studyMinutes));
  }
  
  // Random chance for special fish during long study sessions (30+ minutes)
  if (studyMinutes >= 30) {
    if (Math.random() < 0.1) { // 10% chance
      newGuppies.push(createGuppy("rare", studyMinutes));
    }
    if (Math.random() < 0.05) { // 5% chance
      newGuppies.push(createGuppy("epic", studyMinutes));
    }
    if (Math.random() < 0.02) { // 2% chance
      newGuppies.push(createGuppy("legendary", studyMinutes));
    }
    if (Math.random() < 0.005) { // 0.5% chance
      newGuppies.push(createGuppy("shiny", studyMinutes));
    }
  }
  
  return newGuppies;
}

function createGuppy(type: keyof typeof FISH_TYPES, studyMinutes: number): Guppy {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    x: Math.random() * 80 + 10,
    y: Math.random() * 60 + 20,
    direction: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.8 + 0.4,
    color: FISH_TYPES[type].color,
    size: type === "legendary" ? 2 : type === "shiny" ? 1.8 : type === "epic" ? 1.5 : 1.2,
    earnedAt: new Date().toISOString(),
    earnedFromMinutes: studyMinutes
  };
}