var JWT = require("jsonwebtoken");
var jwtSecretKey = require("../secretkeys/secretkeys");

// verify the token
var verifyToken = function(req, res, next){
    
        //  get the token from the header section from request made, this helps separating the "Bearer" from the token value its self (like in postman)
        console.log("our headers: " + req.headers);
        var header = req.headers.authorization.split(' ');
        var token = header[1];
    
        JWT.verify(token, jwtSecretKey.jwtSecretkey, function(error, validated){
            if(error) {
                console.log({"status" : error.message});
                res.json({"status" : error.message}); 
            }else{
                // set token into session
                req.session.userDetails = validated;

                next(); // this will pass the request to the next middleware if there is any.
            }
        });

    };  // end of verifyToken


module.exports = verifyToken;