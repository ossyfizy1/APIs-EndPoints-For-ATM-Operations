


// Note "mocha" library has been installed globally

var supertest = require("supertest");
var should = require("should");


// This agent refers to PORT where program is runninng.
var server = supertest.agent("http://localhost:3500");


// assign it token generated from "atmCardInsertion" route
var token;



// 1. account creation unit test begin
describe("bank Account Creation unit test, to test account creation route", function(){

  // #1 should return home page
  it("bank Account Creation", function(done){

        // calling home page api
        server
        .post("/bankAccountCreation")
        .send({
          "firstName" : "test",
          "lastName" : "osagie",
          "accountType" : "savings",
          "deposite" : "50000"
        })
        .expect("Content-type",/json/)
        .expect(200) // THis is HTTP response
        .end(function(err,res){
            // HTTP status should be 200
            res.status.should.equal(200);
            res.body.response.should.equal("account created succesfully")
            done();
        });
  });

});




// 2. atm card insertion unit test begin
describe("atm Card Insertion unit test, to test atm card insertion route", function(){

  // #1 should return home page
  it("atm Card Insertion", function(done){

        // calling home page api
        server
        .post("/atmCardInsertion")
        .send({	"accountNumber" : "9575807174", "atmCardPin" : "3126" })
        .expect("Content-type",/json/)
        .expect(200) // THis is HTTP response
        .end(function(err,res){
            // HTTP status should be 200
            res.status.should.equal(200);

            // console.log(res.body.response.token);

            // set our token gotten here to the token variable declared above
            token = res.body.response.token;


            done();
        });
  });

});



// 3. account creation unit test begin
describe("cash Withdrawal Via Atm unit test, to test cash withdrawal route", function(){

  // #1 should return home page
  it("cash Withdrawal Via Atm", function(done){

        // calling home page api
        server
        .post("/cashWithdrawalViaAtm")
        .set('Authorization', 'Bearer ' + token)  // to set header token
        .send({	"amount" : "500", "denomination" : "500" })
        .expect("Content-type",/json/)
        .expect(200) // THis is HTTP response
        .end(function(err,res){
            // HTTP status should be 200
            res.status.should.equal(200);
            done();
        });
  });

});



// 4. balance enquiry unit test begin
describe("balance Enquiry unit test, to test balance enquiry route", function(){

  // #1 should return home page
  it("balance Enquiry: should return balance enquiry", function(done){

        // calling home page api
        server
        .get("/balanceEnquiry")
        .set('Authorization', 'Bearer ' + token)  // to set header token
        .expect("Content-type",/json/)
        .expect(200) // THis is HTTP response
        .end(function(err,res){
            // HTTP status should be 200
            res.status.should.equal(200);
            done();
        });
  });

});