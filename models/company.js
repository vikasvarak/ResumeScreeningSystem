const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompanySchema = new Schema({
    userId: {
        type: String
    },
    companyId: {
        type: String
    },
    name: String,
    about: String,
    description: String,
    ssc: Number,
    hsc: Number,
    graduation: Number,
    package: Number,
    vacancies: Number,
    skills: String,
    applied_candidate: { type: [{ type: String }] }
});


module.exports = mongoose.model('Company', CompanySchema);