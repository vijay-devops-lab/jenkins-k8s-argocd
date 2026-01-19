const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("CI/CD with Jenkins + Argo CD 🚀");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
