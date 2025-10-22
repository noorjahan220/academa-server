const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rq93w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   // CORRECTED: Connect the client to the server FIRST
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // CORRECTED: Use the correct database and collection names from your screenshot
    const database = client.db("collegeDb"); 
    const AllCollegeDb = database.collection("AllCollegeDb");

    app.get('/colleges', async (req, res) => {
      try {
        const cursor = AllCollegeDb.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch colleges:", error);
        res.status(500).send({ message: 'Failed to fetch colleges' });
      }
    });

   app.get('/colleges/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // This line will now work because ObjectId is imported
        const query = { _id: new ObjectId(id) }; 
        const college = await AllCollegeDb.findOne(query);

        if (college) {
            res.send(college);
        } else {
            res.status(404).send({ message: 'College not found' });
        }
    } catch (error) {
        console.error("Failed to fetch college:", error);
        res.status(500).send({ message: 'Failed to fetch college' });
    }
});

    // Ping to confirm a successful connection (optional, good for testing)
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You confirmed a successful connection!");

  } catch(err) {
      console.error("Failed to connect or run server logic:", err);
  }
  // REMOVED: The `finally` block that was closing the connection
  // The connection should stay open as long as the server is running.
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Hello from my express server side');
})

app.listen(port, ()=>{
    console.log(`Listening to port ${port}`);
});