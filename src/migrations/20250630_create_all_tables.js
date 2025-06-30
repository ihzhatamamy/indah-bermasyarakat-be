exports.up = function(knex) {
  return knex.schema
    // 1. Tabel keluarga
    .createTable('keluarga', function(table) {
      table.increments('id').primary();
      table.string('nama_kepala_keluarga').notNullable();
      table.text('alamat').notNullable();
      table.timestamps(true, true);
    })
    
    // 2. Tabel users (dengan foreign key ke keluarga)
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('nama').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('no_hp');
      table.text('alamat');
      table.enum('role', ['admin', 'warga']).defaultTo('warga');
      table.integer('keluarga_id').unsigned().references('id').inTable('keluarga').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    
    // 3. Tabel iuran
    .createTable('iuran', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('jumlah', 10, 2).notNullable();
      table.enum('status', ['pending', 'paid']).defaultTo('pending');
      table.timestamp('tanggal_bayar').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // 4. Tabel fasilitas
    .createTable('fasilitas', function(table) {
      table.increments('id').primary();
      table.string('nama_fasilitas').notNullable();
      table.string('lokasi').notNullable();
      table.enum('status', ['baik', 'rusak', 'perbaikan']).defaultTo('baik');
      table.timestamps(true, true);
    })
    
    // 5. Tabel laporan_fasilitas
    .createTable('laporan_fasilitas', function(table) {
      table.increments('id').primary();
      table.integer('fasilitas_id').unsigned().notNullable().references('id').inTable('fasilitas').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('deskripsi').notNullable();
      table.enum('status', ['open', 'progress', 'closed']).defaultTo('open');
      table.timestamp('tanggal_lapor').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // 6. Tabel kegiatan
    .createTable('kegiatan', function(table) {
      table.increments('id').primary();
      table.string('nama_kegiatan').notNullable();
      table.date('tanggal').notNullable();
      table.string('lokasi').notNullable();
      table.text('deskripsi');
      table.timestamps(true, true);
    })
    
    // 7. Tabel surat
    .createTable('surat', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('jenis_surat').notNullable();
      table.enum('status', ['diajukan', 'diproses', 'selesai']).defaultTo('diajukan');
      table.string('file_url');
      table.timestamp('tanggal_ajuan').defaultTo(knex.fn.now());
      table.timestamps(true, true);
    })
    
    // 8. Tabel donasi
    .createTable('donasi', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.decimal('jumlah', 10, 2).notNullable();
      table.enum('status', ['pending', 'confirmed']).defaultTo('pending');
      table.timestamp('tanggal').defaultTo(knex.fn.now());
      table.text('deskripsi');
      table.timestamps(true, true);
    })
    
    // 9. Tabel broadcast
    .createTable('broadcast', function(table) {
      table.increments('id').primary();
      table.string('judul').notNullable();
      table.text('pesan').notNullable();
      table.timestamp('tanggal').defaultTo(knex.fn.now());
      table.enum('tipe', ['panic', 'info']).defaultTo('info');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('broadcast')
    .dropTableIfExists('donasi')
    .dropTableIfExists('surat')
    .dropTableIfExists('kegiatan')
    .dropTableIfExists('laporan_fasilitas')
    .dropTableIfExists('fasilitas')
    .dropTableIfExists('iuran')
    .dropTableIfExists('users')
    .dropTableIfExists('keluarga');
};