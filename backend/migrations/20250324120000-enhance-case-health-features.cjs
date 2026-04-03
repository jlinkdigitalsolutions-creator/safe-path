"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cases", "country", {
      type: Sequelize.STRING(128),
      allowNull: false,
      defaultValue: "Ethiopia",
    });
    await queryInterface.addIndex("cases", ["country"], {
      name: "cases_country_idx",
    });
    await queryInterface.addIndex("cases", ["district"], {
      name: "cases_district_idx",
    });

    await queryInterface.addColumn("vaccination_campaigns", "age_min", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 9,
    });
    await queryInterface.addColumn("vaccination_campaigns", "age_max", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 45,
    });
    await queryInterface.addColumn("vaccination_campaigns", "sms_reminder_enabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn("vaccination_campaigns", "target_districts", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("vaccination_campaigns", "language", {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "en",
    });

    await queryInterface.addColumn("facilities", "country", {
      type: Sequelize.STRING(128),
      allowNull: false,
      defaultValue: "Ethiopia",
    });

    await queryInterface.addColumn("health_messages", "topic", {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: "general",
    });
    await queryInterface.addColumn("health_messages", "language", {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "en",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("health_messages", "language");
    await queryInterface.removeColumn("health_messages", "topic");
    await queryInterface.removeColumn("facilities", "country");
    await queryInterface.removeColumn("vaccination_campaigns", "language");
    await queryInterface.removeColumn("vaccination_campaigns", "target_districts");
    await queryInterface.removeColumn("vaccination_campaigns", "sms_reminder_enabled");
    await queryInterface.removeColumn("vaccination_campaigns", "age_max");
    await queryInterface.removeColumn("vaccination_campaigns", "age_min");
    await queryInterface.removeIndex("cases", "cases_district_idx");
    await queryInterface.removeIndex("cases", "cases_country_idx");
    await queryInterface.removeColumn("cases", "country");
  },
};
