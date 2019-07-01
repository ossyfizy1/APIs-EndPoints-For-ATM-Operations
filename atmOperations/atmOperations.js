var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID
var Joi = require("joi");
var JWT = require("jsonwebtoken");
var secretKeys = require("../secretkeys/secretkeys");



// Note: there are no classes in javascript
//  so we create our own class-like structure using object or object literals as below

var atmOperations = {

     // database properties here
     url : process.env.MONGODB_URI || "mongodb://localhost:27017/",
     dbName : process.env.MONGODB_NAME || "atmServices", 
     accountCreation : "accountCreation",


    // 1. bank account creation
    bankAccountCreation : (customerAccountDetails) => {

        // random generate 10 digit account number
        var accountNumber = Math.floor((Math.random() * 10000000000) + 1);

        // random generate 4 pin for the customer's atm card
        var atmCardPin = Math.floor((Math.random() * 10000) + 1);

        // current details to save to database 
        var accountDetails = {

                                fullname : {
                                    firstName : customerAccountDetails.firstName,
                                    lastName : customerAccountDetails.lastName,
                                },
                                accountDetails : {
                                    accountType : customerAccountDetails.accountType,
                                    balance : customerAccountDetails.deposite,
                                    accountNumber : accountNumber,
                                    atmCardPin : atmCardPin,
                                    pinValidationAttempt : 0
                                } 

                                
                            };

        // console.log(accountDetails);

        if (accountDetails) {
            // create unique index on account number and insert into database
            return MongoClient.connect(atmOperations.url, {useNewUrlParser : true}).then((db) => {
                var dbo = db.db(atmOperations.dbName);

                // create an index on account number.
                return dbo.collection(atmOperations.accountCreation).createIndex({"accountDetails.accountNumber" : 1}, {unique:true}).then((onfulfilled) => {
                    // insert into the database
                    return dbo.collection(atmOperations.accountCreation).insertOne(accountDetails);
                });
            })
            .then( (result) => {
                return result;
            });
        }
    

    },  // always add "comma" at the end of every function 



    // 2. atm card pin validate
    validateAtmCardPin : (atmCardInserted) => {

        // parseInt: convert the pin code from string to int
        var accountNumber = parseInt(atmCardInserted.accountNumber);
        var atmCardPin = parseInt(atmCardInserted.atmCardPin);

        // query filter
        var cardDetails = {
                            "accountDetails.accountNumber" : accountNumber,
                            "accountDetails.atmCardPin" : atmCardPin
                        }

        // database check for atm card pin
        return MongoClient.connect(atmOperations.url, {useNewUrlParser : true}).then((db) => {
           var dbo = db.db(atmOperations.dbName);

           return dbo.collection(atmOperations.accountCreation).findOne(cardDetails).then((onfulfilled) => {
                if (onfulfilled == undefined || onfulfilled == null) {

                    // get the specified account number in question
                    return dbo.collection(atmOperations.accountCreation).findOne({"accountDetails.accountNumber" : accountNumber}).then((onfulfilled) => {


                        if (onfulfilled.accountDetails.pinValidationAttempt == 3) {
                            return response = {"message" : "your pin has been blocked."};
                        }
                        else{
                            var newAttemptCount = onfulfilled.accountDetails.pinValidationAttempt + 1;
                            // update the pinValidationAttempt fields for the specified account number
                            return dbo.collection(atmOperations.accountCreation).updateOne({"accountDetails.accountNumber" : accountNumber}, { $set : { "accountDetails.pinValidationAttempt" :  newAttemptCount}}).then((onfulfilled) => {
                                return response = {"message" : "wrong pin entered, try again. Number of attempts: " + newAttemptCount};
                            });

                        }

                    });


                }
                else{
                    // payLoad for JWT creation
                    var payLoad = {
                        "accountNumber" : accountNumber,
                        "atmCardPin" : atmCardPin
                    }

                    // generate the token
                    var token = JWT.sign({data: payLoad }, secretKeys.jwtSecretkey, { expiresIn: '1h' });

                    // 
                    if (token) {
                        // reset the pinValidationAttempt fields for the specified account number to 0
                        return dbo.collection(atmOperations.accountCreation).updateOne({"accountDetails.accountNumber" : accountNumber}, { $set : { "accountDetails.pinValidationAttempt" :  0}}).then((pinValidationAttemptUpdated) => {

                            return response = {
                                        "message" : "welcome " + onfulfilled.fullname.firstName,
                                        "token" : token
                                    };
                        });

                    }
                    
                }
           });

        })
        .then( (result) => {
            return result;
        });

        
    },  // always add "comma" at the end of every function 


     
    // 3. cash withdrawal via atm using card
    cashWithdrawalViaAtm : (CardInsertedDetails) => {

        var accountNumber = CardInsertedDetails.accountNumber;
        var atmCardPin = CardInsertedDetails.atmCardPin;
        var amountToWithdraw = CardInsertedDetails.amount; // 500 naira notes or 1000 naira notes
        var denomination = CardInsertedDetails.denomination;

        // check balance 1st before dispensing cash
        // query filter
        var cardDetails = {
            "accountDetails.accountNumber" : accountNumber,
            "accountDetails.atmCardPin" : atmCardPin
        }

        
        return MongoClient.connect(atmOperations.url, {useNewUrlParser : true}).then((db) => {
        var dbo = db.db(atmOperations.dbName);

            return dbo.collection(atmOperations.accountCreation).findOne(cardDetails).then((onfulfilled) => {
            if (onfulfilled) {

                   var customersBalance = onfulfilled.accountDetails.balance;

                   if (denomination == 500 || denomination == 1000) {
                       // check if customer has sufficient balance
                        if (customersBalance < amountToWithdraw ) {
                            return "insuffiecient fund";

                        }else{

                            var newBalance = customersBalance - amountToWithdraw;
                            return dbo.collection(atmOperations.accountCreation).updateOne(cardDetails, { $set: {"accountDetails.balance" : newBalance} }).then((onfulfilled) => {

                            var dateTimeOfTransaction = new Date();
                            var receipt = {
                                "transaction date & time: " : dateTimeOfTransaction,
                                "transaction type: " : "cash withdrawal",
                                "cash dispensed in domination of: " : denomination,
                                 "withdrew this amount: " : amountToWithdraw,
                                "available balance: " : newBalance,

                                            };

                            return receipt;
                            });
                        }  
                   }
                   else{
                    return "kindly select either 500 or 1000 denomination";
                   }

                     
                
                }
            });

        })
        .then( (result) => {
            return result;
        });


    },  // always add "comma" at the end of every function




    // 4. balance enquiry via atm card
    balanceEnquiry : (atmCardInserted) => {

        // parseInt: convert the pin code from string to int
        var accountNumber = parseInt(atmCardInserted.accountNumber);
        var atmCardPin = parseInt(atmCardInserted.atmCardPin);

        // query filter
        var cardDetails = {
                            "accountDetails.accountNumber" : accountNumber,
                            "accountDetails.atmCardPin" : atmCardPin
                        }

        // database check for atm card pin
        return MongoClient.connect(atmOperations.url, {useNewUrlParser : true}).then((db) => {
           var dbo = db.db(atmOperations.dbName);

            // get the account balance
           return dbo.collection(atmOperations.accountCreation).findOne(cardDetails).then((onfulfilled) => {
                if (onfulfilled) {
                    
                    var accountBalance = onfulfilled.accountDetails.balance;
                    return accountBalance;
                }
           });

        })
        .then( (result) => {
            return result;
        });

        
    },  // always add "comma" at the end of every function 










} // end of atmOperations


module.exports = atmOperations;