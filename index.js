const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rq93w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // CORRECTED: Connect the client to the server FIRST
    await client.connect();
    console.log("Successfully connected to MongoDB!");

    // CORRECTED: Use the correct database and collection names from your screenshot
    const database = client.db("collegeDb");
    const AllCollegeDb = database.collection("AllCollegeDb");
    const admissionsCollection = database.collection("admissions");
    const reviewsCollection = database.collection("reviews");
    const usersCollection = database.collection("users");
    app.get("/colleges", async (req, res) => {
      try {
        const cursor = AllCollegeDb.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch colleges:", error);
        res.status(500).send({ message: "Failed to fetch colleges" });
      }
    });

    app.get("/colleges/:id", async (req, res) => {
      try {
        const id = req.params.id;
        // This line will now work because ObjectId is imported
        const query = { _id: new ObjectId(id) };
        const college = await AllCollegeDb.findOne(query);

        if (college) {
          res.send(college);
        } else {
          res.status(404).send({ message: "College not found" });
        }
      } catch (error) {
        console.error("Failed to fetch college:", error);
        res.status(500).send({ message: "Failed to fetch college" });
      }
    });
    // 1. POST endpoint to save a new admission application
    app.post("/admissions", async (req, res) => {
      try {
        const admissionData = req.body;
        const result = await admissionsCollection.insertOne(admissionData);
        res.send(result);
      } catch (error) {
        console.error("Failed to submit admission:", error);
        res.status(500).send({ message: "Failed to submit admission" });
      }
    });

    // 2. GET endpoint to fetch admissions for a specific user by email
    app.get("/my-admissions/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { candidateEmail: email };
        const result = await admissionsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch user admissions:", error);
        res.status(500).send({ message: "Failed to fetch user admissions" });
      }
    });
    app.post("/reviews", async (req, res) => {
      try {
        const reviewData = req.body;
        // Add a timestamp to sort by newest first
        reviewData.createdAt = new Date();
        const result = await reviewsCollection.insertOne(reviewData);
        res.send(result);
      } catch (error) {
        console.error("Failed to submit review:", error);
        res.status(500).send({ message: "Failed to submit review" });
      }
    });

    // 2. GET endpoint to fetch all reviews
    app.get("/reviews", async (req, res) => {
      try {
        // Sort by createdAt in descending order to get the newest reviews first
        const cursor = reviewsCollection.find().sort({ createdAt: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });
    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (user) {
          res.send(user);
        } else {
          // Send an empty object or a specific status if user not in DB yet
          res
            .status(404)
            .send({ message: "User not found in custom database." });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        res.status(500).send({ message: "Failed to fetch user" });
      }
    });

    // 2. POST a new user (used during registration)
    // Using 'upsert' to prevent creating duplicate users if they register again
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);

        if (existingUser) {
          return res.send({ message: "User already exists in DB" });
        }

        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error("Failed to save user:", error);
        res.status(500).send({ message: "Failed to save user" });
      }
    });

    // 3. PATCH (update) a user's profile
    app.patch("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const updatedData = req.body;
        const filter = { email: email };

        // Create the update document using the $set operator
        const updateDoc = {
          $set: {
            name: updatedData.name,
            university: updatedData.university,
            address: updatedData.address,
            phone: updatedData.phone,
           
          },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Failed to update user:", error);
        res.status(500).send({ message: "Failed to update user" });
      }
    });

    // Ping to confirm a successful connection (optional, good for testing)
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You confirmed a successful connection!"
    );
  } catch (err) {
    console.error("Failed to connect or run server logic:", err);
  }
  // REMOVED: The `finally` block that was closing the connection
  // The connection should stay open as long as the server is running.
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from my express server side");
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
