const jwt = require('jsonwebtoken');
const fs = require('fs');
const secret_key = process.env.JWT_SECRET;

module.exports = {
        auth: function(req, res, next) {
            console.log('auth');
            // console.log(req.headers.token);
            if (req.headers.token) {
                let token = req.headers.token;

                jwt.verify(token, secret_key, function(err, decoded) {
                    // If something went wrong
                    if (err) {
                        console.log('Error in server auth');
                        req.userId = null;
                        req.authStatus = null;
                    // If decoded data exists
                    } else {
                        req.authStatus = decoded.authStatus;
                        let sessionFileName = './.sessions/' + token.substr(token.lastIndexOf('.') + 1, 8) + '.s';

                        // If token is too old or invalidated
                        if (!decoded.invalidationDate ||
                            Date.now() >= decoded.invalidationDate ||
                            fs.existsSync(sessionFileName)) {

                            console.log('Not Authorized');
                            req.authStatus = null;
                        } else {
                            console.log('Authorized through server');
                            req.authStatus = decoded.authStatus;
                        }
                    }
                    next();
                });
            } else {
                console.log('No token supplied to server auth');
                // console.log(req.headers);
                next();
            }
        },
    // };
};
