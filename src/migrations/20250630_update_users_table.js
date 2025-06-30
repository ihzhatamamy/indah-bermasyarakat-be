exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Tambahkan kolom referal untuk melacak afiliasi dengan admin
    table.integer('referal_admin_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('kode_referal').nullable();
    table.timestamp('email_verified_at').nullable();
    table.string('verification_token').nullable();
    table.string('reset_password_token').nullable();
    table.timestamp('reset_password_expires').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('referal_admin_id');
    table.dropColumn('kode_referal');
    table.dropColumn('email_verified_at');
    table.dropColumn('verification_token');
    table.dropColumn('reset_password_token');
    table.dropColumn('reset_password_expires');
  });
};