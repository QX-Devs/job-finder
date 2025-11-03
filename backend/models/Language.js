const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Language = sequelize.define('Language', {
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
  language: {
    type: DataTypes.STRING,
    allowNull: false
  },
  proficiency: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Language;