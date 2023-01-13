const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    username: {
        type: String,
        required: [true, 'Username cannot be blank']
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password cannot be blank']
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    feedback: String
})

userSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await this.findOne({ username });
    const isValid = await bcrypt.compare(password, foundUser.password);
    return isValid ? foundUser : false;
}


module.exports = mongoose.model('User', userSchema);