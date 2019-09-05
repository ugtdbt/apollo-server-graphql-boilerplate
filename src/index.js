const { ApolloServer , PubSub } = require('apollo-server');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const schema = require('./schema');
const resolvers = require('./resolvers');
const models = require('./models');

dotenv.config();

const getMe = async (req, connection) => {
  if (connection) {
    // check connection for metadata
    return connection.context;
  }
    if(!req)
    {
      return {
        isAuth: false
      };
    }
    if(req.headers)
    {
      const token = req.headers.authorization || '';
      const splitToken = token.split(' ')[1];
      try {
          let token = await jwt.verify(splitToken, process.env.JWT_SECRET);
          return {
            isAuth: true,
            ... token
          }
  
      } catch (e) {
        return {
          isAuth: false
        };
      }
    }
    else
    {
      return {
        isAuth: false
      };
    }
    
  };

  const pubsub = new PubSub();

  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: async ({ req, res, connection}) => {
      const me = await getMe(req, connection);
      return {
        req,
        res,
        me,
        models,
        pubsub,
        envconfig: process.env,
      };
    },
    subscriptions : {
      onConnect: async (connectionParams, webSocket, context) => {

        const token = connectionParams.authorization || '';
        const splitToken = token.split(' ')[1];
        try {
          let token = await jwt.verify(splitToken, process.env.JWT_SECRET);
          return {
            isAuth: true,
            ... token
              }
  
          } catch (e) {
            //throw new Error('Missing auth token!');
            return {
              isAuth: false
            };
          }
      }
    }
  });

  server
  .listen({ port: process.env.PORT })
  .then(({ url, subscriptionsUrl }) => {
    console.log(`🚀 Server ready at ${url}`);
    console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
  });