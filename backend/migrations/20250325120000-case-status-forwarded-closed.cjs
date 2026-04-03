"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const addIfMissing = async (label) => {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'enum_cases_status'
              AND e.enumlabel = '${label}'
          ) THEN
            ALTER TYPE "enum_cases_status" ADD VALUE '${label}';
          END IF;
        END $$;
      `);
    };
    await addIfMissing("forwarded");
    await addIfMissing("closed");
  },

  async down() {
    // PostgreSQL cannot drop individual enum labels safely; leave type as-is.
  },
};
