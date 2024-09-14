'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class markAsCompletion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  markAsCompletion.init({
    chapetPageId: DataTypes.INTEGER,
    LearnerId: DataTypes.INTEGER,
    markAsComple: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'markAsCompletion',
  });
  return markAsCompletion;
};