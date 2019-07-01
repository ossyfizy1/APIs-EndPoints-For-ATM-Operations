var Joi = require("joi");

// create the schema
// tutorial from https://www.futurice.com/blog/what-ive-learned-validating-with-joi/

const bankAccountCreation = {
    firstName: Joi.string().min(3).max(50).required().error(new Error("first name is required")),
    lastName: Joi.string().min(3).max(50).required().error(new Error("last name is required")),
    accountType: Joi.string().min(3).max(50).required().error(new Error("account type is required")),
    deposite: Joi.string().min(4).max(50).required().error(new Error("deposite is required")),
}


const atmCardInsertion = {
    accountNumber : Joi.string().min(10).max(10).required().error(new Error("could not read account number from the atm card chip, retry card.")),
    atmCardPin: Joi.string().min(4).max(4).required().error(new Error("invalid pin, a four digit pin is required"))
}


const cashWithdrawalViaAtm = {
    amount : Joi.string().min(3).max(7).required().error(new Error("invalid amount entered")),
    denomination: Joi.string().min(3).max(4).required().error(new Error("invalid denomination entered"))
}




module.exports = {
                    bankAccountCreation : bankAccountCreation,
                    atmCardInsertion : atmCardInsertion,
                    cashWithdrawalViaAtm : cashWithdrawalViaAtm,
                  }