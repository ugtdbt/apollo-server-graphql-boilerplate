const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server');
const base64 = require('base-64');
const utf8 = require('utf8');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const emaillibrary = require('./../librarys/email');
const { isAuth } = require('./../helpers/authenticated');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


const USER_ADDED = 'USER_ADDED';
const USER_UPDATED = 'USER_UPDATED';
const USER_DELETED = 'USER_DELETED';
const ROLE_ADDED = 'ROLE_ADDED';
const ROLE_UPDATED = 'ROLE_UPDATED';
const ROLE_DELETED = 'ROLE_DELETED';


const createToken = async (user, secret, expiresIn) => {
    const {
      id, name, email, isActive
    } = user;
    return jwt.sign({
        id, name, email, isActive
    }, secret, {
        expiresIn,
    })
}

module.exports =  {

  Subscription: {
    userAdded: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "USER_ADD");
        return pubsub.asyncIterator([USER_ADDED]);
      },
    },
    userUpdated: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "USER_UPDATE");
        return pubsub.asyncIterator([USER_UPDATED]);
      },
    },
    userDeleted: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "USER_DELETE");
        return pubsub.asyncIterator([USER_DELETED]);
      },
    },
    roleAdded: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "ROLE_ADD");
        return pubsub.asyncIterator([ROLE_ADDED]);
      },
    },
    roleUpdated: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "ROLE_UPDATE");
        return pubsub.asyncIterator([ROLE_UPDATED]);
      },
    },
    roleDeleted: {
      subscribe: async (root, args, { pubsub, me }) => {
        await isAuth(me, "ROLE_DELETE");
        return pubsub.asyncIterator([ROLE_DELETED]);
      },
    },
  },

  Query: {
    async me(root, args, { models, me }) {
        if (!me) return null;
        const user = await models.user.findByPk(me.id, {include: [
          {model: models.permission, as: 'permissions'},
          {model: models.role, as: 'roles', include: [
            {model: models.permission, as: 'permissions'}
          ]}
        ]});
        return user;
    },
    async users(root, { page, limit }, { models, me, req }) {
      await isAuth(me, "ALL_USERS");
      return await models.user.findAllQuery(req, page, limit);
    },
    async user(root, { id }, { models, me }) {
      await isAuth(me, "GET_USER");
      const user = await models.user.findByPk(id, { include: [
        { model: models.permission, as: 'permissions' },
        { model: models.role, as: 'roles', include: [
          { model: models.permission, as: 'permissions' }
        ] }
      ]});
      return user;
    },
    async roles(root, args, { models, me }) { 
      await isAuth(me, "ALL_ROLE");
      return await models.role.findAll({ include: [
        { model: models.permission, as: 'permissions' }
      ] });
    },
    async permissions(root, args, { models, me }) { 
      await isAuth(me, "ALL_PERMISSION");
      return await models.permission.findAll();
    },
  },

  Mutation: {
    async signUp(root, { name, email, password }, { models }) {
        const saltRounds = 10;
        const passwordhash = await bcrypt.hash(password, saltRounds);
        let user = await models.user.create({ 
            name: name, 
            email: email, 
            password: passwordhash,
            isActive: true
        });
        user = await models.user.findByPk(user.id, {include: [
          {model: models.permission, as: 'permissions'},
          {model: models.role, as: 'roles', include: [
            {model: models.permission, as: 'permissions'}
          ]}
        ]});
        return user;
    },
    async updateMe(root, { name, email, password }, { models, me }) {
      let user = await models.user.findByPk(me.id);
      let updateObj = { name, email };
      if(password !== undefined) {
        const saltRounds = 10;
        const passwordhash = await bcrypt.hash(password, saltRounds);
        updateObj = { name, email, password: passwordhash };
      }
      await user.update(updateObj);
      user = await models.user.findByPk(me.id, {include: [
        {model: models.permission, as: 'permissions'},
        {model: models.role, as: 'roles', include: [
          {model: models.permission, as: 'permissions'}
        ]}
      ]});
      return user;
    },
    async login(root, { email, password },{ models, envconfig }) {
        const secret = envconfig.JWT_SECRET
        const user = await models.user.findByLogin(email)
        if (!user) {
          throw new UserInputError(
            'Invalid login credentials.',
          );
        }
        if ( user.isActive == false ) {
          throw new UserInputError(
            'Invalid login (User not active).',
          );
        }
        const isValid = await user.validatePassword(password)
  
        if (!isValid) {
          throw new AuthenticationError('Invalid password.')
        }
        return { token: createToken(user, secret, '1d') }
    },
    async forgotPassword(root, { email }, { models, envconfig }) {
        /**
         * @todo
         * send an email to reset password
         */
        const user = await models.user.findByLogin(email);
        if (!user) {
          throw new UserInputError(
            'No user found with this email.',
          );
        }
  
        //save email and token
        let token = Math.floor(Math.random() * 1000001);
  
        await models.passwordReset.updateOrCreate({ email, token});
  
        //create 64 bit encoded url key
        const bytes = utf8.encode(token.toString());
        const encoded = base64.encode(bytes);
        const url = envconfig.APP_URL + "/chnage_password?key=" + encoded;
  
        //read htlm file and replace string
        let htmlTemplates =  await fs.readFileSync(path.resolve(__dirname, 'email-templates/password-reset.html'),'utf8').toString();
        htmlTemplates = htmlTemplates.replace('__FrontEndURL__', envconfig.APP_URL).replace('__OrgNmae__', envconfig.ORGNAME).replace('__OrgAddress__', envconfig.ORGADDRESS).replace('__PasswordURL__', url);
        
        //send email
        emaillibrary.sendmail({
          to: '"'+ user.name +'" '+ user.email,// list of receivers
          subject: process.env.ORGNAME + " | Forgot Password", // Subject line
          //text: "Please click below url : "+ url, // plain text body
          html: htmlTemplates // html body
        });
        return { message: 'Please check your email and rest' };
    },
    async changePassword(root, { token, newPassword, confirmPassword }, { models }) {
        //get user email using token
  
        const bytes = base64.decode(token);
        const tokentext = utf8.decode(bytes);
  
        let passwordresetobj = await models.passwordReset.findOne({
          where: { token: tokentext },
        });
        if (!passwordresetobj) {
          throw new UserInputError(
            'Token is invalid.',
          );
        }
  
        const user = await models.user.findByLogin(passwordresetobj.email);
        if (!user) {
          throw new UserInputError(
            'No user found with this email.',
          );
        }
  
        if(newPassword !== confirmPassword)
        {
          throw new UserInputError(
            'Password and Confirm password is not match',
          );
        }
        const saltRounds = 10;
        const newPasswordhash = await bcrypt.hash(newPassword, saltRounds);
        user.update({ password: newPasswordhash });
        return { message: 'Password been updated' }
    },
    async createUser(root, { name, email, password, isActive, roles, permissions}, { models, pubsub, me }) {
      await isAuth(me, "USER_ADD");
      const saltRounds = 10;
      const passwordhash = await bcrypt.hash(password, saltRounds);
      let user = await models.user.create({ 
        name: name, 
        email: email, 
        password: passwordhash,
        isActive: isActive
      }).then(async user => {
        
        await permissions.forEach(async permission => {
          await models.userHasPermissions.create({ 
            permission_id: permission.id,
            user_id: user.id
          });
        });

        await roles.forEach(async role => {
          await models.userHasRoles.create({ 
            role_id: role.id,
            user_id: user.id
          });
        });
        return user;
      });
      user = await models.user.findByPk(id, {include: [
        {model: models.permission, as: 'permissions'},
        {model: models.role, as: 'roles', include: [
          {model: models.permission, as: 'permissions'}
        ]}
      ]});
      pubsub.publish(USER_ADDED, { userAdded: user });
      return user;
    },
    async updateUser(root, { id, name, email, password, isActive, roles, permissions }, { models, pubsub, me }) {
      await isAuth(me, "USER_UPDATE");
      let user = await models.user.findByPk(id);
      let updateObj = { name, email, isActive };
      if(password !== undefined) {
        const saltRounds = 10;
        const passwordhash = await bcrypt.hash(password, saltRounds);
        updateObj = { name, email, isActive,password: passwordhash };
      }
      await user.update(updateObj).then(async () => {
        if(permissions !== undefined) {
          await permissions.forEach(async permission => {
            await models.userHasPermissions.findOrCreate({where: { 
              permission_id: permission.id,
              user_id: user.id
            }});
          });

          const permissionsarray = await permissions.map(permission => permission.id);
          await models.userHasPermissions.destroy({
            where: { 
              user_id: user.id,
              permission_id : { [Op.notIn] : permissionsarray}
            },
          });
        }
        else
        {
          await models.userHasPermissions.destroy({
            where: { 
              user_id: user.id
            },
          });
        }


        if(roles !== undefined) {
          await roles.forEach(async role => {
            await models.userHasRoles.findOrCreate({where: { 
              role_id: role.id,
              user_id: user.id
            }});
          });

          const rolesarray = await roles.map(role => role.id);
          await models.userHasRoles.destroy({
            where: { 
              user_id: user.id,
              role_id : { [Op.notIn] : rolesarray}
            },
          });
        }
        else
        {
          await models.userHasRoles.destroy({
            where: { 
              user_id: user.id
            },
          });
        }

      });
      user = await models.user.findByPk(id, {include: [
        {model: models.permission, as: 'permissions'},
        {model: models.role, as: 'roles', include: [
          {model: models.permission, as: 'permissions'}
        ]}
      ]});
      pubsub.publish(USER_UPDATED, { userUpdated: user });
      
      return user;
    },
    async deleteUser(root, { id }, { models, pubsub, me }) {
      await isAuth(me, "USER_DELETE");
      let user = await models.user.findByPk(id);
      await models.userHasRoles.destroy({
        where: { 
          user_id: id
        },
      });
      await models.userHasPermissions.destroy({
        where: { 
          user_id: id
        },
      });
      await models.user.destroy({
        where: { id }
      });
      pubsub.publish(USER_DELETED, { userDeleted: user });
      user = await models.user.findByPk(id, {include: [
        {model: models.permission, as: 'permissions'},
        {model: models.role, as: 'roles', include: [
          {model: models.permission, as: 'permissions'}
        ]}
      ]});
      return user;
    },
    async createRole(root, { name, permissions}, { models, pubsub, me }) {
      await isAuth(me, "ROLE_ADD");
      const role_create = await models.role.create({ 
        name: name
      }).then(async role => {
        if(permissions !== undefined){
          await permissions.forEach(async permission => {
            await models.roleHasPermissions.create({ 
              permission_id: permission.id,
              role_id: role.id
            });
          });
        }
        return role;
      });
      const role = await models.role.findByPk(role_create.id, {include: [{model: models.permission, as: 'permissions'}]});
      pubsub.publish(ROLE_ADDED, { userAdded: role });
      return role;
    },
    async updateRole(root, { id, name, permissions }, { models, pubsub, me }) {
      await isAuth(me, "ROLE_UPDATE");
      let role = await models.role.findByPk(id);
      await role.update({ name }).then(async () => {
        if(permissions !== undefined)
        {
          
          await permissions.forEach(async permission => {
            await models.roleHasPermissions.findOrCreate({where: { 
              permission_id: permission.id,
              role_id: role.id
            }});
          });
          const permissionsarray = await permissions.map(permission => permission.id);
          await models.roleHasPermissions.destroy({
            where: { 
              role_id: role.id,
              permission_id : { [Op.notIn] : permissionsarray}
            },
          });
        }
        else
        {
          await models.roleHasPermissions.destroy({
            where: { 
              role_id: role.id
            },
          });
        }
      });
      role = await models.role.findByPk(id, {include: [{model: models.permission, as: 'permissions'}]});
      pubsub.publish(ROLE_UPDATED, { userUpdated: role });
      return role;
    },
    async deleteRole(root, { id }, { models, pubsub, me }) {
      await isAuth(me, "ROLE_DELETE");
      const role = await models.role.findByPk(id, {include: [{model: models.permission, as: 'permissions'}]});
      await models.roleHasPermissions.destroy({
        where: { 
          role_id: role.id
        },
      });
      await models.role.destroy({
        where: { id },
      });
      pubsub.publish(ROLE_DELETED, { roleDeleted: role });
      return role;
    }

  }
}
