const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  company: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  apply_url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'JSearch API'
  },
  posted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  source_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedin_job_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  easy_apply: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  company_logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  job_insights: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['title', 'company', 'apply_url'],
      name: 'unique_job_constraint'
    },
    {
      unique: true,
      fields: ['source_id'],
      name: 'unique_source_id'
    },
    {
      unique: true,
      fields: ['linkedin_job_id'],
      name: 'unique_linkedin_job_id'
    }
  ]
});

module.exports = Job;

