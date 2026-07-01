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

// async function run() {
//     try {
//         await client.connect();

client.connect(() => {
    console.log('connecting to MongoDB')
}).catch(console.dir);

const db = client.db('arthub_db');
const usersCollection = db.collection('user');
const artworkCollection = db.collection('artworks');
const subscriptionCollection = db.collection('subscriptions');
const purhcaseCollection = db.collection('purchase');

// user related apis
// get all users
app.get('/api/users', async (req, res) => {
    if (req.query.Id) {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.query.Id) })
        return res.send(user);
    }
    const query = {};
    if (req.query.role) {
        query.role = req.query.role
    }
    const cursor = usersCollection.find(query);
    const users = await cursor.toArray();
    res.send(users)
})

// get users purchase histroy 
app.get('/api/purchase', async (req, res) => {
    const query = {}
    if (req.query.buyerId) {
        query.buyerId = req.query.buyerId;
    }
    const cursor = purhcaseCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
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
    if (req.query.category) {
        query.category = req.query.category;
    }
    if (req.query.search) {
        query.$or = [
            { title: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
        ]
    }
    const cursor = artworkCollection.find(query);
    const artworks = await cursor.toArray();
    res.send(artworks || [])
})

// get artworks of an artist by atristId
app.get('/api/my/artworks/:id', async (req, res) => {
    const id = req.params.id
    const cursor = artworkCollection.find({ artistId: id });
    const artworks = await cursor.toArray();
    res.send(artworks || []);
})

// update an arwork
app.patch('/api/my/artworks/update/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const data = req.body;
    const updatedArtwork = {
        $set: {
            ...data,
            updatedAt: new Date()
        }
    }
    const result = await artworkCollection.updateOne(filter, updatedArtwork)
    res.send(result);
})

// delete an artwork
app.delete('/api/my/artworks/delete/:id', async (req, res) => {
    const id = req.params.id;
    const result = await artworkCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
})

// purchase an artwork
app.post('/api/purchase', async (req, res) => {
    // This should:
    // 1. Push artworkId into purchaseArtworksId
    // 3. (Optional) Create a Purchase collection/document
    const data = req.body;
    const purchaseInfo = {
        ...data,
        time: new Date()
    }
    const addPurchase = await purhcaseCollection.insertOne(purchaseInfo);

    // push into purchaseartworks
    const filter = { _id: new ObjectId(data.buyerId) };
    const updateDoc = {
        $push: {
            purchaseArtworksId: data.artworkId
        },
    }
    const updateResult = await usersCollection.updateOne(filter, updateDoc);

    // update the artwork's status to 'sold'
    const artworkFilter = { _id: new ObjectId(data.artworkId) };
    const artworkUpdateDoc = {
        $set: {
            status: 'sold'
        }
    }
    const artworkUpdateResult = await artworkCollection.updateOne(artworkFilter, artworkUpdateDoc);
    res.send({})
})

// subscription related apis
// add subscriptions
app.post('/api/subscriptions', async (req, res) => {
    const data = req.body;
    const subInfo = {
        ...data,
        createdAt: new Date()
    }
    const result = await subscriptionCollection.insertOne(subInfo);

    const filter = { email: data.email };
    const updateDoc = {
        $set: {
            plan: data.planId
        }
    }
    const updateResult = await usersCollection.updateMany(filter, updateDoc);
    console.log('Subscription added and user plan updated:', updateResult);
    res.send(updateResult);
})

// get all subscriptions
app.get('/api/subscriptions', async (req, res) => {
    const result = await subscriptionCollection.find().toArray();
    res.send(result);
})
// get all purchases
app.get('/api/purchases', async (req, res) => {
    const result = await purhcaseCollection.find().toArray();
    res.send(result);
})

app.get('/', (req, res) => {
    res.send('ArtHub server is running.')
})

//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         // await client.close();
//     }
// }
// run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
})