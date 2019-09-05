'use strict';
var bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hash = await saltPasswordAsync('password', 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return Promise.all([
      queryInterface.bulkInsert(
        'users',
        [{
          name: 'Super User',
          email: 'super@admin.com',
          password: hash,
          isActive: true,
          createdAt: now,
          updatedAt: now
        },{
          name: 'Admin User',
          email: 'user@admin.com',
          password: hash,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }]
      ),
      queryInterface.bulkInsert(
        'roles',
        [{
          name: 'SUPER',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ADMIN',
          createdAt: now,
          updatedAt: now
        }]
      )
      ,
      queryInterface.bulkInsert(
        'permissions',
        [{
          name: 'ALL_USERS',
          createdAt: now,
          updatedAt: now
        },{
          name: 'GET_USER',
          createdAt: now,
          updatedAt: now
        },{
          name: 'USER_ADD',
          createdAt: now,
          updatedAt: now
        },{
          name: 'USER_UPDATE',
          createdAt: now,
          updatedAt: now
        },{
          name: 'USER_DELETE',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ALL_ROLE',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ALL_PERMISSION',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ROLE_ADD',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ROLE_UPDATE',
          createdAt: now,
          updatedAt: now
        },{
          name: 'ROLE_DELETE',
          createdAt: now,
          updatedAt: now
        }]
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.bulkDelete('permissions', null, {}),
      queryInterface.bulkDelete('roles', null, {}),
      queryInterface.bulkDelete('users', null, {})
    ]);
  }
};


const saltPasswordAsync = (password, rounds) => new Promise((resolve, reject) => {
  bcrypt.hash(password, rounds, (err, hash) => {
    if (err) reject(err);
    else resolve(hash);
  });
});