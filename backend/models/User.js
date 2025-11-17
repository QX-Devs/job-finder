const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  countryCode: {
    type: DataTypes.STRING,
    defaultValue: '+962'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employmentStatus: {
    type: DataTypes.ENUM('Graduate', 'Student', 'Experienced'),
    allowNull: true
  },
  careerObjective: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resumeVisibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  github: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'GitHub must be a valid URL',
        args: true
      },
      notEmpty: false // Allow empty strings (will be converted to null)
    }
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'LinkedIn must be a valid URL',
        args: true
      },
      notEmpty: false // Allow empty strings (will be converted to null)
    }
  },
  professionalSummary: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;