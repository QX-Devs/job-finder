const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Fetch jobs from JSearch API with pagination support
 * @param {string} query - Job search query (e.g., "developer", "software engineer")
 * @param {string} location - Location for job search (e.g., "chicago", "new york")
 * @param {number} pages - Number of pages to fetch (default: 3)
 * @returns {Promise<Array>} - Array of normalized job objects with duplicates removed
 */
async function fetchJobsFromJSearch(query, location, pages = 3) {
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

          // Normalize the job data
          const normalizedJob = {
            title: job.job_title || '',
            company: job.employer_name || '',
            location: job.job_city || job.job_state || job.job_country || '',
            salary: job.job_salary_displayed || 
                   (job.job_max_salary && job.job_min_salary 
                     ? `$${job.job_min_salary}K - $${job.job_max_salary}K` 
                     : job.job_max_salary 
                       ? `$${job.job_max_salary}K` 
                       : job.job_min_salary 
                         ? `$${job.job_min_salary}K` 
                         : ''),
            description: job.job_description || job.job_highlights?.summary || '',
            tags: job.job_required_skills || 
                  job.job_highlights?.skills || 
                  (job.job_highlights?.Qualifications ? [job.job_highlights.Qualifications] : []) ||
                  [],
            apply_url: applyUrl,
            posted_at: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null,
            source_id: job.job_id || null
          };

          // Only add if it has required fields
          if (normalizedJob.title && normalizedJob.company && normalizedJob.apply_url) {
            allJobs.push(normalizedJob);
            
            // Mark as seen
            if (jobId) seenJobIds.add(jobId);
            if (applyUrl) seenUrls.add(applyUrl);
          } else {
            console.warn('Skipping job due to missing required fields:', {
              hasTitle: !!normalizedJob.title,
              hasCompany: !!normalizedJob.company,
              hasApplyUrl: !!normalizedJob.apply_url
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

    console.log(`Total jobs fetched from JSearch API: ${allJobs.length}`);
    return allJobs;

  } catch (error) {
    console.error('Error fetching jobs from JSearch API:', error);
    throw error;
  }
}

module.exports = {
  fetchJobsFromJSearch
};
