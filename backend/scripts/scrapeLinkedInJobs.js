const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Op } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Try to load DB models, but don't crash if not available (for standalone testing)
let Job = null;
try {
    const models = require('../models');
    Job = models.Job;
} catch (e) {
    console.warn('Database models not found or failed to load. DB saving will be disabled.');
}

// --- CAREER QUERIES LIST ---
const CAREER_QUERIES = [
    'Backend Developer',
    'Frontend Developer',
    'Software Engineer',
    'Full Stack Developer',
    'React Developer',
    'Node.js Developer',
    'Python Developer',
    'Java Developer',
    'Product Manager',
    'Project Manager',
    'UI/UX Designer',
    'Graphic Designer',
    'System Administrator',
    'Network Engineer',
    'Cybersecurity Analyst',
    'Cloud Engineer',
    'Database Administrator',
    'Business Analyst',
    'Technical Writer',
    'IT Support',
    'Web Developer',
    'Software Developer',
    'Angular Developer',
    'Vue.js Developer'
];

// --- CONFIGURATION ---
const CONFIG = {
    PAGE_TIMEOUT: 60000,
    COOKIES_FILE: path.join(__dirname, '..', 'LinkedIN_MD.json'),
    BASE_SEARCH_URL: 'https://www.linkedin.com/jobs/search/?f_TPR=r604800&geoId=103710677&keywords={QUERY}&location=Jordan&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true',
    JOB_DETAIL_URL: 'https://www.linkedin.com/jobs/view/{JOB_ID}/',
    JOBS_PER_PAGE: 25,
};

const MAX_DESCRIPTION_LENGTH = 8000;

// --- HELPER FUNCTIONS ---

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- INTERACTIVE PROMPT ---
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function selectCareerQuery() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 AVAILABLE CAREER QUERIES');
    console.log('='.repeat(60));
    
    CAREER_QUERIES.forEach((query, index) => {
        console.log(`  ${(index + 1).toString().padStart(2, ' ')}. ${query}`);
    });
    
    console.log('='.repeat(60));
    
    const answer = await askQuestion('\n🔢 Input your query number: ');
    const num = parseInt(answer, 10);
    
    if (isNaN(num) || num < 1 || num > CAREER_QUERIES.length) {
        console.log('❌ Invalid selection. Using default: Software Developer');
        return 'Software Developer';
    }
    
    const selected = CAREER_QUERIES[num - 1];
    console.log(`\n✅ Selected: ${selected}\n`);
    return selected;
}

// --- COOKIES LOADER ---
function loadCookies() {
    try {
        const cookiesPath = CONFIG.COOKIES_FILE;
        if (!fs.existsSync(cookiesPath)) {
            console.warn('⚠️ Cookies file not found at:', cookiesPath);
            return null;
        }
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        console.log(`🍪 Loaded ${cookies.length} cookies from file`);
        return cookies;
    } catch (e) {
        console.error('❌ Failed to load cookies:', e.message);
        return null;
    }
}

// Convert cookies to Playwright format
function convertCookiesToPlaywright(cookies) {
    return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        expires: cookie.expirationDate || -1,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: cookie.sameSite === 'no_restriction' ? 'None' : (cookie.sameSite || 'Lax')
    }));
}

// --- HTML PARSING FUNCTIONS ---

/**
 * Parse number of pages from HTML
 * Looking for: <p class="jobs-search-pagination__page-state">Page 1 of 4</p>
 */
function parseTotalPages(html) {
    // Try to find pagination info
    const paginationMatch = html.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
    if (paginationMatch) {
        return parseInt(paginationMatch[2], 10);
    }
    
    // Alternative: look for total results count in the JSON data
    const totalResultsMatch = html.match(/"totalResultCount"\s*:\s*(\d+)/);
    if (totalResultsMatch) {
        const totalResults = parseInt(totalResultsMatch[1], 10);
        return Math.ceil(totalResults / CONFIG.JOBS_PER_PAGE);
    }
    
    // Default to 1 page if we can't find pagination
    return 1;
}

/**
 * Parse job URLs and IDs from search page HTML
 * Looking for: href="/jobs/view/4319099076/..."
 */
function parseJobsFromSearchPage(html) {
    const jobs = [];
    const seenIds = new Set();
    
    // Pattern 1: Match job URLs with IDs - /jobs/view/{jobId}/
    const urlPattern = /href="\/jobs\/view\/(\d+)\/?[^"]*"/g;
    let match;
    
    while ((match = urlPattern.exec(html)) !== null) {
        const jobId = match[1];
        if (!seenIds.has(jobId)) {
            seenIds.add(jobId);
            
            // Try to find the title for this job
            // Looking for pattern near the job ID: jobPostingTitle":"Title Here"
            const titlePattern = new RegExp(`"entityUrn"\\s*:\\s*"urn:li:fsd_jobPosting:${jobId}"[^}]*"title"\\s*:\\s*"([^"]+)"`, 'i');
            const titleMatch = html.match(titlePattern);
            
            // Alternative title pattern
            const altTitlePattern = new RegExp(`jobPostingTitle"\\s*:\\s*"([^"]+)"[^}]*${jobId}`, 'i');
            const altTitleMatch = html.match(altTitlePattern);
            
            let title = 'Unknown Title';
            if (titleMatch) {
                title = decodeHTMLEntities(titleMatch[1]);
            } else if (altTitleMatch) {
                title = decodeHTMLEntities(altTitleMatch[1]);
            }
            
            jobs.push({
                jobId,
                url: `/jobs/view/${jobId}/`,
                title
            });
        }
    }
    
    // Also try to extract from JSON data blocks
    const jsonPattern = /"urn:li:fsd_jobPosting:(\d+)"[^}]*"title"\s*:\s*"([^"]+)"/g;
    while ((match = jsonPattern.exec(html)) !== null) {
        const jobId = match[1];
        if (!seenIds.has(jobId)) {
            seenIds.add(jobId);
            jobs.push({
                jobId,
                url: `/jobs/view/${jobId}/`,
                title: decodeHTMLEntities(match[2])
            });
        }
    }
    
    return jobs;
}

/**
 * Parse job details from job detail page HTML
 */
function parseJobDetails(html, jobId, debug = false) {
    const job = {
        jobId,
        title: '',
        company: '',
        location: '',
        postedAt: '',
        applicants: '',
        description: '',
        easyApply: false,
        applyUrl: '',
        source: 'LinkedIn',
        workplaceType: null
    };
    
    // Save HTML for debugging if needed
    if (debug) {
        const debugPath = path.join(__dirname, '..', 'generated', `debug_job_${jobId}.html`);
        fs.writeFileSync(debugPath, html);
        console.log(`\n   [DEBUG] Saved HTML to ${debugPath}`);
    }
    
    // Parse title - multiple patterns
    // Pattern 1: jobPostingTitle":"Title"
    let titleMatch = html.match(/jobPostingTitle"\s*:\s*"([^"]+)"/);
    if (!titleMatch) {
        // Pattern 2: "title":"Title" near jobPosting
        titleMatch = html.match(/"title"\s*:\s*"([^"]+)"[^}]*"entityUrn"\s*:\s*"urn:li:fsd_jobPosting/);
    }
    if (!titleMatch) {
        // Pattern 3: Look in topCard title
        titleMatch = html.match(/top-card-layout__title[^>]*>([^<]+)</);
    }
    if (!titleMatch) {
        // Pattern 4: h1 with job title class
        titleMatch = html.match(/<h1[^>]*class="[^"]*job[^"]*title[^"]*"[^>]*>([^<]+)</i);
    }
    if (!titleMatch) {
        // Pattern 5: Any h1 tag that looks like a title
        titleMatch = html.match(/<h1[^>]*>([^<]{5,100})</);
    }
    if (titleMatch) {
        job.title = decodeHTMLEntities(titleMatch[1]).trim();
    }
    
    // Parse description - multiple patterns
    // Pattern 1: "description":{"textDirection":"USER_LOCALE","text":"..."
    let descMatch = html.match(/"description"\s*:\s*\{\s*"textDirection"\s*:\s*"[^"]*"\s*,\s*"text"\s*:\s*"([\s\S]*?)"\s*,\s*"attributesV2/);
    if (!descMatch) {
        // Pattern 2: description text without attributesV2
        descMatch = html.match(/"description"\s*:\s*\{\s*"textDirection"\s*:\s*"[^"]*"\s*,\s*"text"\s*:\s*"([\s\S]*?)"/);
    }
    if (!descMatch) {
        // Pattern 3: jobs-description-content div
        descMatch = html.match(/jobs-description-content[^>]*>([\s\S]*?)<\/div>/);
    }
    if (descMatch) {
        job.description = decodeHTMLEntities(descMatch[1])
            .replace(/\\n/g, '\n')
            .replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
                return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
            });
        
        // Truncate if too long
        if (job.description.length > MAX_DESCRIPTION_LENGTH) {
            job.description = job.description.substring(0, MAX_DESCRIPTION_LENGTH);
        }
    }
    
    // Parse company, location, posted time, applicants from tertiaryDescription
    // Pattern: FIRST_STRONG","text":"EMEA · 2 days ago · Over 100 applicants...
    const tertiaryMatch = html.match(/FIRST_STRONG"\s*,\s*"text"\s*:\s*"([^"]+)"/);
    if (tertiaryMatch) {
        const tertiaryText = decodeHTMLEntities(tertiaryMatch[1]);
        const parts = tertiaryText.split('·').map(p => p.trim());
        
        if (parts.length >= 1) job.location = parts[0];
        if (parts.length >= 2) job.postedAt = parts[1];
        if (parts.length >= 3) job.applicants = parts[2];
    }
    
    // Parse company name - multiple patterns
    // Pattern 1: primaryDescription
    let companyMatch = html.match(/primaryDescription"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]+)"/);
    if (!companyMatch) {
        // Pattern 2: company name from entity
        companyMatch = html.match(/"name"\s*:\s*"([^"]+)"[^}]*"entityUrn"\s*:\s*"urn:li:fsd_company:/);
    }
    if (!companyMatch) {
        // Pattern 3: companyName field
        companyMatch = html.match(/"companyName"\s*:\s*"([^"]+)"/);
    }
    if (!companyMatch) {
        // Pattern 4: top-card company link
        companyMatch = html.match(/top-card-layout__company[^>]*>([^<]+)</);
    }
    if (!companyMatch) {
        // Pattern 5: company in subtitle
        companyMatch = html.match(/subtitle[^>]*>([^<·]+)/);
    }
    if (companyMatch) {
        job.company = decodeHTMLEntities(companyMatch[1]).trim();
    }
    
    // Easy Apply will be determined by button text check (not from HTML parsing)
    // Default to false - will be set by checkApplyButton method
    job.easyApply = false;
    
    // Extract workplace type (Remote, On-site, Hybrid)
    // Pattern 1: "workplaceTypeEnum":"REMOTE"
    const workplaceTypeMatch = html.match(/"workplaceTypeEnum"\s*:\s*"(REMOTE|ON_SITE|HYBRID)"/i);
    if (workplaceTypeMatch) {
        const workplaceEnum = workplaceTypeMatch[1].toUpperCase();
        if (workplaceEnum === 'REMOTE') {
            job.workplaceType = 'Remote';
        } else if (workplaceEnum === 'ON_SITE') {
            job.workplaceType = 'On-site';
        } else if (workplaceEnum === 'HYBRID') {
            job.workplaceType = 'Hybrid';
        }
    }
    
    // Pattern 2: "localizedName":"Remote" near workplaceType
    if (!job.workplaceType) {
        const localizedMatch = html.match(/"workplaceType"[^}]*"localizedName"\s*:\s*"(Remote|On-site|Hybrid)"/i);
        if (localizedMatch) {
            job.workplaceType = localizedMatch[1];
        }
    }
    
    // Pattern 3: Check navigationBarSubtitle for (Remote), (On-site), (Hybrid)
    if (!job.workplaceType) {
        const subtitleMatch = html.match(/navigationBarSubtitle"\s*:\s*"[^"]*\((Remote|On-site|Hybrid)\)/i);
        if (subtitleMatch) {
            job.workplaceType = subtitleMatch[1].charAt(0).toUpperCase() + subtitleMatch[1].slice(1).toLowerCase();
            if (job.workplaceType === 'On-site') job.workplaceType = 'On-site';
        }
    }
    
    // Pattern 4: Check for workplace type in formattedLocation
    if (!job.workplaceType) {
        const formattedMatch = html.match(/"formattedLocation"\s*:\s*"[^"]*\((Remote|On-site|Hybrid)\)"/i);
        if (formattedMatch) {
            job.workplaceType = formattedMatch[1];
        }
    }
    
    // Pattern 5: Look for workplaceTypesResolutionResults
    if (!job.workplaceType) {
        const resolutionMatch = html.match(/workplaceTypesResolutionResults[^}]*"(REMOTE|ON_SITE|HYBRID)"/i);
        if (resolutionMatch) {
            const workplaceEnum = resolutionMatch[1].toUpperCase();
            if (workplaceEnum === 'REMOTE') job.workplaceType = 'Remote';
            else if (workplaceEnum === 'ON_SITE') job.workplaceType = 'On-site';
            else if (workplaceEnum === 'HYBRID') job.workplaceType = 'Hybrid';
        }
    }
    
    // Get apply URL
    const applyUrlMatch = html.match(/companyApplyUrl"\s*:\s*"([^"]+)"/);
    if (applyUrlMatch) {
        job.applyUrl = decodeHTMLEntities(applyUrlMatch[1]);
    } else {
        job.applyUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
    }
    
    // Extract skills from description
    job.skills = extractSkills(job.description);
    
    return job;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text) {
    if (!text) return '';
    return text
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#61;/g, '=')
        .replace(/&#92;/g, '\\')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'");
}

/**
 * Extract skills from job description
 */
function extractSkills(description) {
    if (!description) return [];
    
    const skills = [];
    const commonSkills = [
        'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'AWS', 'SQL', 
        'TypeScript', 'Go', 'Rust', 'Docker', 'Kubernetes', 'C#', '.NET', 'Azure', 
        'GCP', 'Angular', 'Vue', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Git',
        'Linux', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Machine Learning', 'AI',
        'HTML', 'CSS', 'SASS', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Flutter', 'React Native'
    ];
    
    const lowerDesc = description.toLowerCase();
    commonSkills.forEach(skill => {
        if (lowerDesc.includes(skill.toLowerCase())) {
            skills.push(skill);
        }
    });
    
    return skills;
}

// --- MAIN SCRAPER CLASS ---

class LinkedInPlaywrightScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.cookies = null;
    }

    async init() {
        this.cookies = loadCookies();
        
        if (!this.cookies) {
            throw new Error('Cookies are required for authenticated scraping');
        }
        
        this.browser = await chromium.launch({
            headless: true,
            args: ['--disable-blink-features=AutomationControlled']
        });
        
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });
        
        // Set cookies
        const playwrightCookies = convertCookiesToPlaywright(this.cookies);
        await this.context.addCookies(playwrightCookies);
        console.log('   🍪 Cookies applied to browser context');
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async fetchPage(url) {
        const page = await this.context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await sleep(2000); // Wait for dynamic content
            const html = await page.content();
            return html;
        } finally {
            await page.close();
        }
    }

    /**
     * Fetch job detail page and check apply button to determine Easy Apply status
     * Returns { html, easyApply, applyType }
     */
    async fetchJobDetailWithApplyCheck(url) {
        const page = await this.context.newPage();
        try {
            // Use domcontentloaded instead of networkidle to avoid timeouts
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await sleep(2500); // Wait for dynamic content
            
            // Scroll to trigger lazy loading
            await page.evaluate(() => window.scrollTo(0, 300));
            await sleep(500);
            
            const html = await page.content();
            let easyApply = false;
            let applyType = 'unknown';
            
            // Try to find the apply button using multiple selectors
            const applyButtonSelectors = [
                'button[data-live-test-job-apply-button]',
                'button.jobs-apply-button',
                'button[aria-label*="Apply"]',
                '.jobs-apply-button--top-card button',
                '.jobs-s-apply button',
                'button.jobs-apply-button--top-card'
            ];
            
            for (const selector of applyButtonSelectors) {
                try {
                    const applyBtn = await page.$(selector);
                    if (applyBtn) {
                        const btnText = await applyBtn.textContent();
                        if (btnText) {
                            const trimmedText = btnText.trim();
                            if (trimmedText.includes('Easy Apply')) {
                                easyApply = true;
                                applyType = 'Easy Apply';
                                break;
                            } else if (trimmedText.includes('Apply')) {
                                easyApply = false;
                                applyType = 'External Apply';
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // Selector not found, try next
                }
            }
            
            // Fallback: Check for specific LinkedIn Easy Apply indicators in HTML
            if (applyType === 'unknown') {
                // Look for the Easy Apply modal trigger or specific data attributes
                if (html.includes('"applyMethod":"COMPLEX_ONSITE_APPLY"') || 
                    html.includes('"onsiteApply":true')) {
                    easyApply = true;
                    applyType = 'Easy Apply (from data)';
                } else if (html.includes('"applyMethod":"OFFSITE"') || 
                           html.includes('"externalApply":true')) {
                    easyApply = false;
                    applyType = 'External Apply (from data)';
                }
            }
            
            return { html, easyApply, applyType };
        } finally {
            await page.close();
        }
    }

    async scrapeAllJobs(searchQuery, options = {}) {
        const { easyApplyOnly = false, saveToDb = true } = options;
        
        if (!this.browser) await this.init();
        
        const results = { savedCount: 0, skippedCount: 0, failedCount: 0, totalFetched: 0 };
        const allJobs = [];
        
        try {
            // Build search URL
            const encodedQuery = encodeURIComponent(searchQuery);
            const searchUrl = CONFIG.BASE_SEARCH_URL.replace('{QUERY}', encodedQuery);
            
            console.log(`\n🌐 Fetching LinkedIn Jobs Search...`);
            console.log(`   Query: "${searchQuery}"`);
            console.log(`   URL: ${searchUrl}\n`);
            
            // Fetch first page to get total pages
            console.log('📄 Fetching page 1...');
            let html = await this.fetchPage(searchUrl);
            
            // Check if logged in
            if (html.includes('Sign in') && html.includes('Join now') && !html.includes('fsd_jobPosting')) {
                console.log('   ⚠️ Not logged in! Cookies may be expired.');
                console.log('   Please update your cookies in LinkedIN_cookies.json');
                return results;
            }
            
            const totalPages = parseTotalPages(html);
            console.log(`   📊 Found ${totalPages} page(s) of results`);
            
            // Parse jobs from first page
            let pageJobs = parseJobsFromSearchPage(html);
            allJobs.push(...pageJobs);
            console.log(`   ✅ Page 1: Found ${pageJobs.length} jobs`);
            
            // Fetch remaining pages
            for (let page = 2; page <= totalPages; page++) {
                console.log(`📄 Fetching page ${page}/${totalPages}...`);
                const pageUrl = `${searchUrl}&start=${(page - 1) * CONFIG.JOBS_PER_PAGE}`;
                
                await sleep(1500); // Be polite
                html = await this.fetchPage(pageUrl);
                
                pageJobs = parseJobsFromSearchPage(html);
                allJobs.push(...pageJobs);
                console.log(`   ✅ Page ${page}: Found ${pageJobs.length} jobs`);
            }
            
            // Deduplicate
            const uniqueJobs = [];
            const seenIds = new Set();
            for (const job of allJobs) {
                if (!seenIds.has(job.jobId)) {
                    seenIds.add(job.jobId);
                    uniqueJobs.push(job);
                }
            }
            
            results.totalFetched = uniqueJobs.length;
            
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📊 Fetched ${uniqueJobs.length} unique jobs`);
            console.log(`${'='.repeat(60)}`);
            console.log('\n🚀 Starting to process each job...\n');
            
            // Process each job
            for (let i = 0; i < uniqueJobs.length; i++) {
                const { jobId, title } = uniqueJobs[i];
                const jobNum = i + 1;
                
                // Display progress
                const displayTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
                process.stdout.write(`Job ${jobNum}/${uniqueJobs.length} "${displayTitle}" `);
                process.stdout.write('.'.repeat(Math.max(1, 45 - displayTitle.length)));
                
                try {
                    // Fetch job details page with apply button check
                    const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
                    await sleep(800 + Math.random() * 700); // Random delay
                    
                    const { html: jobHtml, easyApply, applyType } = await this.fetchJobDetailWithApplyCheck(jobUrl);
                    
                    // Check if job is expired
                    if (jobHtml.includes('No longer accepting applications') || 
                        jobHtml.includes('no longer accepting applications')) {
                        console.log(' ⏭️ Expired');
                        results.skippedCount++;
                        continue;
                    }
                    
                    // Parse job details (enable debug for first job to save HTML)
                    const debugMode = (i === 0);
                    const jobData = parseJobDetails(jobHtml, jobId, debugMode);
                    
                    // Set Easy Apply status from button check
                    jobData.easyApply = easyApply;
                    
                    if (!jobData.title || !jobData.company) {
                        // Save HTML for debugging on first failure
                        if (results.failedCount === 0) {
                            const debugPath = path.join(__dirname, '..', 'generated', `debug_failed_${jobId}.html`);
                            fs.writeFileSync(debugPath, jobHtml);
                            console.log(`\n   [DEBUG] Saved failed job HTML to: ${debugPath}`);
                        }
                        console.log(` ⚠️ Missing data (title: ${!!jobData.title}, company: ${!!jobData.company})`);
                        results.failedCount++;
                        continue;
                    }
                    
                    // Check easy apply filter
                    if (easyApplyOnly && !jobData.easyApply) {
                        console.log(` ⏭️ Not Easy Apply (${applyType})`);
                        results.skippedCount++;
                        continue;
                    }
                    
                    // Save to DB
                    if (saveToDb) {
                        const saveResult = await this.saveJobToDb(jobData);
                        if (saveResult === 'saved') {
                            const applyLabel = jobData.easyApply ? '⚡Easy' : '🔗External';
                            const workplaceLabel = jobData.workplaceType ? ` [${jobData.workplaceType}]` : '';
                            console.log(` ✅ Saved (${applyLabel})${workplaceLabel}`);
                            results.savedCount++;
                        } else if (saveResult === 'duplicate') {
                            console.log(' ⏭️ Skipped, Duplicated');
                            results.skippedCount++;
                        } else {
                            console.log(' ❌ Failed to save');
                            results.failedCount++;
                        }
                    } else {
                        console.log(' ✅ Extracted (DB disabled)');
                        results.savedCount++;
                    }
                    
                } catch (err) {
                    console.log(` ❌ Error: ${err.message.substring(0, 25)}`);
                    results.failedCount++;
                }
            }
            
        } catch (error) {
            console.error('\n❌ Error during scraping:', error.message);
        }
        
        return results;
    }

    async saveJobToDb(job) {
        if (!Job) return 'failed';

        try {
            if (!job.title || !job.company) {
                return 'failed';
            }

            const applyUrl = job.applyUrl || `https://www.linkedin.com/jobs/view/${job.jobId}/`;

            // Check for duplicates - only based on BOTH title AND company
            const existing = await Job.findOne({
                where: {
                    [Op.and]: [
                        { title: job.title },
                        { company: job.company }
                    ]
                }
            });

            if (existing) {
                return 'duplicate';
            }

            await Job.create({
                title: job.title,
                company: job.company,
                location: job.location || 'Jordan',
                salary: '',
                description: job.description || '',
                tags: job.skills || [],
                apply_url: applyUrl,
                source: 'LinkedIn',
                posted_at: new Date(),
                source_id: job.jobId,
                linkedin_job_id: job.jobId,
                easy_apply: job.easyApply,
                company_logo: '',
                job_insights: [],
                workplace_type: job.workplaceType || null
            });

            return 'saved';

        } catch (err) {
            console.error('DB Error:', err.message);
            return 'failed';
        }
    }
}

// --- EXPORT & RUN ---

async function scrapeLinkedInJobs(searchQuery, options = {}) {
    const { easyApplyOnly = false, saveToDb = true } = options;
    
    const scraper = new LinkedInPlaywrightScraper();
    try {
        await scraper.init();
        const results = await scraper.scrapeAllJobs(searchQuery, { easyApplyOnly, saveToDb });
        return results;
    } catch (err) {
        console.error('Fatal Error:', err);
        throw err;
    } finally {
        await scraper.close();
    }
}

module.exports = { scrapeLinkedInJobs, CAREER_QUERIES, selectCareerQuery };

// --- CLI EXECUTION ---
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const easyApplyOnly = args.includes('--easy-apply') || args.includes('-e');
    const noDb = args.includes('--no-db');
    
    // Check if query number is passed directly
    let queryArg = args.find(a => a.startsWith('--query=') || a.startsWith('-q='));
    let directQueryNum = null;
    if (queryArg) {
        const parts = queryArg.split('=');
        if (parts[1]) {
            directQueryNum = parseInt(parts[1], 10);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 LINKEDIN JOB SCRAPER - Playwright Edition');
    console.log('='.repeat(60));
    console.log(`🍪 Using cookies from: ${CONFIG.COOKIES_FILE}`);
    console.log(`🎯 Easy Apply Only: ${easyApplyOnly ? 'Yes' : 'No'}`);
    console.log(`💾 Save to DB: ${noDb ? 'No' : 'Yes'}`);
    
    (async () => {
        let selectedQuery;
        
        if (directQueryNum && directQueryNum >= 1 && directQueryNum <= CAREER_QUERIES.length) {
            selectedQuery = CAREER_QUERIES[directQueryNum - 1];
            console.log(`\n✅ Using query from argument: ${selectedQuery}`);
        } else {
            selectedQuery = await selectCareerQuery();
        }
        
        const startTime = Date.now();
        
        const results = await scrapeLinkedInJobs(selectedQuery, {
            easyApplyOnly,
            saveToDb: !noDb
        });
        
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL SCRAPING SUMMARY');
        console.log('='.repeat(60));
        console.log(`🔍 Query: "${selectedQuery}"`);
        console.log(`📋 Total Jobs Fetched: ${results.totalFetched}`);
        console.log(`✅ Jobs Saved to DB: ${results.savedCount}`);
        console.log(`⏭️ Jobs Skipped: ${results.skippedCount}`);
        console.log(`❌ Jobs Failed: ${results.failedCount}`);
        console.log(`⏱️ Duration: ${duration} minutes`);
        console.log('='.repeat(60));
        console.log('\n🎉 Scraping completed!');
        
        process.exit(0);
    })().catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
}
