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
        await client.db('admin').command({ ping: 1 })
        console.log('You successfully connected to MongoDB!')
    } catch (err) {
        console.log(err)
    }
}
dbConnect();
const verifyToken = (req, res, next) => {
    if (!req?.headers?.authorization) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ message: 'Unauthorized Access' });
        }
        req.decoded = decoded
        next();
    })

}
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
    })
    res.send({ token });

})

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
        return res.status(403).send({ message: 'Forbidden Access' });
    }
    next();
}

app.get('/', (req, res) => {
    res.send('Pay with ease with Pay-Ease!');
});
app.post('/auth/register', async (req, res) => {
    const { name, pin, phone, email,userType  } = req.body;

    // Validate input
    if (!name || !pin || !phone || !email|| !userType) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    try {
    
        // Create a new user object
        const newUser = {
            name,
            pin: hashedPin,
            mobile: phone,
            email,
            AppliedAs: userType ,
            status: 'pending',
            balance: 0 ,
        };

        // Insert the new user into the database
        const result = await usersCollection.insertOne(newUser);
        
        // Respond with the created user data (omit the PIN for security)
        const { pin: _, ...userWithoutPin } = newUser;
        res.status(201).json({ message: 'User registered successfully!', user: userWithoutPin });

    } catch (error) {
        console.error(error);
        console.log('Error: ', error);
        res.status(500).json({ message: 'Internal server error' });
    } 
});
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    const users = await usersCollection.find().toArray();
    res.send(users);
}
);



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
