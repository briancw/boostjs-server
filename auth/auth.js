const jwt = require('jsonwebtoken');
const secret_key = process.env.JWT_SECRET;

module.exports = {
    auth: function(req, res, next) {
        console.log(req)
        if (req.body.token) {
            let token = req.body.token;
            // console.log(token);
            jwt.verify(token, secret_key, function(err, decoded) {
                if (err) {
                    console.log('Not Authorized');
                    // res.status('401');
                } else {
                    // console.log(decoded);
                    req.user_id = decoded.user_id;
                    next();
                }
            });
        } else {
            console.log('No token');
            next();
        }
    },
};
