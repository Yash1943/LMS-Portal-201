"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Course, { foreignKey: "educatorId" });
    }
    static async findByEmail(email) {
      return await this.findOne({ where: { email } });
    }

    static async findById(id) {
      return await this.findByPk(id);
    }

    static async createUser({ role, name, email, password }) {
      return await this.create({ role, name, email, password });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Learner",
        validate: {
          isIn: [["Learner", "Educator"]],
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
