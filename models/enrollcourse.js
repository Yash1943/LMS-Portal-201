"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class enrollCourse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      enrollCourse.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course",
      });
    }
  }
  enrollCourse.init(
    {
      LearnerId: DataTypes.INTEGER,
      courseId: DataTypes.INTEGER,
      progressOfCourse: DataTypes.INTEGER,
      enrollStatus: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "enrollCourse",
    },
  );
  return enrollCourse;
};
