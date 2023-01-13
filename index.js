// Required Packages
const express = require('express');
const app = express();
const path = require('path');
const User = require('./models/user');
const Resume = require('./models/resume');
const Company = require('./models/company');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const { v4: uuidv4 } = require('uuid');


// Database connection
mongoose.connect('mongodb://localhost:27017/ResumeScreeningSystem', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connected to database successfully!!!")
    })
    .catch(err => {
        console.log("not connected!!!!")
        console.log(err)
    })

// set up view and public directory
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.urlencoded({ extended: true }))

// session
app.use(session({
    secret: 'notagoodsecret',
    resave: 'false',
    saveUninitialized: 'true'
}))

// middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    next();
})

// functions
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    next()
}

const isAdmin = async (req, res, next) => {
    const foundAdmin = await User.findOne({ 'userId': req.session.user.userId });
    if (foundAdmin && foundAdmin.isAdmin) {
        next()
    }
}

const isUser = async (req, res, next) => {
    const foundUser = await User.findOne({ 'userId': req.session.user.userId });
    if (foundUser && !foundUser.isAdmin) {
        next()
    }
}

// routes
// home page
app.get('/', (req, res) => {
    res.render('home')
})

// authentication releted routes for both user and admin
app.get('/register', (req, res) => {
    res.render('users/register')
})

app.post('/register', async (req, res) => {
    const { password, username, email } = req.body
    const hash = await bcrypt.hash(password, 12)
    const user = new User({
        userId: uuidv4(),
        username,
        email,
        password: hash
    })
    await user.save()
    res.redirect('/login')
})

app.get('/login', (req, res) => {
    res.render('users/login')
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const foundUser = await User.findAndValidate(username, password)
    if (foundUser && foundUser.isAdmin) {
        req.session.user = foundUser
        res.redirect('/admin')
    }
    else if (foundUser && !foundUser.isAdmin) {
        req.session.user = foundUser
        res.redirect('/user')
    }
    else {
        res.redirect('/login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/login')
})

// Users routes
app.get('/user', requireLogin, isUser, async (req, res) => {
    res.render('user')
})

app.get('/user/view-resume', requireLogin, isUser, async (req, res) => {
    const resumeData = await Resume.findOne({ 'userId': req.session.user.userId });
    res.render('show-resume', { resumeData })
})

// app.get('/fillresume', requireLogin, isUser, (req, res) => {
//     res.render('restemp')
// })

// app.post('/fillresume', requireLogin, isUser, async (req, res) => {
//     const newResume = new Resume(req.body)
//     newResume.userId = req.session.user.userId
//     await newResume.save()
//     res.redirect('/user')
// })

app.get('/fill-resume', requireLogin, isUser, (req, res) => {
    res.render('restemp')
})

app.post('/fill-resume', requireLogin, isUser, async (req, res) => {
    // const newCompany = new Company(req.body)
    // newCompany.companyId = uuidv4();
    // newCompany.userId = req.session.user.userId
    // await newCompany.save()
    // res.redirect('/admin')

    const newResume = new Resume(req.body)
    console.log(newResume)
    newResume.resumeId = uuidv4();
    newResume.userId = req.session.user.userId
    await newResume.save()
    res.redirect(`/resume/${newResume.resumeId}`)
})

app.get('/edit', requireLogin, isUser, async (req, res) => {
    const resume = await Resume.findOne({ 'userId': req.session.user.userId })
    if (!resume) {
        // req.flash('error', 'Cannot find that Resume!');
        return res.redirect('/user');
    }
    res.render('edit', { resume });
})

app.post('/edit', requireLogin, isUser, async (req, res) => {
    const resume = await Resume.findOneAndUpdate({ 'userId': req.session.user.userId }, { ...req.body });
    res.redirect('/user')
})

const url = require('url');

app.post('/applied-candidates', requireLogin, isUser, async (req, res) => {
    const companyData = await Company.findOne({ 'companyId': req.session.companyId })
    if (!companyData) {
        console.log("some problem is there")
    }
    companyData.applied_candidate.push(req.session.user.userId)
    await companyData.save()
    res.redirect(`/company/${req.session.companyId}`)
})

app.get('/feedback', requireLogin, isUser, async (req, res) => {
    const user = await User.findOne({ 'userId': req.session.user.userId });
    if (!user) {
        console.log("some problem is there")
    }
    res.render('feedback', { user });
})

// Admin Routes
app.get('/admin', requireLogin, isAdmin, async (req, res) => {
    res.render('admin')
})

app.get('/addcomp', requireLogin, isAdmin, (req, res) => {
    res.render('comptemp')
})

app.post('/addcomp', requireLogin, isAdmin, async (req, res) => {
    // const newCompany = new Company(req.body)
    // newCompany.companyId = uuidv4();
    // newCompany.userId = req.session.user.userId
    // await newCompany.save()
    // res.redirect('/admin')

    const newCompany = new Company(req.body)
    newCompany.companyId = uuidv4();
    newCompany.userId = req.session.user.userId
    await newCompany.save()
    res.redirect(`/company/${newCompany.companyId}`)
})

app.get('/editcomp', requireLogin, isAdmin, async (req, res) => {
    const company = await Company.findOne({ 'userId': req.session.user.userId })
    if (!company) {
        // req.flash('error', 'Cannot find that Resume!');
        return res.redirect('/admin');
    }
    res.render('comptempedit', { company });
})



app.post('/editcomp', requireLogin, isAdmin, async (req, res) => {
    const company = await Company.findOneAndUpdate({ 'userId': req.session.user.userId }, { ...req.body });
    res.redirect('/admin')
})

app.get('/admin/view-resumes', requireLogin, isAdmin, async (req, res) => {
    const resumeData = await Resume.find();
    res.render('resumes', { resumeData })
})


// routes for both user and admin
app.get('/all-companies', requireLogin, async (req, res) => {
    const companyData = await Company.find();
    res.render('companies', { companyData })
})

app.get('/resume/:id', requireLogin, async (req, res) => {
    const resumeData = await Resume.findOne({ 'resumeId': req.params.id })
    if (!resumeData) {
        console.log("some problem is there")
    }
    res.render('show-resume', { resumeData });
})

app.get('/company/:id', requireLogin, async (req, res) => {
    const companyData = await Company.findOne({ 'companyId': req.params.id })
    if (!companyData) {
        console.log("some problem is there")
    }
    req.session.companyId = req.params.id;
    res.render('show-company', { companyData });
})



// rank generation
var request = require('request-promise');
const { json } = require('express');
const { parse } = require('path');
app.get('/admin/generate-static-rank', requireLogin, isAdmin, async function (req, res) {
    const job_description = await Company.find()
    const resumes = await Resume.find()
    var options = {
        method: 'POST',
        // http:flaskserverurl:port/route
        uri: 'http://127.0.0.1:5000/generate-static-rank',
        // body: [job_description, resumes],
        body: [resumes],
        // Automatically stringifies
        // the body to JSON
        json: true
    };

    var sendrequest = await request(options)
        // The parsedBody contains the data
        // sent back from the Flask server
        .then(async function (parsedBody) {
            var resumes = []
            var i = 0
            for (const item of parsedBody) {
                const field = item[0]
                const feedback = item[1]
                const keys = Object.keys(field);
                id = keys[0]
                resumes[i] = await Resume.findOne({ 'userId': id });
                const user = await User.findOne({ 'userId': id });
                user.feedback = feedback.feedback
                user.save();
                i++;
            }
            res.render('rank', { resumes })
        })
        .catch(function (err) {
            console.log(err);
        });
    // res.send("task completed")
});

// app.get('/admin/generateRank', requireLogin, isAdmin, async (req, res) => {
//     const companyData = await Company.findOne({ 'userId': req.session.user.userId });
//     res.send("ranks generated successfully")
// })

app.listen(7000, () => {
    console.log("SERVING YOUR APP!")
})

