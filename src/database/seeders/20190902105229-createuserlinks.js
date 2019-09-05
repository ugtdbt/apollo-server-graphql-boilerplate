'use strict';
const { user, role, permission } = require('./../../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let Op = Sequelize.Op;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let User = await user.findOne({
      where: { 
       'email': "super@admin.com"
      },
    });

    let one_role = await role.findOne({
      where: { 
       'name': "SUPER"
      },
    });

    let m_permissions = await permission.findAll({
      where: { 
       'name': { [Op.notIn] : ["USER_DELETE"]}
      },
    }).then(permissions => {
      let permissions_arry = [];
      for (let a = 0; a < permissions.length; a++) {
        permissions_arry.push({
          id : permissions[a].id
        });
      }
      return permissions_arry;
  });

    let one_permission = await permission.findOne({
      where: { 
       'name': "USER_DELETE"
      },
    });

    let user_role = [
      {
        user_id: User.id,
        role_id: one_role.id,
        createdAt: now,
        updatedAt: now
      }
    ];
    let role_permissions = [];
    for (let i = 0; i < m_permissions.length; i++) { 
      role_permissions.push({
        permission_id: m_permissions[i].id,
        role_id: one_role.id,
        createdAt: now,
        updatedAt: now
      });
    }
    let user_permission = [
      {
        user_id: User.id,
        permission_id: one_permission.id,
        createdAt: now,
        updatedAt: now
      }
    ];

    return Promise.all([
      queryInterface.bulkInsert(
        'userHasRoles',
        user_role
      ),
      queryInterface.bulkInsert(
        'userHasPermissions',
        user_permission
      ),
      queryInterface.bulkInsert(
        'roleHasPermissions',
        role_permissions
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.bulkDelete('userHasRoles', null, {}),
      queryInterface.bulkDelete('userHasPermissions', null, {}),
      queryInterface.bulkDelete('roleHasPermissions', null, {})
    ]);
  }
};
