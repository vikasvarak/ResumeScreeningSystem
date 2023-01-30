const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResumeSchema = new Schema({
    userId: {
        type: String
    },
    resumeId: {
        type: String
    },
    name: String,
    careerObjective: String,
    image: String,
    ssc: Number,
    hsc: Number,
    graduation: Number,
    projects: [String],
    internships: [[String]],
    skill: String,
    certifications: [String],
});


module.exports = mongoose.model('Resume', ResumeSchema);