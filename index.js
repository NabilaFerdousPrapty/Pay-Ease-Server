require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require('cors');
const express = require('express');
const jwt =  require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware

app.use(cors(
    {
        origin: ["http://localhost:5173",
            
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
))

app.use(express.json());



// Connect to MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pflyccd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const usersCollection = client.db("Pay-Ease").collection("Users");
async function dbConnect() {
    try {
        // await client.db('admin').command({ ping: 1 })
        console.log('You successfully connected to MongoDB!')
    } catch (err) {
        console.log(err)
    }
}
dbConnect()

app.get('/', (req, res) => {
    res.send('Pay with ease with Pay-Ease!');
});
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
