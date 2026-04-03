"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(64), allowNull: true },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      name: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("permissions", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      key: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      module: { type: Sequelize.STRING(64), allowNull: false },
      action: { type: Sequelize.STRING(64), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("user_roles", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("user_roles", ["user_id", "role_id"], {
      unique: true,
      name: "user_roles_user_id_role_id_unique",
    });

    await queryInterface.createTable("role_permissions", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "permissions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("role_permissions", ["role_id", "permission_id"], {
      unique: true,
      name: "role_permissions_role_id_permission_id_unique",
    });

    await queryInterface.createTable("refresh_tokens", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("refresh_tokens", ["token_hash"], {
      name: "refresh_tokens_token_hash_idx",
    });

    await queryInterface.createTable("cases", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      case_number: { type: Sequelize.STRING(32), allowNull: false, unique: true },
      type: {
        type: Sequelize.ENUM("rape", "physical", "emotional"),
        allowNull: false,
      },
      region: { type: Sequelize.STRING(128), allowNull: false },
      district: { type: Sequelize.STRING(128), allowNull: false },
      kebele: { type: Sequelize.STRING(128), allowNull: false },
      urgency: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: Sequelize.ENUM("open", "in_progress", "resolved"),
        allowNull: false,
        defaultValue: "open",
      },
      anonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reported_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      intake_channel: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "web",
      },
      summary: { type: Sequelize.TEXT, allowNull: true },
      location_notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("case_assignments", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "cases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assignee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assigned_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("referrals", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      case_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "cases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("shelter", "legal", "health"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "in_progress",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      destination_name: { type: Sequelize.STRING(255), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      channel: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "in_app",
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      meta: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: { type: Sequelize.STRING(128), allowNull: false },
      entity_type: { type: Sequelize.STRING(64), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: true },
      details: { type: Sequelize.JSONB, allowNull: true },
      ip_address: { type: Sequelize.STRING(64), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("audit_logs", ["created_at"], {
      name: "audit_logs_created_at_idx",
    });

    await queryInterface.createTable("vaccination_campaigns", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      region: { type: Sequelize.STRING(128), allowNull: false },
      start_date: { type: Sequelize.DATEONLY, allowNull: false },
      end_date: { type: Sequelize.DATEONLY, allowNull: true },
      target_coverage_percent: { type: Sequelize.INTEGER, allowNull: false },
      current_coverage_percent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: "active",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("health_messages", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      channel: { type: Sequelize.STRING(32), allowNull: false },
      audience: { type: Sequelize.STRING(128), allowNull: false },
      reach_estimate: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("facilities", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      type: {
        type: Sequelize.ENUM("clinic", "hospital", "ngo", "community_center"),
        allowNull: false,
      },
      region: { type: Sequelize.STRING(128), allowNull: false },
      district: { type: Sequelize.STRING(128), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      phone: { type: Sequelize.STRING(64), allowNull: true },
      latitude: { type: Sequelize.DOUBLE, allowNull: true },
      longitude: { type: Sequelize.DOUBLE, allowNull: true },
      services: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("facilities");
    await queryInterface.dropTable("health_messages");
    await queryInterface.dropTable("vaccination_campaigns");
    await queryInterface.dropTable("audit_logs");
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("referrals");
    await queryInterface.dropTable("case_assignments");
    await queryInterface.dropTable("cases");
    await queryInterface.dropTable("refresh_tokens");
    await queryInterface.dropTable("role_permissions");
    await queryInterface.dropTable("user_roles");
    await queryInterface.dropTable("permissions");
    await queryInterface.dropTable("roles");
    await queryInterface.dropTable("users");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_facilities_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_referrals_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_referrals_status";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_cases_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_cases_urgency";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_cases_status";'
    );
  },
};
