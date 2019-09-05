'use strict';
module.exports = (sequelize, DataTypes) => {
  const passwordReset = sequelize.define('passwordReset', {
    email: DataTypes.STRING,
    token: DataTypes.STRING
  }, {});
  passwordReset.associate = function(models) {
    // associations can be defined here
    passwordReset.updateOrCreate = async ({ email, token}) => {
      let passwordresetobj = await passwordReset.findOne({
        where: { email },
      });
      if (passwordresetobj)
      {
        return passwordresetobj.update({ token: token });
      }
      else
      {
        return passwordReset.create({ email: email, token: token });
      }
    }
  };
  return passwordReset;
};