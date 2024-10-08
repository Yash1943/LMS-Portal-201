"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Course.belongsTo(models.User, { foreignKey: "educatorId" });
      Course.hasMany(models.enrollCourse, {
        foreignKey: "courseId",
        as: "enrollments",
      });
    }
    static getCourseByEducatorId() {
      return Course.findAll();
    }
    static async findCourseById(courseId) {
      return await Course.findOne({ where: { id: courseId } });
    }

    static async getAllCourses() {
      return await Course.findAll();
    }
  }
  Course.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photoOfCourse: DataTypes.STRING,
      description: DataTypes.STRING,
      educatorName: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Course",
    },
  );
  return Course;
};
