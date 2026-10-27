/**
 * Social Engagement Service
 * Automatically fetches real-time Facebook and Instagram followers and engagement metrics
 * from startup social links via the Facebook Scraper API.
 */

const API_KEY = import.meta.env.VITE_FACEBOOK_SCRAPER_API_KEY || "cd_live_VMvBF9bbnTmw9n4w-UKWbCM0FwjAfJLj";
const BASE_URL = "https://api.facebookscraperapi.com/api/v1";

// Cache duration: 1 hour in milliseconds
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Extracts a Facebook handle or numeric ID from any user-provided Facebook URL or text.
 * Examples:
 * - https://www.facebook.com/NASA/ -> NASA
 * - https://facebook.com/techcorp -> techcorp
 * - https://www.facebook.com/pages/TechCorp/100082218812038 -> 100082218812038
 * - https://www.facebook.com/profile.php?id=100082218812038&ref=ts -> 100082218812038
 * - facebook.com/mycompany -> mycompany
 * - mycompany -> mycompany
 */
export function extractFbHandle(input) {
  if (!input) return null;
  let clean = String(input).trim();
  if (!clean) return null;

  // Remove leading URL protocol and prefixes
  clean = clean.replace(/^https?:\/\//i, "").replace(/^(www\.|m\.|web\.)/i, "");
  clean = clean.replace(/^facebook\.com\/?/i, "");

  // Handle profile.php?id=XXXXX
  if (clean.includes("profile.php")) {
    const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_\-\.]+)/i);
    if (idMatch && idMatch[1]) return idMatch[1];
  }

  // Strip query parameters and hash
  clean = clean.split("?")[0].split("#")[0];

  // Split path segments
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  // Pattern: /pages/CategoryName/123456789
  if (parts[0] === "pages" && parts.length >= 2) {
    return parts[parts.length - 1];
  }

  // Pattern: /people/Name/123456789
  if (parts[0] === "people" && parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return parts[0];
}

/**
 * Extracts an Instagram username from any user-provided Instagram URL or text.
 * Examples:
 * - https://www.instagram.com/github/ -> github
 * - instagram.com/techcorp?igsh=123 -> techcorp
 * - @techcorp -> techcorp
 */
export function extractIgHandle(input) {
  if (!input) return null;
  let clean = String(input).trim();
  if (!clean) return null;

  clean = clean.replace(/^@/, "");
  clean = clean.replace(/^https?:\/\//i, "").replace(/^(www\.|m\.)/i, "");
  clean = clean.replace(/^instagram\.com\/?/i, "");

  // Strip query parameters and hash
  clean = clean.split("?")[0].split("#")[0];

  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return parts[0];
}

/**
 * Reads cached result from sessionStorage to preserve API quota
 */
function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed.data;
    }
  } catch (err) {
    console.warn("Cache read error:", err);
  }
  return null;
}

/**
 * Writes result to sessionStorage cache
 */
function setCached(key, data) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (err) {
    console.warn("Cache write error:", err);
  }
}

/**
 * Fetches real-time Facebook page engagement (followers & likes)
 * @param {string} facebookUrl - The startup's Facebook page URL or handle
 */
export async function fetchFacebookEngagement(facebookUrl) {
  const handle = extractFbHandle(facebookUrl);
  if (!handle) {
    return { followers: 0, likes: 0, success: false, message: "Invalid Facebook URL" };
  }

  const cacheKey = `fb_eng_${handle.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${BASE_URL}/facebook/page?page=${encodeURIComponent(handle)}&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return { followers: 0, likes: 0, success: false, message: "Page not found" };
    }

    const item = data.results[0];
    let followers = 0;
    let likes = 0;

    // Follower extraction
    if (item.followers) {
      followers = parseInt(String(item.followers).replace(/,/g, ""), 10) || 0;
    } else if (item.description) {
      const match = item.description.match(/([\d,\.]+)\s*(?:followers|follower)/i);
      if (match && match[1]) {
        followers = parseInt(match[1].replace(/,/g, ""), 10) || 0;
      }
    }

    // Likes extraction
    if (item.likes) {
      likes = parseInt(String(item.likes).replace(/,/g, ""), 10) || 0;
    } else if (item.description) {
      const match = item.description.match(/([\d,\.]+)\s*(?:likes|like)/i);
      if (match && match[1]) {
        likes = parseInt(match[1].replace(/,/g, ""), 10) || 0;
      }
    }

    // Fallback for likes: talking_about_count
    if (!likes && item.talking_about_count) {
      likes = parseInt(String(item.talking_about_count).replace(/,/g, ""), 10) || 0;
    }

    const result = {
      handle,
      name: item.name || item.title || handle,
      followers,
      likes,
      success: true,
    };

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[FacebookScraper] Failed to fetch Facebook engagement for ${handle}:`, error.message);
    return { followers: 0, likes: 0, success: false, error: error.message };
  }
}

/**
 * Fetches real-time Instagram audience (followers & posts)
 * @param {string} instagramUrl - The startup's Instagram page URL or handle
 */
export async function fetchInstagramEngagement(instagramUrl) {
  const username = extractIgHandle(instagramUrl);
  if (!username) {
    return { followers: 0, posts: 0, success: false, message: "Invalid Instagram URL" };
  }

  const cacheKey = `ig_eng_${username.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${BASE_URL}/instagram/profile?username=${encodeURIComponent(username)}&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const followers = data.follower_count || 0;
    const posts = data.posts_count || 0;

    const result = {
      username,
      name: data.full_name || username,
      followers,
      posts,
      success: true,
    };

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[InstagramScraper] Failed to fetch Instagram engagement for ${username}:`, error.message);
    return { followers: 0, posts: 0, success: false, error: error.message };
  }
}

/**
 * Helper to fetch both Facebook and Instagram engagement for a startup object
 * @param {object} startup - Startup entity with facebook and/or instagram properties
 */
export async function fetchStartupSocialMetrics(startup) {
  if (!startup) return { facebook: null, instagram: null };

  const [fbResult, igResult] = await Promise.all([
    startup.facebook ? fetchFacebookEngagement(startup.facebook) : Promise.resolve(null),
    startup.instagram ? fetchInstagramEngagement(startup.instagram) : Promise.resolve(null),
  ]);

  return {
    facebook: fbResult,
    instagram: igResult,
  };
}
