const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Experience = sequelize.define('Experience', {
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
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isAfterStartDate(value) {
        // Only validate if both dates exist and it's not a current job
        if (this.startDate && value && !this.isCurrentJob) {
          const start = new Date(this.startDate);
          const end = new Date(value);
          if (end < start) {
            throw new Error('End date must be later than start date.');
          }
        }
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isCurrentJob: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isGraduationProject: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
  }
}, {
  timestamps: true,
  validate: {
    dateRangeValidation() {
      // Additional validation hook to check date range
      if (this.startDate && this.endDate && !this.isCurrentJob) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        if (end < start) {
          throw new Error('End date must be later than start date.');
        }
      }
    }
  }
});

module.exports = Experience;