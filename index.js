const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();
const port = process.env.PORT || 8000;
// middleWare
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    // 'https://solosphere.web.app',
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// jwt verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "Unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized access" });
        // return
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
  console.log(token);
};
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.po42dna.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const assignmentsCollection = client
      .db("assignmentsDB")
      .collection("assignments");
    // const bidsCollection = client.db("soloSphere").collection("bids");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("Dynamic token---->", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // clear token logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });


    // Assignment get 
    app.get('/assignments/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id :new ObjectId(id)}
        const result = await assignmentsCollection.findOne(query)
        res.send(result)
    })
    app.get('/assignments',async(req,res)=>{
      
        const result = await assignmentsCollection.find().toArray()
        res.send(result)
    })
    // Assignment post 
    app.post("/assignments", async (req, res) => {
      const user = req.body;
      const result = await assignmentsCollection.insertOne(user);
      res.send(result);
    });

    // delete my job
    // app.delete("/job/:id",verifyToken, async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await jobsCollection.deleteOne(query);
    //   res.send(result);
    // });
    // update data
    // app.put("/job/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const jobData = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       ...jobData,
    //     },
    //   };
    //   const result = await jobsCollection.updateOne(query, updateDoc, options);
    //   res.send(result);
    // });
    // // my bids adde
    // app.get("/my-bids/:email",verifyToken, async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const result = await bidsCollection.find(query).toArray();
    //   res.send(result);
    // });
    // //  bids request
    // app.get("/bids-request/:email",verifyToken, async (req, res) => {
    //   const email = req.params.email;
    //   const query = { "buyer.email": email };
    //   const result = await bidsCollection.find(query).toArray();
    //   res.send(result);
    // });
    // // bid status update
    // app.patch("/update-status/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const status = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: status,
    //   };
    //   const result = await bidsCollection.updateOne(query, updateDoc);
    //   res.send(result);
    // });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`SoleSphere Server is running${port}`);
});
