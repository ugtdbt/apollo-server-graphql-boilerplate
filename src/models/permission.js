'use strict';
module.exports = (sequelize, DataTypes) => {
  const permission = sequelize.define('permission', {
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
  permission.associate = function(models) {
    // associations can be defined here

    permission.belongsToMany(models.role, {
      through: 'roleHasPermissions',
      as: 'roles',
      foreignKey: 'permission_id',
      otherKey: 'role_id'
    });

    permission.belongsToMany(models.user, {
      through: 'userHasPermissions',
      as: 'users',
      foreignKey: 'permission_id',
      otherKey: 'user_id'
    });
  };
  return permission;
};