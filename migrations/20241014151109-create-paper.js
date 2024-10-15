'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Papers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      authors: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      abstractTitle: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      abstract: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      pdfUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pdfId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      paperDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Papers');
  }
};
