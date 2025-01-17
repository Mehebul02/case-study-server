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
    // "http://localhost:5173",
    // "http://localhost:5174",
    'https://case-study-b14df.web.app',
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
// jwt verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      console.log(decoded)

      req.user = decoded
      next()
    })
  }
}
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
    const submitCollection = client.db("assignmentsDB").collection("submits");

    // jwt generate
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    // clear token logout
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true })
    })

    // Assignment spacify data
    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });
    // data server site get
    app.get("/assignments", async (req, res) => {
      const result = await assignmentsCollection.find().toArray();
      res.send(result);
    });
    // Assignment post
    app.post("/assignments", async (req, res) => {
      const user = req.body;
      const result = await assignmentsCollection.insertOne(user);
      res.send(result);
    });
    // my submit assignment 
   app.get('/submits', async(req,res)=>{
    const query = submitCollection.find()
    const result = await query.toArray()
    res.send(result)
   })
  //  spacify assignment 
  app.get('/submits/:id', async(req,res)=>{
    const id =req.params.id
    const query = {_id : new ObjectId (id)}
    const result =await submitCollection.findOne(query)
    res.send(result)
  })
    app.post("/submits", async (req, res) => {
      const submitData = req.body;
      // console.log(bidData)
      const result = await submitCollection.insertOne(submitData);
      res.send(result);
    });
    // my assignment
    app.get("/my-submit/:email",async (req, res) => {
      // const tokenEmail = req.user?.email;
      // console.log(tokenEmail, "from token");
      const email = req.params.email;
      // if(tokenEmail === email){
      //   return res.status(401).send({ message: "forbidden access" })
      // }
      const query = { email : email };
      const result = await assignmentsCollection.find(query).toArray();
      res.send(result);
    });
    app.get('submitss/:status',async(req,res)=>{
      const status =req.status?.Pending
      const query ={status :status}
      const  result=await submitCollection.find(query).toArray()
      res.send(result)

    
    })
    // update assignment
    app.put("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const assignmentData = req.body;
      const options = { upsert: true };
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...assignmentData,
        },
      };
      const result = await assignmentsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // delete my assignment
    app.delete("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Database delete ", id);
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const giveMark = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...giveMark,
        },
      };
      const result = await submitCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
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
  console.log(`Case Study Server is running${port}`);
});
