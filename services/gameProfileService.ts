
import { Asset, GameProject } from '../types';

export interface GameProfile {
  id: string; // Project Name
  count: number;
  avgHookStrength: number;
  topHooks: { name: string; count: number }[];
  topStyles: { name: string; count: number }[];
}

export const generateGameProfiles = (assets: Asset[]): GameProfile[] => {
  const profiles: Record<string, GameProfile> = {};

  // Initialize profiles
  Object.values(GameProject).forEach(p => {
    profiles[p] = {
      id: p,
      count: 0,
      topHooks: [],
      topStyles: [],
      avgHookStrength: 0
    };
  });

  const hooksByProject: Record<string, Record<string, number>> = {};
  const stylesByProject: Record<string, Record<string, number>> = {};
  const strengthSumByProject: Record<string, number> = {};

  assets.forEach(asset => {
    if (!asset.analysis || asset.status !== 'completed') return;
    
    const p = asset.analysis.project || GameProject.OTHER;
    // If project not in list (e.g. if type changed), default to Other
    const profileKey = Object.values(GameProject).includes(p) ? p : GameProject.OTHER;
    
    // Ensure profile exists (handle cases where GameProject enum might not cover everything if updated)
    if (!profiles[profileKey]) {
        profiles[profileKey] = { id: profileKey, count: 0, topHooks: [], topStyles: [], avgHookStrength: 0 };
    }

    profiles[profileKey].count++;
    strengthSumByProject[profileKey] = (strengthSumByProject[profileKey] || 0) + asset.analysis.marketing.hookStrength;

    // Count Hooks
    const hook = asset.analysis.marketing.hookType || 'Unknown';
    if (!hooksByProject[profileKey]) hooksByProject[profileKey] = {};
    hooksByProject[profileKey][hook] = (hooksByProject[profileKey][hook] || 0) + 1;

    // Count Styles
    const style = asset.analysis.style || 'Unknown';
    if (!stylesByProject[profileKey]) stylesByProject[profileKey] = {};
    stylesByProject[profileKey][style] = (stylesByProject[profileKey][style] || 0) + 1;
  });

  return Object.values(profiles).map(profile => {
    const p = profile.id;
    
    // Calculate Stats
    if (profile.count > 0) {
        // Sort Hooks
        profile.topHooks = Object.entries(hooksByProject[p] || {})
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

        // Sort Styles
        profile.topStyles = Object.entries(stylesByProject[p] || {})
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

        profile.avgHookStrength = Math.round(strengthSumByProject[p] / profile.count);
    }

    return profile;
  }).sort((a, b) => b.count - a.count); // Sort by volume descending
};
