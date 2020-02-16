const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const path = require('path');
const Joi = require('joi');
const SHA256 = require('crypto-js/sha256');

const db = require('./db');
const collection = 'block';

const schema = Joi.object().keys({
    index : Joi.number().required(),
    name : Joi.string().required(),
    timestamp : Joi.string().required(),
    prevHash : Joi.string().required(),
    hash : Joi.string().required()
});

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//read
app.get('/getBlock',(req,res) => {

    db.getDB().collection(collection).find({}).toArray((err,documents)=> {
        if(err) {
            // console.log(err);
        } else {
            // console.log(documents);
            // console.log('test start');
            // console.log(SHA256('meng').toString());
            // console.log('test end');
            // res.json({status : true, documents});
            res.json(documents);

        }
    });
});

app.get('/validateChain',(req,res) => {
    db.getDB().collection(collection).find({}).toArray((err,documents)=> {
        if(err) {
            console.log(err);
        } else {
            // console.log(documents);
            // res.json(documents);
            // print('validate chain');
            // console.log(documents[1]);
            var status = true;
            for (i = 1; i < documents.length - 1; i++) {

                const currentHash = SHA256(documents[i].index + documents[i].name + documents[i].timestamp + documents[i].prevHash).toString();

                if (currentHash != documents[i].hash || documents[i].hash != documents[i+1].prevHash) {
                    status = false;
                    break;
                }

            }

            // console.log(status);

            //coba hapus ini []

            if (status == false) {
                res.json({status : false, index: i});
            } else {
                res.json({status : true});
            }
        }
    });
});

//add data
app.post('/',(req,res,next) => {
    const userInput = req.body;

    db.getDB().collection(collection).find().sort({$natural:-1}).limit(1).toArray(function (err, result) {
        // console.log(userInput);
        // console.log('----');
        userInput.prevHash = result[0].hash;
        userInput.index = result[0].index + 1;
        const timestamp = new Date();
        const formatted_date = timestamp.getDate() + "-" + (timestamp.getMonth() + 1) + "-" + timestamp.getFullYear()
        userInput.timestamp = formatted_date.toString();
        userInput.hash = SHA256(userInput.index + userInput.name + userInput.timestamp.toString() + userInput.prevHash).toString();
        // console.log(userInput);
        Joi.validate(userInput,schema,(err,result) => {
            if (err) {
                const error = new Error("Invalid Input");
                error.status = 400;
                next(error);
            } else {
                db.getDB().collection(collection).insertOne(userInput,(err,result) => {
                    if(err) {
                        const error = new Error("Failed to insert Todo document");
                        error.status = 400;
                        next(error);
                    } else {
                        res.json({result: result, document : result.ops[0], msg : "successfuly inserted", error : null});
                    }
                });
            }
        });

    });
    
});

app.use((err,req,res,next) => {
    res.status(err.status).json({
        error : {
            message: err.message
        }
    })
})

db.connect((err) => {
    if (err) {
        console.log('Unable to connect to DB');
        process.exit(1);
    } else {
        app.listen(3000, () => {
            console.log('Connected to DB, listening to port 3000');
        });
    }
});