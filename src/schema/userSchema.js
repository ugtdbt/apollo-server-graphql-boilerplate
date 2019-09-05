const { gql } = require('apollo-server');

module.exports = gql`

  type User {
    id: Int!
    name: String!
    email: String!
    isActive: Boolean!
    roles: [Role]
    permissions: [Permission]
  }

  type Message {
    message: String!
  }
  type Token {
    token: String!
  }
  type Users {
    rows: [User!]
    count: Int!
    pages: Int!
  }

  type Role {
    id: Int!
    name: String!
    permissions: [Permission]
  }
  type Permission {
    id: Int!
    name: String!
  }
  input InputRoles {
    id: Int!
  }
  input InputPermissions {
    id: Int!
  }
  extend type Query {
    me: User
    users ( page: Int, limit: Int ): Users
    user(id: Int!): User
    roles: [Role!]
    permissions: [Permission!]
  }
  extend type Mutation {
    signUp(name: String!, email: String!, password: String!): User!
    updateMe(name: String!, email: String!, password: String): User!
    login(email: String!, password: String!): Token!
    forgotPassword(email: String!): Message!
    changePassword(newPassword: String!, confirmPassword: String!, token: String!): Message!
    createRole(name: String!, permissions: [InputPermissions!]): Role!
    updateRole(id: Int!, name: String!, permissions: [InputPermissions!]): Role!
    deleteRole(id: Int!): Role!
    createUser(name: String!, email: String!, password: String!, isActive: Boolean!, roles: [InputRoles!], permissions: [InputPermissions!]): User!
    updateUser(id: Int!, name: String, email: String, password: String, isActive: Boolean, roles: [InputRoles!], permissions: [InputPermissions!]): User!
    deleteUser(id: Int!): User!
  }
  extend type Subscription {
    userAdded: User!,
    userUpdated: User!,
    userDeleted: User!,
    roleAdded: Role!,
    roleUpdated: Role!,
    roleDeleted: Role!,
  }
`;


