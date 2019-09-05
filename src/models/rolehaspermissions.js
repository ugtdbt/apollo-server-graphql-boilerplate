'use strict';
module.exports = (sequelize, DataTypes) => {
  const roleHasPermissions = sequelize.define('roleHasPermissions', {
    permission_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER
  }, {});
  roleHasPermissions.associate = function(models) {
    // associations can be defined here
    roleHasPermissions.belongsTo(models.permission, { as: 'permission', foreignKey: 'permission_id', constraints: false });
    roleHasPermissions.belongsTo(models.role, { as: 'role', foreignKey: 'role_id', constraints: false });
  };
  return roleHasPermissions;
};