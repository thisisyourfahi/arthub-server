const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = 5555

app.use(express.json())
app.use(cors());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const db = client.db('arthub_db')
        const usersCollection = db.collection('user')

        // user related apis
        // get all users
        app.get('/api/users', async(req, res) => {
            const cursor = usersCollection.find();
            const users = await cursor.toArray();
            res.send(users)
        })
        
        app.get('/', (req, res) => {
            res.send('ArtHub server is running.')
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
})