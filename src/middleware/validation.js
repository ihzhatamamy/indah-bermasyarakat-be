const Joi = require('joi');

// Middleware untuk validasi register
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    nama: Joi.string().required().min(3).max(50).messages({
      'string.base': 'Nama harus berupa teks',
      'string.empty': 'Nama tidak boleh kosong',
      'string.min': 'Nama minimal {#limit} karakter',
      'string.max': 'Nama maksimal {#limit} karakter',
      'any.required': 'Nama wajib diisi'
    }),
    email: Joi.string().required().email().messages({
      'string.base': 'Email harus berupa teks',
      'string.empty': 'Email tidak boleh kosong',
      'string.email': 'Format email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().required().min(6).messages({
      'string.base': 'Password harus berupa teks',
      'string.empty': 'Password tidak boleh kosong',
      'string.min': 'Password minimal {#limit} karakter',
      'any.required': 'Password wajib diisi'
    }),
    no_hp: Joi.string().allow('', null),
    alamat: Joi.string().allow('', null),
    role: Joi.string().valid('admin', 'warga').default('warga'),
    kode_referensi: Joi.string().allow('', null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Middleware untuk validasi login
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      'string.base': 'Email harus berupa teks',
      'string.empty': 'Email tidak boleh kosong',
      'string.email': 'Format email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    password: Joi.string().required().messages({
      'string.base': 'Password harus berupa teks',
      'string.empty': 'Password tidak boleh kosong',
      'any.required': 'Password wajib diisi'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Middleware untuk validasi password
exports.validatePassword = (req, res, next) => {
  const schema = Joi.object({
    password: Joi.string().required().min(6).messages({
      'string.base': 'Password harus berupa teks',
      'string.empty': 'Password tidak boleh kosong',
      'string.min': 'Password minimal {#limit} karakter',
      'any.required': 'Password wajib diisi'
    }),
    currentPassword: Joi.string().messages({
      'string.base': 'Password saat ini harus berupa teks',
      'string.empty': 'Password saat ini tidak boleh kosong'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Middleware untuk validasi lainnya dapat ditambahkan di sini