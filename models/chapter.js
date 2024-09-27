"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
    static async getChaptersByCourseId(courseId) {
      return await Chapter.findAll({ where: { courseId: courseId } });
    }

    static async getChapterByIdAndCourseId(chapterId, courseId) {
      return await Chapter.findOne({
        where: { id: chapterId, courseId: courseId },
      });
    }

    static async createChapter(title, description, courseId) {
      return await Chapter.create({ title, description, courseId });
    }

    static async updateChapter(chapterId, title, description) {
      return await Chapter.update({ title, description }, { where: { id: chapterId } });
    }
    static async deleteChapter(chapterId) {
      return await Chapter.destroy({ where: { id: chapterId } });
    }
    static async nextChapter(courseId, chapterId) {
      return await Chapter.findOne({
        where: {
          courseId: courseId,
          id: { [Op.gt]: chapterId },
        },
        order: [["id", "ASC"]],
      });
    }
  }
  Chapter.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      courseId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Chapter",
    }
  );
  return Chapter;
};
