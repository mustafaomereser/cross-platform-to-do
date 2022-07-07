const express = require('express'), app = express(), md5 = require('md5');

// Modules
const DB = require('./modules/DB'), Functions = require('./modules/Functions');

// Items Routes: Start
app.get('/items', function (_req, res) {
    req = _req.query;
    let validator = Functions.validator({ list: req.list, auth: _req.headers.auth_token });
    if (!validator['status']) return res.send({ status: 0, message: validator['errors'] });
    const callback = (results) => res.send({ status: 1, items: results });
    return DB.init(res, callback).table('items').where('list_id', req.list).get();
});
// Items Routes: End

// Lists Routes: Start
app.get('/lists', function (req, res) {
    if (!Functions.isset(req.headers.auth_token)) return res.send({ status: 0, message: 'Auth required.' });
    const callback = (results) => res.send({ status: 1, list: results });
    return DB.init(res, callback).table('lists').where('user_token', req.headers.auth_token).get();
});
// Lists Routes: End

// User Routes: Start
app.get('/get-user', function (req, res) {
    if (!Functions.isset(req.headers.auth_token)) return res.send({ status: 0 });

    const callback = (result) => {
        if (!Functions.isset(result)) return res.send({ status: 0, message: 'Logout.' });
        delete result['password'], delete result['token'];
        res.send({ status: 1, user: result });
    };

    return DB.init(res, callback).table('users').where('token', req.headers['auth_token']).where('status', 1).first();
});
// User Routes: End

// Auth Routes: Start
app.post('/signin', function (req, res) {
    req = req.query;

    let validator = Functions.validator({ email: req.email, password: req.password });
    if (!validator['status']) return res.send({ status: 0, message: validator['errors'].length ? validator.errors : 'Please fill inputs true.' });

    const signin = (result) => {
        if (!Functions.isset(result)) return res.send({ status: 0, message: 'E-mail or Password is not match.' });
        res.send({ status: 1, message: 'Signin success.', token: result.token });
    }

    return DB.init(res, signin).table('users').where('email', req.email).where('password', md5(req.password)).where('status', 1).first();
});

app.post('/signup', function (req, res) {
    req = req.query;

    let validator = Functions.validator([req.name, req.surname, req.email, req.password]);
    if (!validator['status'] || req.password.length < 8 || !Functions.validate_email(req.email)) return res.send({ status: 0, message: validator['errors'].length ? validator.errors : 'Please fill inputs true.' });
    let rand_token = Functions.str_rand(30);

    const callback = (result) => {
        if (Functions.isset(result)) return res.send({ status: 1, message: 'Account has created!', token: rand_token });
        res.send({ status: 0, message: 'Unknown error!' });
    };

    const mailTest = (result) => {
        if (Functions.isset(result)) return res.send({ status: 0, message: 'E-mail already using.' });

        DB.init(res, callback).table('users').insert({
            name: req.name,
            surname: req.surname,
            email: req.email,
            password: md5(req.password),
            token: rand_token
        });
    }

    DB.init(res, mailTest).table('users').where('email', req.email).first();
});
// Auth Routes: End

// Example
// app.get('/', function (req, res) {
//     params = req.query;

//     const callback = (result) => {
//         res.send(result);
//     };

//     return DB.init(res, callback).table('users').where('id', 1).first();
// });

app.listen(1000, console.log('Sunucu çalışıyor...'));