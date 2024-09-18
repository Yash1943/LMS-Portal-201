"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ChapterPages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
    static async getChapterPagesByChapterId(chapterId) {
      return await ChapterPages.findAll({ where: { chapterID: chapterId } });
    }

    static async getChapterPageById(pageId) {
      return await ChapterPages.findOne({ where: { id: pageId } });
    }

    static async createChapterPage(title, description, chapterID) {
      return await ChapterPages.create({ title, description, chapterID });
    }
    static async updateChapterPage(pageId, title, description) {
      return await ChapterPages.update(
        { title, description },
        { where: { id: pageId } },
      );
    }

    static async deleteChapterPage(pageId) {
      return await ChapterPages.destroy({ where: { id: pageId } });
    }
  }
  ChapterPages.init(
    {
      title: DataTypes.STRING,
      chapterID: DataTypes.INTEGER,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ChapterPages",
    },
  );
  return ChapterPages;
};
