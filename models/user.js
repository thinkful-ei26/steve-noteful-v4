const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  fullname: {type: String},
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true}
})

// Add `createdAt` and `updatedAt` fields
userSchema.set('timestamps', true)

userSchema.methods.validatePassword = function(incomingPassword) {
  return bcrypt.compare(incomingPassword, this.password)
}
userSchema.statics.hashPassword = function(incomingPassword) {
  const digest = bcrypt.hash(incomingPassword, 8)
  return digest
}

//convert to JSON
userSchema.set('toJSON', {
  virtuals: true, // include built-in virtual `id`
  transform: (doc, ret) => {
    delete ret._id // delete `_id`
    delete ret.__v
    delete ret.password
  }
})

module.exports = mongoose.model('User', userSchema)
