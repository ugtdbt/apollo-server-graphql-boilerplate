'use strict';
module.exports = (sequelize, DataTypes) => {
  const userHasPermissions = sequelize.define('userHasPermissions', {
    user_id: DataTypes.INTEGER,
    permission_id: DataTypes.INTEGER
  }, {});
  userHasPermissions.associate = function(models) {
    // associations can be defined here
    userHasPermissions.belongsTo(models.permission, { as: 'permission', foreignKey: 'permission_id', constraints: false });
    userHasPermissions.belongsTo(models.user, { as: 'user', foreignKey: 'user_id', constraints: false });
  };
  return userHasPermissions;
};