const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  let { name, username, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.send(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        name,
        username,
        email,
        password: hash,
      });

      let token = jwt.sign({ email: email, userid: user._id }, "postly");
      res.cookie("token", token);
    });
  });
});

app.get("/login", async (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.send(500).send("Something went wrong");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "postly");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

app.get("/logout", async (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLogggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts")
  res.render("profile", { user });
});

app.post("/post", isLogggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;

  let post = await postModel.create({
    user: user._id,
    content,
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
});

app.get("/like/:id", isLogggedIn, async (req, res) => {
  let post = await postModel
    .findOne({ _id: req.params.id })
    .populate("user");
  
  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1)
  }
  
  await post.save()
  res.redirect("/profile");
});

function isLogggedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "postly");
    req.user = data;
    next();
  }
}

app.listen(3000, () => {
  console.log("Server Started");
});
