const models = require('./../models');
const isAuth = async (me, functionName) => {
    if(!me.isAuth)
    {
        throw new Error('You must be logged in.');
    }


    let user_role_permission = await models.user.findByPk(me.id, {
        include: [
            { 
                model: models.role, 
                as: 'roles',
                include: [
                    { 
                        model: models.permission, 
                        as: 'permissions',
                        where: {
                            name: functionName
                        }
                    }
                ]
            }
        ]
    });

    let user_permission = await models.user.findByPk(me.id, {
        include: [
            { 
                model: models.permission, 
                as: 'permissions',
                where: {
                    name: functionName
                }
            }
        ]
    });

    if((user_role_permission.roles.length === 0) && (user_permission === null))
    {
        throw new Error('User not authenticated.');
    }

};

  
exports.isAuth = isAuth;