
import { PackageType, User } from "../types";

/**
 * AI Logic for Pick4U
 * Handles: Pricing recommendations, Risk Assessment, and Matching
 */

// 1. Smart Pricing Recommendation
export const getAiPriceRecommendation = (packageType: PackageType, distanceKm: number = 1): { price: number, reason: string } => {
  let basePrice = 15;
  
  if (packageType === PackageType.MEDIUM) basePrice += 5;
  if (packageType === PackageType.LARGE) basePrice += 15;
  
  // Distance factor
  if (distanceKm > 5) basePrice += 10;

  return {
    price: basePrice,
    reason: `בהתבסס על גודל (${packageType}) ומרחק, המחיר המומלץ הוא ₪${basePrice}.`
  };
};

// 2. Risk Engine - Detecting Rogue Collectors
export const analyzeUserRisk = (user: User): { isSafe: boolean; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; badges: string[] } => {
  const badges: string[] = [];
  
  // Logic for High Risk (Rogue Collector)
  if (user.rating < 4.0 && user.rating > 0) {
    return { isSafe: false, riskLevel: 'HIGH', badges: [] };
  }

  // Logic for Elite/Safe Collector
  if (user.rating >= 4.8 && user.karma > 500) {
    badges.push('AI Verified');
    badges.push('Top Rated');
    return { isSafe: true, riskLevel: 'LOW', badges };
  }

  return { isSafe: true, riskLevel: 'MEDIUM', badges: [] };
};

// 3. Matchmaking - Filter logic for Universal vs Local
export const shouldShowRequestToUser = (
  user: User, 
  requestCommunity: string, 
  requestCity: string, 
  currentSimulatedLocationCity: string
): boolean => {
  
  // Case A: User is a Universal Collector
  // Show requests if they are in the User's CURRENT location (simulated), regardless of home community
  if (user.isUniversalCollector) {
    return requestCity === currentSimulatedLocationCity;
  }

  // Case B: Regular User
  // Show requests only from their registered community
  return user.community === requestCommunity;
};
