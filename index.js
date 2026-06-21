const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = 5555

app.use(express.json())
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        const db = client.db('arthub_db');
        const usersCollection = db.collection('user');
        const artworkCollection = db.collection('artworks');

        // user related apis
        // get all users
        app.get('/api/users', async(req, res) => {
            if (req.query.Id) {
                const user = await usersCollection.findOne({_id: new ObjectId(req.query.Id)})
                return res.send(user);
            }
            const cursor = usersCollection.find();
            const users = await cursor.toArray();
            res.send(users)
        })

        // artwork related apis
        // post an artwork
        app.post('/api/artworks', async (req, res) => {
            const data = req.body;
            const artworkInfo = {
                ...data,
                createdAt: new Date()
            }
            const result = await artworkCollection.insertOne(artworkInfo);
            res.send(result);
        })

        // get artworks
        app.get('/api/artworks', async (req, res) => {
            const query = {};
            if (req.query.artId) {                
                query._id = new ObjectId(req.query.artId);
                const art = await artworkCollection.findOne(query);
                return res.send(art || {});
            }
            const cursor = artworkCollection.find();
            const artworks = await cursor.toArray();
            res.send(artworks || [])
        })

        // get artworks of an artist by atristId
        app.get('/api/my/artworks/:id', async (req, res) => {
            console.log('/api/my/artworks')
            const id = req.params.id
            const cursor = artworkCollection.find({artistId: id});
            const artworks = await cursor.toArray();
            res.send(artworks  || []);
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