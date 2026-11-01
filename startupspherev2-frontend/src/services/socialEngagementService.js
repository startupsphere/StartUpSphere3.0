import { getBackendUrl } from "../config/apiConfig";

/**
 * Social Engagement Service
 * Automatically fetches real-time Facebook and Instagram followers and engagement metrics
 * from startup social links via backend proxy or Vite dev proxy to eliminate CORS restrictions.
 */

const API_KEY = import.meta.env.VITE_FACEBOOK_SCRAPER_API_KEY || "cd_live_VMvBF9bbnTmw9n4w-UKWbCM0FwjAfJLj";
const PROXY_URL = "/social-proxy/api/v1";
const DIRECT_URL = "https://api.facebookscraperapi.com/api/v1";

// Cache duration: 1 hour in milliseconds
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Extracts a Facebook handle or numeric ID from any user-provided Facebook URL or text.
 * Strictly verifies the link belongs to Facebook and is not another website.
 */
export function extractFbHandle(input) {
  if (!input) return null;
  let clean = String(input).trim();
  if (!clean) return null;

  // If it's a URL, verify it is indeed Facebook
  if (/^https?:\/\//i.test(clean)) {
    if (!/^https?:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me)\//i.test(clean)) {
      return null;
    }
  } else if (/^(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me)\//i.test(clean)) {
    // fine
  } else if (clean.includes(".com") || clean.includes(".org") || clean.includes(".net") || clean.includes("/") || clean.includes("http")) {
    return null;
  }

  // Remove leading URL protocol and prefixes
  clean = clean.replace(/^https?:\/\//i, "").replace(/^(www\.|m\.|web\.)/i, "");
  clean = clean.replace(/^(facebook\.com|fb\.com|fb\.me)\/?/i, "");

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
 * Validates whether a given Facebook URL corresponds to an existing, accessible public page.
 * Returns { exists: boolean, message: string, name?: string, followers?: number, likes?: number, data?: object }
 */
export async function validateFacebookPage(facebookUrl) {
  if (!facebookUrl || !facebookUrl.trim()) {
    return { exists: false, message: "Facebook URL is empty" };
  }

  const handle = extractFbHandle(facebookUrl);
  if (!handle) {
    return {
      exists: false,
      message: "Please enter a valid Facebook URL (e.g., https://www.facebook.com/your-page)",
    };
  }

  try {
    const data = await fetchFacebookEngagement(facebookUrl);
    if (!data || !data.success) {
      return {
        exists: false,
        message: data?.message || "Facebook page could not be found or is not public.",
      };
    }

    return {
      exists: true,
      name: data.name || handle,
      followers: data.followers || 0,
      likes: data.likes || 0,
      message: `Verified: ${data.name || handle} (${(data.followers || 0).toLocaleString()} followers)`,
      data,
    };
  } catch (err) {
    return {
      exists: false,
      message: "Unable to reach Facebook to verify this page.",
    };
  }
}

/**
 * Extracts an Instagram username from any user-provided Instagram URL or text.
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
 * Prioritizes backend endpoint -> Vite proxy -> Direct API
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

  // 1. Try Configured Backend API first (avoids CORS completely)
  const backendCandidates = [
    `${getBackendUrl()}/api/social/facebook?url=${encodeURIComponent(facebookUrl)}`,
    `https://startupsphere30-production.up.railway.app/api/social/facebook?url=${encodeURIComponent(facebookUrl)}`,
  ];

  for (const backendEndpoint of backendCandidates) {
    try {
      const backendRes = await fetch(backendEndpoint, { method: "GET" });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.success && (data.followers > 0 || data.likes > 0)) {
          setCached(cacheKey, data);
          return data;
        }
      }
    } catch (e) {
      console.debug(`[SocialService] Endpoint ${backendEndpoint} not reachable, trying next...`, e.message);
    }
  }

  // 2. Try Vite /social-proxy or Direct API
  const urlsToTry = [
    `${PROXY_URL}/facebook/page?page=${encodeURIComponent(handle)}&api_key=${API_KEY}`,
    `${DIRECT_URL}/facebook/page?page=${encodeURIComponent(handle)}&api_key=${API_KEY}`,
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.results || data.results.length === 0) continue;

      const item = data.results[0];
      let followers = 0;
      let likes = 0;

      if (item.followers) {
        followers = parseInt(String(item.followers).replace(/,/g, ""), 10) || 0;
      } else if (item.description) {
        const match = item.description.match(/([\d,\.]+)\s*(?:followers|follower)/i);
        if (match && match[1]) {
          followers = parseInt(match[1].replace(/,/g, ""), 10) || 0;
        }
      }

      if (item.likes) {
        likes = parseInt(String(item.likes).replace(/,/g, ""), 10) || 0;
      } else if (item.description) {
        const match = item.description.match(/([\d,\.]+)\s*(?:likes|like)/i);
        if (match && match[1]) {
          likes = parseInt(match[1].replace(/,/g, ""), 10) || 0;
        }
      }

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
    } catch (err) {
      console.warn(`[SocialService] Proxy fetch attempt failed for ${url}:`, err.message);
    }
  }

  return { followers: 0, likes: 0, success: false, message: "Could not fetch Facebook page stats" };
}

/**
 * Fetches real-time Instagram audience (followers & posts)
 * Prioritizes backend endpoint -> Vite proxy -> Direct API
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

  // 1. Try Configured Backend API first (avoids CORS completely)
  const backendCandidates = [
    `${getBackendUrl()}/api/social/instagram?url=${encodeURIComponent(instagramUrl)}`,
    `https://startupsphere30-production.up.railway.app/api/social/instagram?url=${encodeURIComponent(instagramUrl)}`,
  ];

  for (const backendEndpoint of backendCandidates) {
    try {
      const backendRes = await fetch(backendEndpoint, { method: "GET" });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.success && (data.followers > 0 || data.posts > 0)) {
          setCached(cacheKey, data);
          return data;
        }
      }
    } catch (e) {
      console.debug(`[SocialService] Endpoint ${backendEndpoint} not reachable, trying next...`, e.message);
    }
  }

  // 2. Try Vite /social-proxy or Direct API
  const urlsToTry = [
    `${PROXY_URL}/instagram/profile?username=${encodeURIComponent(username)}&api_key=${API_KEY}`,
    `${DIRECT_URL}/instagram/profile?username=${encodeURIComponent(username)}&api_key=${API_KEY}`,
  ];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

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
    } catch (err) {
      console.warn(`[SocialService] Instagram proxy fetch attempt failed for ${url}:`, err.message);
    }
  }

  return { followers: 0, posts: 0, success: false, message: "Could not fetch Instagram stats" };
}

/**
 * Helper to fetch both Facebook and Instagram engagement for a startup object
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
