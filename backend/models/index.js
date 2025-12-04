const User = require('./User');
const Education = require('./Education');
const Experience = require('./Experience');
const Skill = require('./Skill');
const Language = require('./Language');
const Resume = require('./Resume'); // Add this
const JobApplication = require('./JobApplication');
const Job = require('./Job');
const Course = require('./Course');
const GraduationProject = require('./GraduationProject');

// Define associations
User.hasMany(Education, { foreignKey: 'userId', as: 'education' });
Education.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Experience, { foreignKey: 'userId', as: 'experience' });
Experience.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Skill, { foreignKey: 'userId', as: 'skills' });
Skill.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Language, { foreignKey: 'userId', as: 'languages' });
Language.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' }); // Add this
Resume.belongsTo(User, { foreignKey: 'userId' }); // Add this

User.hasMany(JobApplication, { foreignKey: 'userId', as: 'applications' });
JobApplication.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Course, { foreignKey: 'userId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(GraduationProject, { foreignKey: 'userId', as: 'graduationProject' });
GraduationProject.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Education,
  Experience,
  Skill,
  Language,
  Resume, // Add this
  JobApplication,
  Job,
  Course,
  GraduationProject
};