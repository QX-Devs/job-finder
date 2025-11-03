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