const fetch = require('node-fetch');
require('dotenv').config();

// MENA (Middle East and North Africa) locations with Arabic names
const MENA_LOCATIONS = [
  "Amman", "عمان", "Jordan", "الأردن",
  "Riyadh", "الرياض",
  "Jeddah", "جدة",
  "Dubai", "دبي", "UAE", "الإمارات",
  "Doha", "الدوحة", "Qatar", "قطر",
  "Kuwait", "الكويت",
  "Manama", "المنامة", "Bahrain", "البحرين",
  "Beirut", "بيروت", "Lebanon", "لبنان",
  "Damascus", "دمشق", "Syria", "سوريا",
  "Baghdad", "بغداد", "Iraq", "العراق",
  "Cairo", "القاهرة", "Alexandria", "الاسكندرية", "Egypt", "مصر",
  "Casablanca", "الدار البيضاء", "Rabat", "الرباط", "Morocco", "المغرب",
  "Algiers", "الجزائر", "Algeria", "الجزائر"
];

/**
 * Compute location score for prioritization
 * @param {string} jobLocation - Job location string
 * @returns {number} - Location score (higher = more priority)
 */
function computeLocationScore(jobLocation) {
  if (!jobLocation) return 0;
  
  const locationLower = jobLocation.toLowerCase();
  
  // Highest priority: Amman
  if (locationLower.includes("amman") || locationLower.includes("عمان")) {
    return 10;
  }
  
  // High priority: Jordan
  if (locationLower.includes("jordan") || locationLower.includes("الأردن")) {
    return 8;
  }
  
  // Medium priority: Other MENA locations
  for (const loc of MENA_LOCATIONS) {
    if (locationLower.includes(loc.toLowerCase())) {
      return 5;
    }
  }
  
  return 0;
}

/**
 * Internal function to fetch jobs for a single query+location combination
 * @param {string} query - Job search query
 * @param {string} location - Location for job search
 * @param {number} pages - Number of pages to fetch
 * @returns {Promise<Array>} - Array of normalized job objects
 */
async function fetchJobsQueryInternal(query, location, pages = 3) {
  try {
    const apiKey = process.env.X_RAPID_API_KEY;
    
    if (!apiKey) {
      console.error('X_RAPID_API_KEY is missing from environment variables');
      throw new Error('X_RAPID_API_KEY is not set in environment variables. Please add it to your .env file.');
    }

    console.log(`Fetching jobs: query="${query}", location="${location}", pages=${pages}`);
    console.log(`API Key present: ${apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No'}`);

    if (!query || !location) {
      throw new Error('Query and location are required');
    }

    const allJobs = [];
    const seenUrls = new Set();
    const seenJobIds = new Set();

    // Fetch multiple pages
    for (let page = 1; page <= pages; page++) {
      try {
        const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${page}&num_pages=1`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`JSearch API error on page ${page}: ${response.status} - ${errorText}`);
          
          // Handle rate limiting (429) - return special indicator
          if (response.status === 429) {
            let errorMessage = 'Rate limit exceeded';
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If JSON parsing fails, use the raw error text
              errorMessage = errorText || errorMessage;
            }
            throw { 
              type: 'RATE_LIMIT', 
              message: errorMessage,
              status: 429
            };
          }
          
          // If it's an auth error or first page error, throw to stop processing
          if (response.status === 401 || response.status === 403 || (page === 1 && response.status >= 400)) {
            throw new Error(`JSearch API error: ${response.status} - ${errorText}`);
          }
          
          // Continue to next page for other errors
          continue;
        }

        const data = await response.json();
        
        // Log response for debugging
        console.log(`JSearch API page ${page} response:`, {
          status: response.status,
          hasData: !!data.data,
          dataLength: data.data?.length || 0,
          dataKeys: Object.keys(data)
        });
        
        // Check if we have data
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
          console.log(`No more data on page ${page}, stopping pagination`);
          // No more pages available
          break;
        }

        // Normalize and deduplicate jobs from this page
        for (const job of data.data) {
          // Use job_id or apply_url for deduplication
          const jobId = job.job_id || job.job_apply_link || job.job_google_link;
          const applyUrl = job.job_apply_link || job.job_google_link || '';

          // Skip if we've seen this job before
          if (jobId && seenJobIds.has(jobId)) continue;
          if (applyUrl && seenUrls.has(applyUrl)) continue;

          // Build location string from available fields
          const locationParts = [];
          if (job.job_city) locationParts.push(job.job_city);
          if (job.job_state) locationParts.push(job.job_state);
          if (job.job_country) locationParts.push(job.job_country);
          const location = locationParts.length > 0 ? locationParts.join(', ') : '';

          // Build tags array
          let tags = [];
          if (Array.isArray(job.job_required_skills)) {
            tags = [...job.job_required_skills];
          } else if (job.job_required_skills) {
            tags = [job.job_required_skills];
          }
          
          if (Array.isArray(job.job_highlights?.skills)) {
            tags = [...tags, ...job.job_highlights.skills];
          } else if (job.job_highlights?.skills) {
            tags.push(job.job_highlights.skills);
          }
          
          if (job.job_highlights?.Qualifications) {
            tags.push(job.job_highlights.Qualifications);
          }
          
          // Remove duplicates from tags
          tags = [...new Set(tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0))];

          // Normalize the job data
          const normalizedJob = {
            title: (job.job_title || '').trim(),
            company: (job.employer_name || '').trim(),
            location: location.trim(),
            salary: job.job_salary_displayed || 
                   (job.job_max_salary && job.job_min_salary 
                     ? `$${job.job_min_salary}K - $${job.job_max_salary}K` 
                     : job.job_max_salary 
                       ? `$${job.job_max_salary}K` 
                       : job.job_min_salary 
                         ? `$${job.job_min_salary}K` 
                         : ''),
            description: (job.job_description || job.job_highlights?.summary || '').trim(),
            tags: tags,
            apply_url: applyUrl.trim(),
            posted_at: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
            source_id: job.job_id || null
          };

          // Only add if it has required fields (title, company, and a valid apply_url)
          if (normalizedJob.title && normalizedJob.company && normalizedJob.apply_url) {
            // Validate URL format
            try {
              // If URL doesn't start with http:// or https://, add https://
              if (!normalizedJob.apply_url.match(/^https?:\/\//i)) {
                normalizedJob.apply_url = 'https://' + normalizedJob.apply_url;
              }
              // Validate URL
              new URL(normalizedJob.apply_url);
              
              allJobs.push(normalizedJob);
              
              // Mark as seen
              if (jobId) seenJobIds.add(jobId);
              if (applyUrl) seenUrls.add(applyUrl);
            } catch (urlError) {
              console.warn('Skipping job due to invalid URL:', {
                title: normalizedJob.title,
                company: normalizedJob.company,
                applyUrl: normalizedJob.apply_url
              });
            }
          } else {
            console.warn('Skipping job due to missing required fields:', {
              hasTitle: !!normalizedJob.title,
              hasCompany: !!normalizedJob.company,
              hasApplyUrl: !!normalizedJob.apply_url,
              title: normalizedJob.title,
              company: normalizedJob.company
            });
          }
        }

        // Small delay between pages to avoid rate limiting
        if (page < pages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`Error fetching page ${page} from JSearch API:`, error);
        // Continue to next page instead of failing completely
        continue;
      }
    }

    console.log(`Total jobs fetched from JSearch API for location "${location}": ${allJobs.length}`);
    return allJobs;

  } catch (error) {
    // Re-throw rate limit errors so caller can handle them
    if (error.type === 'RATE_LIMIT') {
      throw error;
    }
    console.error(`Error fetching jobs from JSearch API for location "${location}":`, error);
    // Return empty array on error to allow other locations to continue
    return [];
  }
}

/**
 * Fetch jobs from JSearch API with MENA location prioritization
 * @param {string} query - Job search query (e.g., "developer", "software engineer")
 * @param {string} location - Primary location for job search (default: "Amman")
 * @param {number} pages - Number of pages to fetch per location (default: 3)
 * @returns {Promise<Array>} - Array of normalized, sorted, and deduplicated job objects
 */
async function fetchJobsFromJSearch(query, location = "Amman", pages = 3) {
  try {
    // Prioritize locations: Amman/Jordan first, then other MENA locations
    const priorityLocations = ["Amman", "عمان", "Jordan", "الأردن"];
    const otherMenaLocations = MENA_LOCATIONS.filter(loc => 
      !priorityLocations.includes(loc)
    );
    
    // Combine: priority locations first, then others, avoiding duplicates
    const allLocations = [...new Set([
      location,
      ...priorityLocations,
      ...otherMenaLocations
    ])];

    console.log(`🌍 Fetching jobs for query "${query}" across ${allLocations.length} MENA locations (prioritizing Amman/Jordan)...`);

    const results = [];
    const seenDedupKeys = new Set();
    let rateLimited = false;

    // Fetch jobs from all locations
    for (const loc of allLocations) {
      // Stop if we hit rate limit
      if (rateLimited) {
        console.log(`⏸️  Rate limit detected. Stopping location fetching. Already fetched from ${results.length > 0 ? 'some' : 'no'} locations.`);
        break;
      }

      try {
        // Use fewer pages for non-priority locations to reduce API calls
        const isPriority = priorityLocations.includes(loc) || loc === location;
        const pagesToFetch = isPriority ? pages : Math.min(pages, 1);
        
        const jobs = await fetchJobsQueryInternal(query, loc, pagesToFetch);
        
        // Add jobs with improved deduplication
        for (const job of jobs) {
          // More aggressive deduplication: title + company + location
          const dedupKey = `${job.title}-${job.company}-${job.location}`.toLowerCase();
          
          if (seenDedupKeys.has(dedupKey)) {
            continue;
          }
          
          // Also check by apply_url for additional safety
          if (job.apply_url && seenDedupKeys.has(job.apply_url.toLowerCase())) {
            continue;
          }
          
          seenDedupKeys.add(dedupKey);
          if (job.apply_url) {
            seenDedupKeys.add(job.apply_url.toLowerCase());
          }
          
          results.push(job);
        }
        
        // Increased delay between location requests to avoid rate limiting
        // Longer delay for non-priority locations
        const delay = isPriority ? 500 : 1500;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        // Check if it's a rate limit error
        if (error.type === 'RATE_LIMIT') {
          rateLimited = true;
          console.warn(`⚠️  Rate limit exceeded while fetching "${loc}". Stopping further location fetches.`);
          console.warn(`   Message: ${error.message}`);
          break;
        }
        console.error(`Error fetching jobs for location "${loc}":`, error.message);
        // Continue with next location for other errors
        continue;
      }
    }

    console.log(`📊 Collected ${results.length} unique jobs before sorting...`);

    // Compute location scores for all jobs
    for (const job of results) {
      job.location_score = computeLocationScore(job.location);
    }

    // Sort results: location score (desc), then posted date (desc), then title/company relevance
    results.sort((a, b) => {
      // Primary: Location score (higher = better)
      if (b.location_score !== a.location_score) {
        return b.location_score - a.location_score;
      }

      // Secondary: Posted date (more recent = better)
      if (b.posted_at && a.posted_at) {
        return new Date(b.posted_at) - new Date(a.posted_at);
      }
      if (b.posted_at && !a.posted_at) return -1;
      if (a.posted_at && !b.posted_at) return 1;

      // Tertiary: Title match (alphabetical for consistency)
      const titleCompare = a.title.localeCompare(b.title);
      if (titleCompare !== 0) return titleCompare;

      // Quaternary: Company match (alphabetical for consistency)
      return a.company.localeCompare(b.company);
    });

    console.log(`✅ Final: ${results.length} jobs after sorting and deduplication`);
    console.log(`   📍 Location breakdown: Amman=${results.filter(j => j.location_score === 10).length}, Jordan=${results.filter(j => j.location_score === 8).length}, Other MENA=${results.filter(j => j.location_score === 5).length}, Other=${results.filter(j => j.location_score === 0).length}`);
    
    if (rateLimited) {
      console.warn(`⚠️  Note: Rate limit was encountered. Some locations may not have been fetched.`);
    }

    return results;

  } catch (error) {
    console.error('Error in fetchJobsFromJSearch:', error);
    throw error;
  }
}

module.exports = {
  fetchJobsFromJSearch
};
