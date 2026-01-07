import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ======================
   CONFIGURATION
====================== */
const COOKIES_PATH = path.join(__dirname, "..", "LinkedIN_cookies.json");

// Selectors
const SELECTORS = {
  easyApplyButton: '#jobs-apply-button-id',
  easyApplyButtonAlt: 'button.jobs-apply-button',
  submitButton: 'button[data-live-test-easy-apply-submit-button]',
  modal: '.jobs-easy-apply-modal, .jobs-easy-apply-content',
  successMessage: 'text="Application sent"',
};

/* ======================
   COMMON FALLBACK ANSWERS
====================== */
const FALLBACK_ANSWERS = {
  // Language proficiency defaults
  languageProficiency: {
    patterns: ['proficiency', 'language', 'english', 'arabic', 'spanish', 'french', 'german'],
    defaultAnswer: 'Professional',
    nativeLanguages: ['english', 'arabic'] // Will answer "Native or bilingual" for these
  },
  // Commute/relocation
  commute: {
    patterns: ['commute', 'commuting', 'relocate', 'relocation', 'travel', 'on-site', 'onsite', 'location'],
    yesOptions: ['yes', 'true', 'i am', 'willing']
  },
  // Work authorization
  workAuth: {
    patterns: ['authorized', 'authorization', 'legally', 'work in', 'eligible', 'right to work'],
    yesOptions: ['yes', 'true', 'authorized']
  },
  // Sponsorship
  sponsorship: {
    patterns: ['sponsor', 'visa', 'sponsorship'],
    noOptions: ['no', 'false', 'do not require']
  },
  // Experience years
  experience: {
    patterns: ['years of experience', 'how many years', 'experience with'],
    defaultYears: '3'
  }
};

/* ======================
   HELPER: Sleep with backoff
====================== */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ======================
   LOGGING
====================== */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

/* ======================
   COOKIE HANDLING
====================== */
function toPlaywrightSameSite(sameSite) {
  if (!sameSite) return undefined;
  const v = String(sameSite).toLowerCase();
  if (v === "no_restriction" || v === "none") return "None";
  if (v === "lax") return "Lax";
  if (v === "strict") return "Strict";
  return undefined;
}

async function loadCookiesIntoContext(pwContext) {
  if (!fs.existsSync(COOKIES_PATH)) {
    log("ERROR: LinkedIn cookies not found at: " + COOKIES_PATH);
    return false;
  }

  const raw = fs.readFileSync(COOKIES_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const cookies = Array.isArray(parsed) ? parsed : parsed?.cookies;
  if (!Array.isArray(cookies) || cookies.length === 0) return false;

  const mapped = cookies
    .filter((c) => c?.name && c?.value)
    .map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? "/",
      expires: typeof c.expirationDate === "number" ? c.expirationDate : c.session ? -1 : undefined,
      httpOnly: Boolean(c.httpOnly),
      secure: Boolean(c.secure),
      sameSite: toPlaywrightSameSite(c.sameSite),
    }))
    .filter((c) => c.domain);

  if (mapped.length === 0) return false;
  await pwContext.addCookies(mapped);
  log(`Loaded ${mapped.length} cookies`);
  return true;
}

/* ======================
   CLICK NEXT BUTTON
====================== */
async function clickNextButton(page) {
  log("Clicking Next button...");

  try {
    // Strategy 1: Specific data attributes
    const specificSelectors = [
      'button[data-live-test-easy-apply-next-button]',
      'button[data-easy-apply-next-button]',
    ];

    for (const selector of specificSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          await btn.click();
          log(`Clicked via: ${selector}`);
          await page.waitForTimeout(1500);
          return true;
        }
      }
    }

    // Strategy 2: Find in modal footer
    const clicked = await page.evaluate(() => {
      const modal = document.querySelector('.jobs-easy-apply-modal, .jobs-easy-apply-content');
      if (!modal) return false;

      const footer = modal.querySelector('footer, .artdeco-modal__actionbar');
      const searchArea = footer || modal;

      // Find primary button
      const primaryBtn = searchArea.querySelector('button.artdeco-button--primary');
      if (primaryBtn && !primaryBtn.disabled) {
        const text = primaryBtn.innerText?.trim().toLowerCase() || '';
        if (!text.includes('dismiss') && !text.includes('cancel')) {
          primaryBtn.scrollIntoView({ block: 'center' });
          primaryBtn.click();
          return true;
        }
      }

      // Fallback: button with Next/Review/Continue text
      const buttons = searchArea.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.innerText?.trim().toLowerCase() || '';
        if (text === 'next' || text === 'review' || text === 'continue') {
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      log("Next clicked via page.evaluate");
      await page.waitForTimeout(1500);
      return true;
    }

    log("Could not find Next button");
    return false;
  } catch (error) {
    log(`Next button error: ${error.message}`);
    return false;
  }
}

// Check if application was submitted successfully
async function checkForSuccess(page) {
  try {
    // Check for success message in page
    const successTexts = [
      'Application sent',
      'application was sent',
      'Your application was sent',
      'Successfully applied'
    ];

    const pageText = await page.evaluate(() => document.body.innerText || '');

    for (const successText of successTexts) {
      if (pageText.includes(successText)) {
        return true;
      }
    }

    // Also check specifically in modal area
    const modalText = await page.$eval('.jobs-easy-apply-modal, .jobs-easy-apply-content, .artdeco-modal',
      el => el?.textContent || ''
    ).catch(() => '');

    for (const successText of successTexts) {
      if (modalText.includes(successText)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/* ======================
   CLICK SUBMIT BUTTON
====================== */
async function clickSubmitButton(page) {
  log("Clicking Submit Application...");

  try {
    // Strategy 1: Specific selector
    const btn = await page.$(SELECTORS.submitButton);
    if (btn) {
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        await btn.click();
        log("Clicked Submit via data attribute");
        await page.waitForTimeout(2000);
        return true;
      }
    }

    // Strategy 2: Find in modal
    const clicked = await page.evaluate(() => {
      const modal = document.querySelector('.jobs-easy-apply-modal, .jobs-easy-apply-content');
      if (!modal) return false;

      const buttons = modal.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.innerText?.trim().toLowerCase() || '';
        if (text.includes('submit application') || text === 'submit') {
          btn.scrollIntoView({ block: 'center' });
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      log("Submit clicked via page.evaluate");
      await page.waitForTimeout(2000);
      return true;
    }

    log("Could not find Submit button");
    return false;
  } catch (error) {
    log(`Submit button error: ${error.message}`);
    return false;
  }
}

/* ======================
   DETECT PAGE TYPE
====================== */
async function detectPageType(page) {
  const modalContent = await page.$eval(SELECTORS.modal, el => el.textContent || '').catch(() => '');

  // Check for success first
  if (modalContent.includes('Application sent') || modalContent.includes('application was sent')) {
    return 'SUCCESS';
  }

  // Check for Review page
  if (modalContent.includes('Review your application')) {
    return 'REVIEW';
  }

  // Check for Contact info (pre-filled, just click next)
  if (modalContent.includes('Contact info') && modalContent.includes('Email address')) {
    return 'CONTACT_INFO';
  }

  // Check for Resume page (pre-filled, just click next)
  if (modalContent.includes('Resume') && !modalContent.includes('Additional') && !modalContent.includes('question')) {
    return 'RESUME';
  }

  // Check for Top Choice optional page
  if (modalContent.includes('Mark') && modalContent.includes('top choice')) {
    return 'TOP_CHOICE';
  }

  // Check for any form fields that need filling (ADDITIONAL QUESTIONS)
  const formStatus = await page.evaluate((modalSelector) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) return { hasModal: false };

    let unfilled = [];

    // Check ALL dropdowns - if any have "Select an option" or empty value
    const selects = modal.querySelectorAll('select');
    for (const select of selects) {
      const value = select.value || '';
      const selectedText = select.options[select.selectedIndex]?.text || '';
      if (!value || value === '' || selectedText.includes('Select') || selectedText === '') {
        const container = select.closest('.fb-dash-form-element');
        const label = container?.querySelector('label')?.textContent?.trim() || 'Unknown dropdown';
        unfilled.push({ type: 'dropdown', label, value: selectedText });
      }
    }

    // Check ALL text inputs that are empty
    const inputs = modal.querySelectorAll('input[type="text"]:not([readonly]), input:not([type]):not([readonly]), textarea:not([readonly])');
    for (const input of inputs) {
      if (!input.value && !input.disabled && input.offsetParent !== null) {
        const container = input.closest('.fb-dash-form-element');
        const label = container?.querySelector('label')?.textContent?.trim() || 'Unknown field';
        unfilled.push({ type: 'text', label });
      }
    }

    // Check for unchecked radio groups
    const formElements = modal.querySelectorAll('.fb-dash-form-element');
    for (const el of formElements) {
      const radios = el.querySelectorAll('input[type="radio"]');
      if (radios.length > 0 && !el.querySelector('input[type="radio"]:checked')) {
        const label = el.querySelector('label, legend')?.textContent?.trim() || 'Unknown radio';
        unfilled.push({ type: 'radio', label });
      }
    }

    return { hasModal: true, unfilledCount: unfilled.length, unfilled };
  }, SELECTORS.modal);

  log("Form status check:", formStatus);

  // If there are any unfilled fields, it's an ADDITIONAL_QUESTIONS page
  if (formStatus.unfilledCount > 0) {
    return 'ADDITIONAL_QUESTIONS';
  }

  return 'UNKNOWN';
}

/* ======================
   GET FORM FIELDS FOR AI
====================== */
async function getFormFields(page) {
  return await page.evaluate((modalSelector) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) return { fields: [], radioGroups: [], dropdowns: [] };

    const fields = [];
    const radioGroups = [];
    const dropdowns = [];

    // Check form elements
    const formElements = modal.querySelectorAll('.fb-dash-form-element');
    for (const el of formElements) {
      const label = el.querySelector('label, legend')?.textContent?.trim()
        .replace(/Required$/i, '').trim() || '';

      // Text inputs
      const input = el.querySelector('input[type="text"], input:not([type]), textarea');
      if (input && !input.disabled && !input.readOnly && !input.value) {
        fields.push({ label, type: 'text' });
      }

      // Radio buttons - try multiple selectors for options
      const radios = el.querySelectorAll('input[type="radio"]');
      if (radios.length > 0 && !el.querySelector('input[type="radio"]:checked')) {
        // Try multiple ways to find option labels
        let options = Array.from(el.querySelectorAll('.fb-dash-form-element__single-checkbox-label'))
          .map(l => l.textContent?.trim()).filter(t => t);
        
        // Fallback: look for labels near radio inputs
        if (options.length === 0) {
          options = Array.from(radios).map(radio => {
            const radioLabel = radio.closest('label') || 
              radio.parentElement?.querySelector('label') ||
              el.querySelector(`label[for="${radio.id}"]`);
            return radioLabel?.textContent?.trim() || '';
          }).filter(t => t);
        }
        
        // Another fallback: look for any label/span elements that could be options
        if (options.length === 0) {
          options = Array.from(el.querySelectorAll('.t-14, .t-bold, [data-test-text-selectable-option]'))
            .map(l => l.textContent?.trim()).filter(t => t && t.length < 50);
        }
        
        // Last resort: get text content around each radio
        if (options.length === 0) {
          options = Array.from(radios).map(radio => {
            const parent = radio.parentElement;
            return parent?.textContent?.trim().replace(label, '').trim() || '';
          }).filter(t => t && t.length > 0 && t.length < 100);
        }
        
        // If we found options, add to radioGroups
        if (options.length > 0) {
          radioGroups.push({ question: label, options });
        } else {
          // Even without visible options, add as Yes/No for binary questions
          radioGroups.push({ question: label, options: ['Yes', 'No'] });
        }
      }

      // Dropdowns in form elements
      const select = el.querySelector('select');
      if (select) {
        const value = select.value || '';
        const selectedText = select.options[select.selectedIndex]?.text || '';
        // Check if unfilled (empty value OR shows "Select an option")
        if (!value || value === '' || selectedText.includes('Select') || selectedText === '') {
          const options = Array.from(select.querySelectorAll('option'))
            .map(o => o.textContent?.trim())
            .filter(t => t && !t.includes('Select'));
          dropdowns.push({ label, options });
        }
      }
    }

    // ALSO check for any selects outside of form elements (sometimes LinkedIn does this)
    const allSelects = modal.querySelectorAll('select');
    for (const select of allSelects) {
      // Skip if already processed
      const container = select.closest('.fb-dash-form-element');
      if (container) continue; // Already handled above

      const value = select.value || '';
      const selectedText = select.options[select.selectedIndex]?.text || '';
      if (!value || value === '' || selectedText.includes('Select') || selectedText === '') {
        // Try to find label nearby
        const parent = select.parentElement;
        const label = parent?.querySelector('label')?.textContent?.trim() ||
          select.getAttribute('aria-label') ||
          'Unknown dropdown';
        const options = Array.from(select.querySelectorAll('option'))
          .map(o => o.textContent?.trim())
          .filter(t => t && !t.includes('Select'));
        dropdowns.push({ label, options });
      }
    }

    return { fields, radioGroups, dropdowns };
  }, SELECTORS.modal);
}

/* ======================
   FILL FORM FIELDS
====================== */
async function fillField(page, label, value) {
  return await page.evaluate(({ modalSelector, label, value }) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) return false;

    const formElements = modal.querySelectorAll('.fb-dash-form-element');
    for (const el of formElements) {
      const elLabel = el.querySelector('label')?.textContent?.trim() || '';
      if (elLabel.toLowerCase().includes(label.toLowerCase())) {
        const input = el.querySelector('input[type="text"], input:not([type]), textarea');
        if (input && !input.disabled) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, { modalSelector: SELECTORS.modal, label, value });
}

async function selectRadio(page, question, optionText) {
  return await page.evaluate(({ modalSelector, question, optionText }) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) return false;

    const formElements = modal.querySelectorAll('.fb-dash-form-element');
    for (const el of formElements) {
      const label = el.querySelector('label, legend')?.textContent?.trim()
        .replace(/Required$/i, '').trim() || '';
      
      // Check if this form element matches the question
      const questionLower = question.toLowerCase().replace(/required$/i, '').trim();
      if (!label.toLowerCase().includes(questionLower) && 
          !questionLower.includes(label.toLowerCase().substring(0, 20))) continue;

      const radios = el.querySelectorAll('input[type="radio"]');
      if (radios.length === 0) continue;
      
      // Strategy 1: Try standard label selectors
      const optionLabels = el.querySelectorAll('.fb-dash-form-element__single-checkbox-label');
      for (let i = 0; i < optionLabels.length; i++) {
        const optLabel = optionLabels[i].textContent?.trim().toLowerCase() || '';
        if (optLabel.includes(optionText.toLowerCase()) && radios[i]) {
          radios[i].click();
          radios[i].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // Strategy 2: Match by radio input's parent text content
      for (const radio of radios) {
        const parent = radio.parentElement;
        const parentText = parent?.textContent?.trim().toLowerCase() || '';
        if (parentText.includes(optionText.toLowerCase())) {
          radio.click();
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // Strategy 3: Check for label elements associated with radios
      for (const radio of radios) {
        const associatedLabel = document.querySelector(`label[for="${radio.id}"]`);
        const labelText = associatedLabel?.textContent?.trim().toLowerCase() || '';
        if (labelText.includes(optionText.toLowerCase())) {
          radio.click();
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // Strategy 4: For Yes/No questions, try clicking based on value attribute
      const optLower = optionText.toLowerCase();
      if (optLower === 'yes' || optLower === 'no') {
        for (const radio of radios) {
          const val = radio.value?.toLowerCase() || '';
          if (val === optLower || val === (optLower === 'yes' ? 'true' : 'false')) {
            radio.click();
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        // Last resort: Yes is typically the first option
        const idx = optLower === 'yes' ? 0 : 1;
        if (radios[idx]) {
          radios[idx].click();
          radios[idx].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, { modalSelector: SELECTORS.modal, question, optionText });
}

async function selectDropdownOption(page, label, optionText) {
  return await page.evaluate(({ modalSelector, label, optionText }) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) return false;

    const selects = modal.querySelectorAll('select');
    for (const select of selects) {
      const container = select.closest('.fb-dash-form-element');
      const selectLabel = container?.querySelector('label')?.textContent?.trim() || '';

      if (selectLabel.toLowerCase().includes(label.toLowerCase())) {
        const options = Array.from(select.querySelectorAll('option'));
        const match = options.find(o => o.textContent?.trim().toLowerCase().includes(optionText.toLowerCase()));
        if (match) {
          select.value = match.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }
    return false;
  }, { modalSelector: SELECTORS.modal, label, optionText });
}

/* ======================
   FALLBACK ANSWER LOGIC
====================== */
function getFallbackAnswer(question, options, resumeData) {
  const q = question.toLowerCase();
  const opts = options.map(o => o.toLowerCase());
  
  // Language proficiency questions
  if (FALLBACK_ANSWERS.languageProficiency.patterns.some(p => q.includes(p))) {
    // Check if it's about a language the user knows natively
    const userLangs = (resumeData.languages || []).map(l => 
      (typeof l === 'string' ? l : l.name || l.language || '').toLowerCase()
    );
    
    // Check which language this question is about
    for (const lang of FALLBACK_ANSWERS.languageProficiency.nativeLanguages) {
      if (q.includes(lang) && userLangs.some(ul => ul.includes(lang))) {
        // Find native/bilingual option
        const nativeOpt = options.find(o => o.toLowerCase().includes('native') || o.toLowerCase().includes('bilingual'));
        if (nativeOpt) return nativeOpt;
      }
    }
    
    // Check user's languages from resume
    for (const userLang of resumeData.languages || []) {
      const langName = (typeof userLang === 'string' ? userLang : userLang.name || userLang.language || '').toLowerCase();
      const proficiency = (typeof userLang === 'string' ? '' : userLang.level || userLang.proficiency || '').toLowerCase();
      
      if (q.includes(langName)) {
        if (proficiency.includes('native') || proficiency.includes('bilingual')) {
          return options.find(o => o.toLowerCase().includes('native') || o.toLowerCase().includes('bilingual')) || options[options.length - 1];
        }
        if (proficiency.includes('professional') || proficiency.includes('fluent')) {
          return options.find(o => o.toLowerCase().includes('professional')) || options[Math.max(0, options.length - 2)];
        }
      }
    }
    
    // Default to Professional for English if common
    if (q.includes('english')) {
      return options.find(o => o.toLowerCase().includes('professional')) || options[Math.max(0, options.length - 2)];
    }
    
    // For unknown languages, return None/No proficiency
    return options.find(o => o.toLowerCase().includes('none') || o.toLowerCase().includes('no proficiency')) || options[0];
  }
  
  // Commute/relocation questions - answer Yes
  if (FALLBACK_ANSWERS.commute.patterns.some(p => q.includes(p))) {
    return options.find(o => FALLBACK_ANSWERS.commute.yesOptions.some(y => o.toLowerCase().includes(y))) || options[0];
  }
  
  // Work authorization - answer Yes
  if (FALLBACK_ANSWERS.workAuth.patterns.some(p => q.includes(p))) {
    return options.find(o => FALLBACK_ANSWERS.workAuth.yesOptions.some(y => o.toLowerCase().includes(y))) || options[0];
  }
  
  // Sponsorship - answer No
  if (FALLBACK_ANSWERS.sponsorship.patterns.some(p => q.includes(p))) {
    return options.find(o => FALLBACK_ANSWERS.sponsorship.noOptions.some(n => o.toLowerCase().includes(n))) || options[0];
  }
  
  // For Yes/No questions, try to be positive
  if (opts.length === 2 && opts.includes('yes') && opts.includes('no')) {
    return options.find(o => o.toLowerCase() === 'yes') || options[0];
  }
  
  // Default: return first option
  return options[0];
}

/* ======================
   AI QUESTION ANSWERING
====================== */
async function answerQuestionsWithAI(page, resumeData) {
  log("Using AI to answer additional questions...");

  const formData = await getFormFields(page);
  log("Form fields:", formData);

  if (formData.fields.length === 0 && formData.radioGroups.length === 0 && formData.dropdowns.length === 0) {
    log("No fields to fill");
    return true;
  }

  // Try AI first with retry logic, then fall back to predefined answers
  let answers = null;
  let aiSuccess = false;
  const maxRetries = 3;
  const baseDelay = 5000; // 5 seconds

  // Echo the API key (masked for security)
  const apiKey = process.env.HF_API_KEY;
  log(`Using Hugging Face API Key: ${apiKey ? apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT SET'}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`AI attempt ${attempt}/${maxRetries}...`);
      
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api-inference.huggingface.co/v1/",
      });

      const prompt = `You are helping fill a job application form. Answer each question based on the resume data.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Form Fields:
${JSON.stringify(formData, null, 2)}

Rules:
- Work authorization: Yes
- Sponsorship: No
- Willing to relocate: Yes
- Comfortable commuting: Yes
- For language proficiency: If language in resume use that level, otherwise "Professional" for English, "None" for others
- Years of experience: calculate from resume or use 3 as default
- IMPORTANT: For radio groups, the answer must EXACTLY match one of the provided options
- IMPORTANT: For dropdowns, the answer must EXACTLY match one of the provided options

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "fields": [{"label": "...", "value": "..."}],
  "radioGroups": [{"question": "...", "answer": "..."}],
  "dropdowns": [{"label": "...", "answer": "..."}]
}`;

      const response = await client.chat.completions.create({
        model: "meta-llama/Llama-3.2-3B-Instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 1024,
      });
      
      const responseText = response.choices[0]?.message?.content || '';
      log("AI Response:", responseText);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        answers = JSON.parse(jsonMatch[0]);
        aiSuccess = true;
        break;
      } else {
        log("Could not parse AI response, will retry or use fallback");
      }
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate');
      log(`AI attempt ${attempt} failed: ${error.message}`);
      
      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        log(`Rate limited. Waiting ${delay/1000}s before retry...`);
        await sleep(delay);
      } else if (attempt >= maxRetries) {
        log("Max retries reached, using fallback answers");
      }
    }
  }

  // If AI failed, generate fallback answers
  if (!aiSuccess) {
    log("Using fallback answers for form fields...");
    answers = {
      fields: [],
      radioGroups: [],
      dropdowns: []
    };
    
    // Generate fallback for dropdowns
    for (const dropdown of formData.dropdowns || []) {
      const answer = getFallbackAnswer(dropdown.label, dropdown.options, resumeData);
      answers.dropdowns.push({ label: dropdown.label, answer });
      log(`Fallback dropdown: ${dropdown.label} -> ${answer}`);
    }
    
    // Generate fallback for radio groups
    for (const radio of formData.radioGroups || []) {
      const answer = getFallbackAnswer(radio.question, radio.options, resumeData);
      answers.radioGroups.push({ question: radio.question, answer });
      log(`Fallback radio: ${radio.question} -> ${answer}`);
    }
    
    // Text fields - use resume data or defaults
    for (const field of formData.fields || []) {
      const label = field.label.toLowerCase();
      let value = '';
      
      if (label.includes('year') && label.includes('experience')) {
        value = FALLBACK_ANSWERS.experience.defaultYears;
      } else if (label.includes('phone')) {
        value = resumeData.phone || '';
      } else if (label.includes('email')) {
        value = resumeData.email || '';
      } else if (label.includes('name')) {
        value = resumeData.fullName || '';
      } else if (label.includes('linkedin')) {
        value = resumeData.linkedin || '';
      } else if (label.includes('city') || label.includes('location')) {
        value = resumeData.location || '';
      }
      
      if (value) {
        answers.fields.push({ label: field.label, value });
        log(`Fallback field: ${field.label} -> ${value}`);
      }
    }
  }

  // Apply the answers (from AI or fallback)
  try {
    // Fill fields
    for (const field of answers.fields || []) {
      if (field.label && field.value) {
        await fillField(page, field.label, field.value);
        log(`Filled: ${field.label}`);
      }
    }

    // Select radios
    for (const radio of answers.radioGroups || []) {
      if (radio.question && radio.answer) {
        await selectRadio(page, radio.question, radio.answer);
        log(`Selected radio: ${radio.question} -> ${radio.answer}`);
      }
    }

    // Select dropdowns
    for (const dropdown of answers.dropdowns || []) {
      if (dropdown.label && dropdown.answer) {
        await selectDropdownOption(page, dropdown.label, dropdown.answer);
        log(`Selected dropdown: ${dropdown.label} -> ${dropdown.answer}`);
      }
    }

    return true;
  } catch (error) {
    log(`AI error: ${error.message}`);
    return false;
  }
}

/* ======================
   MAIN APPLICATION FLOW
====================== */
export async function applyToJob(jobUrl, resumeData, onProgress = null) {
  // Helper to report progress
  const reportProgress = (step) => {
    log(`Progress: ${step}`);
    if (onProgress && typeof onProgress === 'function') {
      try {
        onProgress(step);
      } catch (e) {
        // Ignore callback errors
      }
    }
  };

  log("=== Starting LinkedIn Easy Apply ===");
  log(`Job URL: ${jobUrl}`);
  reportProgress('browser_launching');

  let browser = null;

  try {
    // Step 1: Launch browser
    log("Step 1: Launching browser...");
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await loadCookiesIntoContext(context);
    const page = await context.newPage();
    reportProgress('browser_opened');

    // Step 2: Navigate to LinkedIn
    log("Step 2: Navigating to LinkedIn...");
    reportProgress('navigating_linkedin');
    await page.goto("https://www.linkedin.com", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    if (page.url().includes("login") || page.url().includes("authwall")) {
      throw new Error("Not logged in. Update cookies.");
    }
    log("Logged in to LinkedIn");
    reportProgress('logged_in');

    // Step 3: Navigate to job
    log("Step 3: Navigating to job...");
    reportProgress('navigating_job');
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    reportProgress('job_page_loaded');

    // Step 3.5: Close any popup modals that might appear before Easy Apply
    log("Checking for popup modals to close...");
    try {
      const closeSelectors = [
        'button[data-test-modal-close-btn]',
        'button[aria-label="Dismiss"]',
        'button[aria-label="Close"]',
        '.artdeco-modal__dismiss',
        '.msg-overlay-bubble-header__control--close',
        'button.artdeco-toast-item__dismiss'
      ];
      
      for (const selector of closeSelectors) {
        const closeBtn = await page.$(selector);
        if (closeBtn) {
          const isVisible = await closeBtn.isVisible().catch(() => false);
          if (isVisible) {
            await closeBtn.click();
            log(`Closed popup via: ${selector}`);
            await page.waitForTimeout(500);
          }
        }
      }
    } catch (e) {
      log(`No popups to close or error: ${e.message}`);
    }

    // Step 4: Check if already applied, then Click Easy Apply
    log("Step 4: Checking application status & clicking Easy Apply...");
    reportProgress('checking_applied_status');
    
    // Check for "Applied X ago" indicator (already applied)
    const alreadyAppliedIndicator = await page.$('.artdeco-inline-feedback--success');
    if (alreadyAppliedIndicator) {
      const appliedText = await alreadyAppliedIndicator.textContent().catch(() => '');
      if (appliedText.toLowerCase().includes('applied')) {
        log(`⚠️ Already applied to this job: ${appliedText.trim()}`);
        reportProgress('already_applied');
        return { success: false, reason: "Already applied", details: appliedText.trim() };
      }
    }
    
    // Also check for text-based "Applied" indicator
    const appliedBadge = await page.$('text="Applied"');
    if (appliedBadge) {
      log("⚠️ Already applied to this job (badge found)");
      reportProgress('already_applied');
      return { success: false, reason: "Already applied" };
    }
    
    reportProgress('clicking_easy_apply');
    let easyApplyBtn = await page.$(SELECTORS.easyApplyButton) || await page.$(SELECTORS.easyApplyButtonAlt);
    if (!easyApplyBtn) {
      throw new Error("Easy Apply button not found");
    }
    await easyApplyBtn.click();
    await page.waitForTimeout(2000);
    await page.waitForSelector(SELECTORS.modal, { timeout: 10000 });
    log("Modal opened");
    reportProgress('modal_opened');

    // Step 5: Process pages
    let maxIterations = 15;
    let applicationComplete = false;
    let submitClicked = false;

    for (let i = 0; i < maxIterations && !applicationComplete; i++) {
      await page.waitForTimeout(1000);

      // CHECK FOR SUCCESS FIRST (after every action)
      if (await checkForSuccess(page)) {
        log("✅ Application submitted successfully!");
        reportProgress('submitted_success');
        applicationComplete = true;
        break;
      }

      const pageType = await detectPageType(page);
      log(`Page ${i + 1}: ${pageType}`);
      reportProgress(`page_${i + 1}_${pageType.toLowerCase()}`);

      // If modal is gone after submit, we're done
      if (submitClicked || pageType === 'UNKNOWN') {
        const modalExists = await page.$(SELECTORS.modal);
        if (!modalExists) {
          // Double check for success message
          if (await checkForSuccess(page)) {
            log("✅ Application submitted! (modal closed)");
            reportProgress('submitted_success');
            applicationComplete = true;
            break;
          }
        }
      }

      switch (pageType) {
        case 'SUCCESS':
          log("✅ Application submitted!");
          reportProgress('submitted_success');
          applicationComplete = true;
          break;

        case 'CONTACT_INFO':
          reportProgress('filling_contact_info');
          await clickNextButton(page);
          // Check for success after click (some jobs submit after first Next!)
          await page.waitForTimeout(1000);
          if (await checkForSuccess(page)) {
            log("✅ Application submitted! (after Next)");
            reportProgress('submitted_success');
            applicationComplete = true;
          }
          break;

        case 'RESUME':
          reportProgress('selecting_resume');
          await clickNextButton(page);
          await page.waitForTimeout(1000);
          if (await checkForSuccess(page)) {
            log("✅ Application submitted! (after Next)");
            reportProgress('submitted_success');
            applicationComplete = true;
          }
          break;

        case 'TOP_CHOICE':
          reportProgress('handling_top_choice');
          await clickNextButton(page);
          await page.waitForTimeout(1000);
          if (await checkForSuccess(page)) {
            log("✅ Application submitted! (after Next)");
            reportProgress('submitted_success');
            applicationComplete = true;
          }
          break;

        case 'UNKNOWN':
          // Check if modal still exists
          const modalStillOpen = await page.$(SELECTORS.modal);
          if (!modalStillOpen) {
            // Modal is closed - check if success
            if (await checkForSuccess(page)) {
              log("✅ Application submitted! (modal closed)");
              reportProgress('submitted_success');
              applicationComplete = true;
            }
          } else {
            // Modal is open but unknown type - try to click next
            await clickNextButton(page);
          }
          break;

        case 'REVIEW':
          reportProgress('reviewing_application');
          const submitted = await clickSubmitButton(page);
          if (submitted) {
            submitClicked = true;
            reportProgress('submitting_application');
            await page.waitForTimeout(2000);

            // Check for success
            if (await checkForSuccess(page)) {
              log("✅ Application submitted successfully!");
              reportProgress('submitted_success');
              applicationComplete = true;
            }
          }
          break;

        case 'ADDITIONAL_QUESTIONS':
          reportProgress('answering_questions');
          await answerQuestionsWithAI(page, resumeData);
          await page.waitForTimeout(500);
          await clickNextButton(page);
          // Check for success after answering questions
          await page.waitForTimeout(1000);
          if (await checkForSuccess(page)) {
            log("✅ Application submitted! (after questions)");
            reportProgress('submitted_success');
            applicationComplete = true;
          }
          break;
      }
    }

    return { success: applicationComplete };

  } catch (error) {
    log(`ERROR: ${error.message}`);
    reportProgress('error');
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      log("Closing browser...");
      reportProgress('closing_browser');
      await browser.close().catch(() => { });
    }
  }
}

/* ======================
   STANDALONE EXECUTION
====================== */
if (process.argv[1]?.includes('agentAI')) {
  const testJobUrl = process.argv[2] || "https://www.linkedin.com/jobs/search/?currentJobId=4346572897";

  console.log("\n=== LinkedIn Easy Apply Bot ===");
  console.log(`Job URL: ${testJobUrl}\n`);

  const resumeData = {
    fullName: "Mohammad Kayyali",
    email: "mohammadkayyali15@gmail.com",
    phone: "+962796214574",
    location: "Amman, Jordan",
    title: "Software Engineer",
    summary: "Results-driven Software Engineer with 5 years of experience.",
    skills: ["Java", "Python", "JavaScript", "Node.js", "React", "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB"],
    experience: [{ title: "Senior Software Engineer", company: "Tech Solutions Inc.", startDate: "2023-05", current: true, yearsOfExperience: 5 }],
    education: [{ degree: "Bachelor's Degree", field: "Computer Science", school: "MIT", graduationDate: "2019" }],
    languages: [{ language: "English", proficiency: "Native" }, { language: "Arabic", proficiency: "Native" }],
    workAuthorization: "Yes",
    requiresSponsorship: "No",
    willingToRelocate: "Yes"
  };

  applyToJob(testJobUrl, resumeData)
    .then(result => {
      console.log("\n=== RESULT ===");
      console.log(result);
    })
    .catch(error => console.error("Error:", error.message));
}
