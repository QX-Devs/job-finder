const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GraduationProject = sequelize.define('GraduationProject', {
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
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [200, 5000] // Minimum 200 characters
    }
  },
  technologies: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true // e.g., "6 months", "1 semester"
  },
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      // Only validate URL format if a value is provided
      isUrlOrEmpty(value) {
        if (value && value.trim() !== '') {
          const urlPattern = /^https?:\/\/.+/;
          if (!urlPattern.test(value)) {
            throw new Error('GitHub URL must be a valid URL starting with http:// or https://');
          }
        }
      }
    }
  },
  supervisor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  projectSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    validate: {
      minSkills(value) {
        if (value && value.length < 5) {
          throw new Error('At least 5 project skills are required');
        }
      }
    }
  }
}, {
  timestamps: true
});

module.exports = GraduationProject;

