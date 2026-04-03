"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("vaccination_campaigns", "eligible_population", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("vaccination_campaigns", "vaccinated_count", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("vaccination_campaigns", "vaccinated_count");
    await queryInterface.removeColumn("vaccination_campaigns", "eligible_population");
  },
};
