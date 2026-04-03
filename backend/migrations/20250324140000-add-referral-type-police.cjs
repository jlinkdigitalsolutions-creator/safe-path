"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE "enum_referrals_type" ADD VALUE 'police';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  },

  async down() {
    // PostgreSQL cannot remove enum values safely; leave type extended.
  },
};
