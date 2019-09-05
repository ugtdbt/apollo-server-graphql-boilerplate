'use strict';
module.exports = (sequelize, DataTypes) => {
  const role = sequelize.define('role', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate:{
        notEmpty:{
            args:true,
            msg:"Name required"
        }
      },
      unique: {
        args:true,
        msg: 'Name already in use!'
      }
    }
  }, {});
  role.associate = function(models) {
    // associations can be defined here

    role.belongsToMany(models.permission, {
      through: 'roleHasPermissions',
      as: 'permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id'
    });

    role.belongsToMany(models.user, {
      through: 'userHasRoles',
      as: 'users',
      foreignKey: 'role_id',
      otherKey: 'user_id'
    });
  };
  return role;
};