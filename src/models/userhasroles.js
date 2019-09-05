'use strict';
module.exports = (sequelize, DataTypes) => {
  const userHasRoles = sequelize.define('userHasRoles', {
    user_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER
  }, {});
  userHasRoles.associate = function(models) {
    // associations can be defined here
    userHasRoles.belongsTo(models.role, { as: 'role', foreignKey: 'role_id', constraints: false });
    userHasRoles.belongsTo(models.user, { as: 'user', foreignKey: 'user_id', constraints: false });
  };
  return userHasRoles;
};