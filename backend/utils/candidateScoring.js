/**
 * ATS Smart Ranking Algorithm
 * Calculates candidate scores with dynamic weights based on graduate status
 */

/**
 * Calculate total years of experience from experience array
 */
function calculateTotalExperience(experienceArray) {
  if (!Array.isArray(experienceArray) || experienceArray.length === 0) return 0;
  
  const dates = [];
  experienceArray.forEach(exp => {
    if (exp.startDate) {
      const [year, month] = exp.startDate.split('-').map(Number);
      if (year) {
        dates.push(new Date(year, (month || 1) - 1, 1));
      }
    }
  });
  
  if (dates.length === 0) return 0;
  
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const currentDate = new Date();
  
  const years = currentDate.getFullYear() - earliestDate.getFullYear();
  const months = currentDate.getMonth() - earliestDate.getMonth();
  
  const totalMonths = years * 12 + months;
  const totalYears = Math.floor(totalMonths / 12);
  
  return totalYears;
}

/**
 * Calculate experience score
 */
function calculateExperienceScore(experienceArray, isGraduate) {
  if (isGraduate) {
    return 0;
  }
  
  const totalYears = calculateTotalExperience(experienceArray);
  return Math.min(totalYears / 10, 1);
}

/**
 * Calculate skills score based on job requirements
 */
function calculateSkillsScore(candidateSkills, jobRequiredSkills) {
  if (!Array.isArray(candidateSkills) || candidateSkills.length === 0) return 0;
  if (!Array.isArray(jobRequiredSkills) || jobRequiredSkills.length === 0) return 0;
  
  // Normalize skills to lowercase for comparison
  const candidateSkillsNormalized = candidateSkills.map(skill => {
    const skillName = typeof skill === 'string' ? skill : (skill.skillName || skill.name || String(skill));
    return skillName.toLowerCase().trim();
  }).filter(Boolean);
  
  const jobSkillsNormalized = jobRequiredSkills.map(skill => {
    const skillName = typeof skill === 'string' ? skill : String(skill);
    return skillName.toLowerCase().trim();
  }).filter(Boolean);
  
  // Count matched skills
  const matchedSkills = candidateSkillsNormalized.filter(candidateSkill => 
    jobSkillsNormalized.some(jobSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )
  ).length;
  
  return Math.min(matchedSkills / jobRequiredSkills.length, 1);
}

/**
 * Calculate courses score
 */
function calculateCoursesScore(courses, jobCategory) {
  if (!Array.isArray(courses) || courses.length === 0) return 0;
  
  // If job category is provided, filter relevant courses
  let relevantCourses = courses;
  if (jobCategory) {
    const categoryLower = jobCategory.toLowerCase();
    relevantCourses = courses.filter(course => {
      const courseName = (course.courseName || '').toLowerCase();
      const courseCategory = (course.category || '').toLowerCase();
      return courseName.includes(categoryLower) || courseCategory.includes(categoryLower);
    });
  }
  
  return Math.min(relevantCourses.length / 5, 1);
}

/**
 * Calculate education score based on degree level
 */
function calculateEducationScore(educationArray) {
  if (!Array.isArray(educationArray) || educationArray.length === 0) return 0;
  
  // Get highest degree
  let highestScore = 0;
  educationArray.forEach(edu => {
    const degree = (edu.degree || '').toLowerCase();
    let score = 0;
    
    if (degree.includes('phd') || degree.includes('doctorate')) {
      score = 1.0;
    } else if (degree.includes('master')) {
      score = 0.9;
    } else if (degree.includes('bachelor') || degree.includes('bachelor')) {
      score = 0.7;
    } else if (degree.includes('diploma') || degree.includes('associate')) {
      score = 0.5;
    }
    
    if (score > highestScore) {
      highestScore = score;
    }
  });
  
  return highestScore;
}

/**
 * Calculate general score (placeholder for other factors)
 * Can include: certifications, languages, projects, etc.
 */
function calculateGeneralScore(candidate) {
  // Base score from having complete profile
  let score = 0.1;
  
  // Add points for having professional summary
  if (candidate.professionalSummary && candidate.professionalSummary.trim().length > 50) {
    score += 0.1;
  }
  
  // Add points for having GitHub/LinkedIn
  if (candidate.github) score += 0.05;
  if (candidate.linkedin) score += 0.05;
  
  // Add points for languages
  if (candidate.languages && Array.isArray(candidate.languages) && candidate.languages.length > 0) {
    score += Math.min(candidate.languages.length * 0.05, 0.2);
  }
  
  return Math.min(score, 1);
}

/**
 * Main scoring function
 * @param {Object} candidate - Candidate user object with experience, skills, education, courses
 * @param {Object} job - Job object with requiredSkills and category
 * @returns {Object} Score breakdown and final score
 */
function calculateCandidateScore(candidate, job = {}) {
  const isGraduate = candidate.isGraduate === true;
  
  // Dynamic weight distribution
  let WEIGHT_EXPERIENCE, WEIGHT_SKILLS, WEIGHT_COURSES, WEIGHT_EDUCATION, WEIGHT_GENERAL;
  
  if (isGraduate) {
    // Case A: Graduate weights
    WEIGHT_EXPERIENCE = 0.0;
    WEIGHT_COURSES = 0.35;
    WEIGHT_SKILLS = 0.35;
    WEIGHT_EDUCATION = 0.20;
    WEIGHT_GENERAL = 0.10;
  } else {
    // Case B: Non-graduate weights
    WEIGHT_EXPERIENCE = 0.45;
    WEIGHT_SKILLS = 0.30;
    WEIGHT_COURSES = 0.10;
    WEIGHT_EDUCATION = 0.10;
    WEIGHT_GENERAL = 0.05;
  }
  
  // Calculate individual scores
  const experienceScore = calculateExperienceScore(
    candidate.experience || [],
    isGraduate
  );
  
  const skillsScore = calculateSkillsScore(
    candidate.skills || [],
    job.requiredSkills || job.skills || []
  );
  
  const coursesScore = calculateCoursesScore(
    candidate.courses || [],
    job.category
  );
  
  const educationScore = calculateEducationScore(
    candidate.education || []
  );
  
  let generalScore = calculateGeneralScore(candidate);
  
  // For graduates, add project skills and graduation project description scoring
  if (isGraduate) {
    // Add project skills score: each skill adds 0.05 (max 1.0 for 20 skills)
    if (candidate.projectSkills && Array.isArray(candidate.projectSkills)) {
      const projectSkillsScore = Math.min(candidate.projectSkills.length * 0.05, 1.0);
      generalScore = Math.min(generalScore + projectSkillsScore, 1.0);
    }
    
    // Add graduation project description depth score: (description.length / 500) * 0.2
    if (candidate.graduationProject && candidate.graduationProject.description) {
      const descriptionLength = candidate.graduationProject.description.length;
      const descriptionScore = Math.min((descriptionLength / 500) * 0.2, 0.2);
      generalScore = Math.min(generalScore + descriptionScore, 1.0);
    }
  }
  
  // Calculate final score
  const finalScore = 
    experienceScore * WEIGHT_EXPERIENCE +
    skillsScore * WEIGHT_SKILLS +
    coursesScore * WEIGHT_COURSES +
    educationScore * WEIGHT_EDUCATION +
    generalScore * WEIGHT_GENERAL;
  
  return {
    finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    breakdown: {
      experienceScore: Math.round(experienceScore * 100) / 100,
      skillsScore: Math.round(skillsScore * 100) / 100,
      coursesScore: Math.round(coursesScore * 100) / 100,
      educationScore: Math.round(educationScore * 100) / 100,
      generalScore: Math.round(generalScore * 100) / 100
    },
    weights: {
      experience: WEIGHT_EXPERIENCE,
      skills: WEIGHT_SKILLS,
      courses: WEIGHT_COURSES,
      education: WEIGHT_EDUCATION,
      general: WEIGHT_GENERAL
    }
  };
}

/**
 * Rank candidates by score
 * @param {Array} candidates - Array of candidate objects
 * @param {Object} job - Job object
 * @returns {Array} Sorted candidates with scores
 */
function rankCandidates(candidates, job) {
  if (!Array.isArray(candidates)) return [];
  
  const candidatesWithScores = candidates.map(candidate => {
    const scoreData = calculateCandidateScore(candidate, job);
    return {
      ...candidate,
      score: scoreData.finalScore,
      scoreBreakdown: scoreData.breakdown,
      scoreWeights: scoreData.weights
    };
  });
  
  // Sort by final score descending
  return candidatesWithScores.sort((a, b) => b.score - a.score);
}

module.exports = {
  calculateCandidateScore,
  rankCandidates,
  calculateExperienceScore,
  calculateSkillsScore,
  calculateCoursesScore,
  calculateEducationScore,
  calculateGeneralScore
};

