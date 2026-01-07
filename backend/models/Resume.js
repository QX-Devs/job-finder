// models/Resume.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'My Resume'
  },
  template: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'modern'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      personalInfo: {},
      summary: '',
      experience: [],
      education: [],
      skills: [],
      languages: [],
      projects: []
    }
  },
  currentStep: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Current step in the CV generator (1-5)'
  },
  isComplete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the resume has been fully completed and saved'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastModified: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Resume;