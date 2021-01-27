// 1.CREATE SERVER FOLDER
// * CREATE APP.JS
// * NPM INIT -Y IN THE FOLDER
// * NPM INSTALL EXPRESS

const express = require("express");
const app = express(); //creating a server
const cors = require('cors')
app.use(cors());  //cross origin request

app.set("views","./views");
app.use(express.static("public"));
app.set("view engine","ejs");

const http = require("http").createServer(app); //creating a port via app same used by socket.io

//pick code from public folder w ebought from frontend

app.get("/", function (request, response) {
    // response.redirect("index.ejs");
    response.render('index', { title: 'Hey', message: 'Hello there!' });
})

let port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log('server is listening at 3000 port');
});
