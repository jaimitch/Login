const express = require ('express');
const bodyParser = require ('body-parser');
const mustacheExpress = require ('mustache-express');
const fs = require ('fs');
const cookieParser = require ('cookie-parser');

var application = express();

application.engine('mustache', mustache());

application.use('cookieParser'());
application.use('bodyParser'());
application.use(bodyParser.urlencoded( {extended: true} ));

application.use((request, response, next) => {
    if(request.cookies.session !== undefined){
        var sessionId = parseInt(request.cookies.session);
        var user = storage.session[sessionId];

        if(!user) {
            response.locals.user = {isAuthenticated: false};
        }
        else{
            response.locals.user = {isAuthenticated: true};
        }
    }
    else {
        response.locals.user = {isAuthenticated: false};
    }
    next();
});

var model = {};
model.logInCount = 0;
model.signUpCount = 0;
model.clickCount = 0;
model.isLoggedIn = false;
model.word = 'tmp';
model.wordArray = [];
model.guessWords = [];

const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

var storage = {users: [], sessionId: 0, sessions: []};

function getRandomWord() {
    var randomIndex = Math.floor(Math.random() * (words.length));
    return words[randomIndex];
}

function setup(){
    model.word = getRandomWord();
    model.wordArray = model.word.split(' ');
    model.guessWords = [];

    for(var i in model.wordArray) {
        model.guessWords.push('_');
    }
}

function letterGuess(letter){
    while(model.wordArray.indexOf(letter) >-1){
        var letterIndex = model.wordArray.indexOf(letter);
        model.wordArray.splice(letterIndex, 1, '_');
        model.guessWords.splice(letterIndex, 1, letter);
    }
}

application.get('/', (request, response) => {
    response.render('index', model);
});

application.post('/', (request, response) => {
    model.clickCount++;
    model.isLoggedIn = false;
    response.locals.user = {isAuthenticated = false};
    response.render('index', model);
});

application.get('/signUp', (request, response) => {
    response.render('singUp', model);
});

application.post('/signUp', (request, response) => {
    model.singUpCount++;
    var user = {
        username = request.body.username,
        password = request.body.password
    }

    storage.users.push(user);

    response.redirect('/logIn');
});

application.get('/logIn', (request, response) => {
    response.render('logIn', model);
});

application.post('/logIn', (request, response) => {
    model.logInCount++;
    var username = request.body.username;
    var password = request.body.password;

    var user = storage.users.find(user => {
        return user.username === username && user.password ===password
    })

    if(!user) {
        response.render('logIn', model);
    }
    else{
        var sessionId = storage.sessionId;
        storage.sessionId++;
        storage.sessionId.push(user);

        response.cookie('session', sessionId);
        model.isLoggedIn = true;

        response.redirect('/game');
    }
});

application.get('/game', (request, response) => {
    var sessionId = parseInt(request.cookies.session);
    var user = storage.sessions[sessionId];
    setup();


    if(response.locals.user.isAuthenticated === false){
        response.render('logIn', model);
    }
    else{
        response.render('game', model);
    }
});

application.post('/game', (request, response) => {
    letterGuess(request.body.guess);
    response.render('game', model);
});


application.get('/game_restart', (request, response) => {
    setup();
    response.render('game', model);
});

application.listen(3000);