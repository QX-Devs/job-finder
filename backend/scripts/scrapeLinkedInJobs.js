const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
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

puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
const CONFIG = {
    MAX_RETRIES: 3,
    MAX_JOBS_SEARCH: 50,
    SCROLL_DELAY: 1000,
    PAGE_TIMEOUT: 60000,
    OUTPUT_FILE: path.join(__dirname, '..', 'generated', 'linkedin_jobs.json'),
    PROXIES: [
        // Placeholder for future proxy list
        // 'http://user:pass@host:port',
    ],
    USER_AGENTS: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        // Add more as needed...
    ]
};

const MAX_DESCRIPTION_LENGTH = 8000; // avoid DB overflow on very long descriptions

// --- URL HELPER ---
function normalizeApplyUrl(url) {
    if (!url || typeof url !== 'string') return null;

    let cleaned = url.trim();
    if (!cleaned) return null;

    // LinkedIn sometimes uses protocol-relative URLs: //www.linkedin.com/...
    if (cleaned.startsWith('//')) {
        cleaned = 'https:' + cleaned;
    }

    // If URL doesn't start with http:// or https://, prepend https://
    if (!/^https?:\/\//i.test(cleaned)) {
        cleaned = 'https://' + cleaned;
    }

    try {
        const u = new URL(cleaned);

        // Strip LinkedIn tracking params to improve dedupe
        const trackingParams = ['trk', 'refId', 'trackingId', 'lipi'];
        trackingParams.forEach((p) => u.searchParams.delete(p));

        return u.toString();
    } catch (err) {
        return null;
    }
}

// --- HELPER FUNCTIONS ---

function getRandomUserAgent() {
    return CONFIG.USER_AGENTS[Math.floor(Math.random() * CONFIG.USER_AGENTS.length)];
}

function getRandomViewport() {
    return {
        width: Math.floor(Math.random() * (1920 - 1366 + 1)) + 1366,
        height: Math.floor(Math.random() * (1080 - 768 + 1)) + 768
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, retries = CONFIG.MAX_RETRIES) {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`   ⚠️ Operation failed, retrying... (${retries} left) - ${error.message}`);
        await sleep(2000);
        return retry(fn, retries - 1);
    }
}

// --- MAIN SCRAPER CLASS ---

class LinkedInScraper {
    constructor() {
        this.browser = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=IsolateOrigins,site-per-process',
            ]
        });
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    async createPage() {
        const page = await this.browser.newPage();
        await page.setUserAgent(getRandomUserAgent());
        await page.setViewport(getRandomViewport());

        // Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        return page;
    }

    async scrape(url, options = {}) {
        const { mode = 'auto', easyApplyOnly = false, maxJobs = CONFIG.MAX_JOBS_SEARCH } = options;
        if (!this.browser) await this.init();

        const page = await this.createPage();
        const allJobs = [];

        try {
            console.log(`🌐 Navigating to ${url}...`);

            await retry(() => page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.PAGE_TIMEOUT }));

            // Determine mode
            let isSearchPage = false;
            if (mode === 'auto') {
                isSearchPage = url.includes('/jobs/search') || url.includes('keywords=');
            } else {
                isSearchPage = mode === 'search';
            }

            if (isSearchPage) {
                console.log('   🔍 Detected Search Page. Crawling jobs...');
                await this.crawlSearchPage(page, allJobs, { easyApplyOnly, maxJobs });
            } else {
                console.log('   📄 Detected Single Job Page. Extracting details...');
                const jobData = await this.extractJobDetails(page);
                if (jobData) {
                    allJobs.push(jobData);
                }
            }

        } catch (error) {
            console.error('   ❌ Error during scraping:', error.message);
        } finally {
            await page.close();
        }

        return allJobs;
    }

    async crawlSearchPage(page, allJobs, options = {}) {
        const { easyApplyOnly = false, maxJobs = CONFIG.MAX_JOBS_SEARCH } = options;

        let skippedForEasyApply = 0;
        // Scroll to load more jobs
        console.log('   📜 Scrolling to load jobs...');
        await this.autoScroll(page);

        // Get all job links
        const jobLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a.base-card__full-link, a.job-card-list__title'));
            return anchors.map(a => a.href).filter(href => href.includes('/jobs/view/'));
        });

        const uniqueLinks = [...new Set(jobLinks)].slice(0, maxJobs);
        console.log(`   🎯 Found ${uniqueLinks.length} unique jobs (limit: ${maxJobs}).`);

        // Visit each job link
        for (let i = 0; i < uniqueLinks.length; i++) {
            const link = uniqueLinks[i];
            console.log(`   [${i + 1}/${uniqueLinks.length}] Scraping: ${link}`);

            try {
                const newPage = await this.createPage();
                await retry(() => newPage.goto(link, { waitUntil: 'networkidle2', timeout: 30000 }));

                const jobData = await this.extractJobDetails(newPage);
                await newPage.close();

                if (!jobData) {
                    console.log(`      ⚠️  Failed to extract job details from ${link}`);
                } else if (easyApplyOnly && !jobData.easyApply) {
                    skippedForEasyApply++;
                    console.log(`      ⏭️  Skipping non-Easy Apply job: ${jobData.title} at ${jobData.company}`);
                } else {
                    allJobs.push(jobData);
                    console.log(`      ✅ Extracted: ${jobData.title} at ${jobData.company} (${jobData.location})`);
                }

                // Random delay to be polite
                await sleep(1000 + Math.random() * 2000);
            } catch (err) {
                console.error(`      ❌ Failed to scrape job: ${err.message}`);
            }
        }

        if (easyApplyOnly) {
            console.log(`   🎯 Easy Apply filter: ${skippedForEasyApply} jobs skipped (non-Easy Apply).`);
        }
    }

    async extractJobDetails(page) {
        try {
            // Expand "See more"
            try {
                const seeMoreBtn = await page.$('button.show-more-less-html__button--more');
                if (seeMoreBtn) {
                    await seeMoreBtn.click();
                    await sleep(500);
                }
            } catch (e) { /* ignore */ }

            // Extract data
            const data = await page.evaluate(() => {
                const getText = (selector) => document.querySelector(selector)?.innerText?.trim() || '';
                const getAttr = (selector, attr) => document.querySelector(selector)?.getAttribute(attr) || '';

                // 1. JSON-LD
                let jsonLd = {};
                try {
                    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                    for (const s of scripts) {
                        const content = JSON.parse(s.innerText);
                        const candidates = Array.isArray(content) ? content : [content];
                        for (const c of candidates) {
                            if (c && c['@type'] === 'JobPosting') {
                                jsonLd = c;
                                break;
                            }
                        }
                        if (Object.keys(jsonLd).length > 0) break;
                    }
                } catch (e) { /* ignore JSON-LD parse errors */ }

                // 2. DOM Extraction
                const title = getText('h1.top-card-layout__title') || jsonLd.title || '';
                const company = getText('a.top-card-layout__card-url') || jsonLd.hiringOrganization?.name || '';
                const location = getText('span.top-card-layout__first-subline') || jsonLd.jobLocation?.address?.addressLocality || '';

                const descriptionHtml = document.querySelector('div.show-more-less-html__markup')?.innerHTML || jsonLd.description || '';
                const descriptionText = document.querySelector('div.show-more-less-html__markup')?.innerText || '';

                // Criteria
                const criteriaItems = Array.from(document.querySelectorAll('li.description__job-criteria-item'));
                const criteria = {};
                criteriaItems.forEach(item => {
                    const header = item.querySelector('h3')?.innerText?.trim();
                    const value = item.querySelector('span')?.innerText?.trim();
                    if (header && value) criteria[header] = value;
                });

                const seniority = criteria['Seniority level'] || '';
                const employmentType = criteria['Employment type'] || jsonLd.employmentType || '';
                const jobFunction = criteria['Job function'] ? [criteria['Job function']] : [];
                const industries = criteria['Industries'] ? [criteria['Industries']] : [];

                // Easy Apply
                const easyApplyBtn = !!document.querySelector('button.apply-button--easy-apply-enabled') ||
                    document.body.innerText.includes('Easy Apply');

                // Apply URL
                const applyUrl = getAttr('a.apply-button--link', 'href') || '';

                // Posted Date
                const postedAgo = getText('span.posted-time-ago__text');
                const datePosted = jsonLd.datePosted || '';

                // Stats
                const applicants = getText('span.num-applicants__caption') || '';

                // Company Logo
                const companyLogo = getAttr('img.artdeco-entity-image', 'src') || jsonLd.hiringOrganization?.logo || '';

                return {
                    title,
                    company,
                    location,
                    descriptionHtml,
                    descriptionText,
                    seniority,
                    employmentType,
                    jobFunction,
                    industries,
                    easyApply: easyApplyBtn,
                    applyUrl,
                    postedAgo,
                    datePosted,
                    applicants,
                    companyLogo,
                    source: 'LinkedIn'
                };
            });

            // Post-processing
            const jobIdMatch = page.url().match(/-(\d+)(?:\?|$)/);
            const jobId = jobIdMatch ? jobIdMatch[1] : '';

            // Skills extraction
            const safeDescriptionText = (data.descriptionText || '').toLowerCase();
            const skills = [];
            const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'AWS', 'SQL', 'TypeScript', 'Go', 'Rust', 'Docker', 'Kubernetes', 'C#', '.NET', 'Azure', 'GCP', 'Angular', 'Vue'];
            commonSkills.forEach(skill => {
                if (safeDescriptionText.includes(skill.toLowerCase())) {
                    skills.push(skill);
                }
            });

            return {
                jobId: jobId,
                ...data,
                linkedinApplyUrl: page.url(),
                externalApplyUrl: data.applyUrl,
                workplaceType: data.location.toLowerCase().includes('remote') ? 'Remote' :
                    data.location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site',
                companyId: '',
                companySize: '',
                skills: skills,
                jobInsights: [],
                salary: '',
                benefits: [],
                tags: [],
                views: '',
            };

        } catch (error) {
            console.error(`      ❌ Error extracting job details from ${page.url()}:`, error.message);
            return null;
        }
    }

    async autoScroll(page) {
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                let retries = 0;
                const maxRetries = 50; // Stop if no progress for a while

                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    // Check if we reached bottom or are stuck
                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        retries++;
                        if (retries > maxRetries) {
                            clearInterval(timer);
                            resolve();
                        }
                    } else {
                        retries = 0;
                    }
                }, 100);
            });
        });
    }
}

// --- DB SAVING ---

async function saveJobsToDB(jobs = []) {
    if (!Job) {
        return { savedCount: 0, skippedCount: jobs.length };
    }

    let savedCount = 0;
    let skippedCount = 0;

    console.log(`   💾 Attempting to save ${jobs.length} jobs to database...`);
    
    for (const job of jobs) {
        try {
            // Validate required fields
            if (!job.title || !job.company) {
                console.log(`   ⚠️  Skipping job with missing title or company: ${JSON.stringify({ title: job.title, company: job.company })}`);
                skippedCount++;
                continue;
            }
            
            // Note: Location validation removed - we're using geoId=103710677 for Jordan, so all results are in Jordan
            // Locations like "Amman" are valid Jordan locations even if they don't contain the word "jordan"
            
            // Prefer external apply URL, fallback to LinkedIn job URL
            const rawApplyUrl = job.externalApplyUrl || job.linkedinApplyUrl;
            const applyUrl = normalizeApplyUrl(rawApplyUrl);

            if (!applyUrl) {
                console.log(`   ⚠️  Skipping job with invalid apply URL: ${rawApplyUrl} (${job.title} at ${job.company})`);
                skippedCount++;
                continue;
            }

            // Description: prefer HTML, fallback to plain text
            const rawDescription = (job.descriptionHtml || job.descriptionText || '').trim();
            const description = rawDescription.length > MAX_DESCRIPTION_LENGTH
                ? rawDescription.slice(0, MAX_DESCRIPTION_LENGTH)
                : rawDescription;

            // Tags: merge skills + industries, unique, trimmed
            const tags = Array.from(
                new Set([...(job.skills || []), ...(job.industries || [])]
                    .map(t => String(t).trim())
                    .filter(Boolean))
            );
            
            const dedupeConditions = [];

            if (job.jobId) {
                dedupeConditions.push({ source_id: job.jobId });
                dedupeConditions.push({ linkedin_job_id: job.jobId });
            }

            dedupeConditions.push({
                [Op.and]: [
                    { title: job.title },
                    { company: job.company }
                ]
            });

            dedupeConditions.push({ apply_url: applyUrl }); // use normalized applyUrl here

            const existing = await Job.findOne({
                where: {
                    [Op.or]: dedupeConditions
                }
            });

            if (existing) {
                console.log(`   ⏭️  Skipping duplicate job: ${job.title} at ${job.company} (already exists in DB)`);
                skippedCount++;
                continue;
            }

            const createdJob = await Job.create({
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                description,
                tags,
                apply_url: applyUrl,
                source: 'LinkedIn',
                posted_at: job.datePosted && !Number.isNaN(Date.parse(job.datePosted))
                    ? new Date(job.datePosted)
                    : new Date(),
                source_id: job.jobId,
                linkedin_job_id: job.jobId,
                easy_apply: job.easyApply,
                company_logo: job.companyLogo,
                job_insights: job.jobInsights || []
            });
            savedCount++;
            console.log(`   ✅ Saved: ${job.title} at ${job.company} (${job.location})`);

        } catch (err) {
            console.error(`   ❌ Failed to save job ${job.title} at ${job.company}: ${err.message}`);
            if (err.errors) {
                console.error(`      Validation errors:`, err.errors.map(e => `${e.path}: ${e.message}`).join(', '));
            }
        }
    }

    console.log(`   💾 DB Results: ${savedCount} saved, ${skippedCount} skipped.`);
    return { savedCount, skippedCount };
}

// --- EXPORT & RUN ---

async function scrapeLinkedInJobs(url, options = {}) {
    const {
        mode = 'auto',
        easyApplyOnly = false,
        writeToFile = true,
        outputFile = CONFIG.OUTPUT_FILE,
        maxJobs = CONFIG.MAX_JOBS_SEARCH,
        saveToDb = true,
    } = options;
    const scraper = new LinkedInScraper();
    try {
        const jobs = await scraper.scrape(url, { mode, easyApplyOnly, maxJobs });

        if (writeToFile) {
            fs.mkdirSync(path.dirname(outputFile), { recursive: true });
            fs.writeFileSync(outputFile, JSON.stringify({
                success: true,
                count: jobs.length,
                jobs: jobs
            }, null, 2));
            console.log(`   📁 JSON saved to ${outputFile}`);
        }

        // Save to DB
        let dbSummary = { savedCount: 0, skippedCount: 0 };

        if (saveToDb) {
            dbSummary = await saveJobsToDB(jobs);
        } else {
            console.log('   🧪 DB saving is disabled (--no-db).');
        }

        return {
            jobs,
            ...dbSummary
        };
    } catch (err) {
        console.error('Fatal Error:', err);
        throw err;
    } finally {
        await scraper.close();
    }
}

module.exports = { scrapeLinkedInJobs };

// --- CLI EXECUTION ---
// Run the script if called directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const defaultUrl = 'https://www.linkedin.com/jobs/search/?currentJobId=4347860013&f_TPR=r604800&geoId=103710677&keywords=software%20developer&location=Jordan&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true';
    
    let url = args[0] && !args[0].startsWith('--') && !args[0].startsWith('-')
        ? args[0]
        : defaultUrl;
    
    const easyApplyOnly = args.includes('--easy-apply') || args.includes('-e');
    const noDb = args.includes('--no-db');
    
    // Parse --limit=NN or -l=NN
    let maxJobs = CONFIG.MAX_JOBS_SEARCH;
    const limitArg = args.find(a => a.startsWith('--limit=') || a.startsWith('-l='));
    if (limitArg) {
        const parts = limitArg.split('=');
        if (parts[1]) {
            const parsed = parseInt(parts[1], 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                maxJobs = parsed;
            }
        }
    }
    
    if (!url.startsWith('http')) {
        console.error('❌ Error: Please provide a valid LinkedIn jobs URL');
        console.log('\nUsage:');
        console.log('  node scripts/scrapeLinkedInJobs.js [URL] [--easy-apply] [--limit=NN] [--no-db]');
        console.log('\nExamples:');
        console.log('  node scripts/scrapeLinkedInJobs.js');
        console.log('  node scripts/scrapeLinkedInJobs.js "https://www.linkedin.com/jobs/search/?keywords=developer&location=Jordan"');
        console.log('  node scripts/scrapeLinkedInJobs.js "https://www.linkedin.com/jobs/search/?keywords=developer&location=Jordan" --easy-apply');
        console.log('  node scripts/scrapeLinkedInJobs.js "https://www.linkedin.com/jobs/search/?keywords=developer&location=Jordan" --limit=25 --no-db');
        process.exit(1);
    }
    
    console.log('🚀 Starting LinkedIn Job Scraper...');
    console.log(`📋 URL: ${url}`);
    console.log(`🎯 Easy Apply Only: ${easyApplyOnly ? 'Yes' : 'No'}`);
    console.log(`📦 Max Jobs: ${maxJobs}`);
    console.log(`💾 Save to DB: ${noDb ? 'No (JSON only)' : 'Yes'}`);
    console.log('');
    
    scrapeLinkedInJobs(url, { 
        easyApplyOnly,
        writeToFile: true,
        maxJobs,
        saveToDb: !noDb
    })
    .then((result) => {
        console.log('\n' + '='.repeat(60));
        console.log('📊 SCRAPING SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Jobs Scraped: ${result.jobs.length}`);
        console.log(`💾 Jobs Saved to DB: ${result.savedCount || 0}`);
        console.log(`⏭️  Jobs Skipped (duplicates): ${result.skippedCount || 0}`);
        console.log('='.repeat(60));
        console.log('\n🎉 Scraping completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
}