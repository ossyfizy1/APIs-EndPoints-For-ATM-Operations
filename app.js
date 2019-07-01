const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const bodyParser = require("body-parser");
const Joi = require("joi");
var JWT = require("jsonwebtoken");

var secretKeys = require("./secretkeys/secretkeys");

// require the validations folder
var validations = require("./validations/validations");

// require atmOperations
const atmOperations = require("./atmOperations/atmOperations");

// require our JWT to verity token as middleware
const jwtVerityToken = require("./jwtVerifyMiddleWare/jwtVerify");



// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json());








// 1. bank account creation
app.post('/bankAccountCreation', (req, res) => {

    var customerAccountDetails = {
                            firstName : req.body.firstName,
                            lastName : req.body.lastName,
                            accountType : req.body.accountType,
                            deposite : req.body.deposite
                        };

    // JOI validation and call: bankAccountCreation() --> to insert into database
    Joi.validate(customerAccountDetails, validations.bankAccountCreation, (error, validated) => {
        if(error){
            res.json({response: error.message});
            return;
        }   
        else{
           atmOperations.bankAccountCreation(customerAccountDetails)
           .then(
               (onfulfilled) => {
                    res.json({response : "account created succesfully"});
                    return;
               },
               (onrejected) => {

                   // check for duplicate record
                   if (onrejected.code == "11000") {
                    res.json({response : "account number already exist"});
                    return;
                   }

                    res.json({response : onrejected.message});
                    return;
               },
           );
        }
            
    });


});




// 2. atm card insertion
app.post('/atmCardInsertion', (req, res) => {

    // object to validate
    var atmCardInserted = {
        accountNumber : req.body.accountNumber, // from the atm card chip
        atmCardPin : req.body.atmCardPin
    }

    // joi validation for pin supplied & call ----> validateAtmCardPin()
    Joi.validate(atmCardInserted, validations.atmCardInsertion, (error, validated) => {
        if (error) {
            res.json({"response" : error.message});
            return;
        }

        atmOperations.validateAtmCardPin(atmCardInserted)
        .then(
            (onfulfilled) => {
                res.json({response : onfulfilled});
                return;
            },
            (onrejected) => {
                res.json({response : onrejected.message});
                return;
            },
        );
        


    });


});



// 3. cash Withdrawal Via Atm card plus JWT verification
app.post('/cashWithdrawalViaAtm', (req, res) => {

    var header = req.headers.authorization.split(' ');
    var token = header[1];
    var amount = req.body.amount;
    var denomination = req.body.denomination;

    var withdraw = {
        amount : amount,
        denomination : denomination,
    }

    // joi validation & call: cashWithdrawalViaAtm --> check available balance before dispensing cash
    Joi.validate(withdraw, validations.cashWithdrawalViaAtm, (error, validated) => {
        if (error) {
            res.json({"response" : error.message});
            return;
        }

        JWT.verify(token, secretKeys.jwtSecretkey, function(error, validated){
            if(error) {
                console.log({"response" : error.message});
                res.json({"response" : error.message}); 
            }else{
                // get account details from the token
                var CardInsertedDetails = {
                    accountNumber : validated.data.accountNumber, // from the atm card chip
                    atmCardPin : validated.data.atmCardPin,
                    amount : amount,
                    denomination : denomination,
                };

                // console.log(CardInsertedDetails);

                // call cashWithdrawalViaAtm
                atmOperations.cashWithdrawalViaAtm(CardInsertedDetails)
                .then(
                    (onfulfilled) => {
                        res.json({receipt : onfulfilled });
                        return;
                    },
                    (onrejected) => {
                        res.json({response : onrejected.message});
                        return;
                    },
                );
            }
        });
        

    });

});




// 4. balance enquiry via atm card plus JWT verification
app.get('/balanceEnquiry', (req, res) => {

    var header = req.headers.authorization.split(' ');
    var token = header[1];

    // verify token & call: balanceEnquiry --> check available balance 
    JWT.verify(token, secretKeys.jwtSecretkey, function(error, validated){
        if(error) {
            console.log({"response" : error.message});
            res.json({"response" : error.message}); 
        }else{
            // get account details from the token
            var CardInsertedDetails = {
                accountNumber : validated.data.accountNumber, // from the atm card chip
                atmCardPin : validated.data.atmCardPin
            };

            // console.log(CardInsertedDetails);

            // call balanceEnquiry
            atmOperations.balanceEnquiry(CardInsertedDetails)
            .then(
                (onfulfilled) => {
                    res.json({"Balance enquiry" : onfulfilled });
                    return;
                },
                (onrejected) => {
                    res.json({response : onrejected.message});
                    return;
                },
            );
        }
    });


});






app.listen(3500, () => {
    console.log("the atm is online... Running on port 3500");
})