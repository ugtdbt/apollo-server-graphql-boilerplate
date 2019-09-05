'use strict';
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate:{
        notEmpty:{
            args:true,
            msg:"Email-id required"
        },
        isEmail:{
            args:true,
            msg:'Valid email-id required'
        }
      },
      unique: {
        args:true,
        msg: 'Email address already in use!'
      }
    },
    password: DataTypes.STRING,
    isActive: DataTypes.BOOLEAN
  }, {});
  user.associate = function(models) {

    // associations can be defined here
    
    user.belongsToMany(models.role, {
      through: 'userHasRoles',
      as: 'roles',
      foreignKey: 'user_id',
      otherKey: 'role_id'
    });

    user.belongsToMany(models.permission, {
      through: 'userHasPermissions',
      as: 'permissions',
      foreignKey: 'user_id',
      otherKey: 'permission_id'
    });

    user.findByLogin = async (email) => {
      let User = await user.findOne({
        where: { email },
      })
      if (!User) {
        User = false
      }
      return User;
    }

    user.prototype.generatePasswordHash = function () {
      const saltRounds = 10;
      return bcrypt.hash(this.password, saltRounds);
    };

    user.prototype.validatePassword = function (password) {
      return bcrypt.compare(password, this.password);
    };
    user.findAllQuery = async (req, page, limit) => {

      let defaultlimit = process.env.DEFAULT_LIMIT;
      let offset = process.env.DEFAULT_OFFSET;
  
      page = (page===undefined)?1:page;
      page = parseInt(page);
  
      limit = (limit===undefined)?defaultlimit:limit;
      limit = parseInt(limit);
  
      offset = limit * (page - 1);
  
      let recordcountdata = await user.findAndCountAll();
      let pages = Math.ceil(recordcountdata.count / limit);
    
      return {
        rows: await user.findAll({
          limit: limit,
          offset: offset,
          include: [
            { model: models.permission, as: 'permissions' },
            { model: models.role, as: 'roles', include: [
              { model: models.permission, as: 'permissions' }
            ]
          }]
        }),
        count: recordcountdata.count,
        pages: pages
      };
    };
  };
  
  return user;
};