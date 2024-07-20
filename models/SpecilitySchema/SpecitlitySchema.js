const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
    specialty_name: { type: String, required: true }
  });
  
  const Specialty = mongoose.model('Specialty', specialtySchema);
  module.exports = Specialty;
  