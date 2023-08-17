/*
=-=-=-=-=-=-=-=-=-=-=-=-
PetFinder API and CATapi
=-=-=-=-=-=-=-=-=-=-=-=-
Student ID:23654004
Comment (Required):
Server recieves an Id and api request for recieving pet information and gives a picture. 
=-=-=-=-=-=-=-=-=-=-=-=-
*/

const fs = require("fs");
const url = require("url");
const http = require('http');
const https = require('https');

const port = 3000;
const {client_id, apiKey} = require("./auth/auth.json");
const queryString = require("querystring");
const server = http.createServer();

server.on("listening", listening_handler);
server.listen(port);
function listening_handler(){
	console.log(`Now Listening on Port ${port}`);
}

server.on("request", connection_handler);

function connection_handler(req, res)
{
    console.log(`New Request Received from ${req.url}`);
    if(req.url === '/')
    {
      let formStream =  fs.createReadStream("./html/index.html");
      res.writeHead(200, {"Content-Type": "text/html"});
      formStream.pipe(res);
     
    } 
    else if(req.url.startsWith("/get_pet"))
    { // request urls
      const pet_type = url.parse(req.url, true).query;
      callCatApi(pet_type, res);
    }
    else{
      res.writeHead(404, {'Content-Type':'text/html'});
      res.end(`<h1>404 Not Found.</h1>`);
    }
}

function callCatApi (pet_type, ret) 
{
    let options = 
    {
      'method': 'GET',
      'hostname': 'thatcopy.pw',
      'path': '/catapi/rest/',
      'headers': {
      },
      'maxRedirects': 20
    };

    let req = https.request(options, function (res) 
    {
        const chunks = [];
        res.on("data", function (chunk) 
    {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) 
    {
      let body = Buffer.concat(chunks);
      console.log(body.toString());
      get_access_tokken(pet_type, ret);
    });

    res.on("error", function (error) 
    {
      console.error(error);
    });
  });

  req.end();
}

function get_access_tokken(value, ret)
{   
  // for getting token by submitting client id and client secret
  const options = {
  'method': 'POST',
  'hostname': 'api.petfinder.com',
  'path': '/v2/oauth2/token',
  'headers': {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  'maxRedirects': 20
};

const req = https.request(options, function (res) 
{
  const chunks = [];

  res.on("data", function (chunk) 
  { //get data chunk by chunk and merge in array
    chunks.push(chunk);
  });

  res.on("end", function (chunk) 
  { //when data recieved from the server 
    const body = Buffer.concat(chunks);
    console.log(body.toString());
    const data = JSON.parse(body.toString());
    tokken = data.access_token;
    //call to another api after recieving tokken
    get_animal(value.petType, ret);
  });

  res.on("error", function (error) 
  {
    console.error(error);
  });
});

const postData = queryString.stringify(
{
  'grant_type': 'client_credentials',
  'client_id': apiKey,
  'client_secret': client_id
});

req.write(postData);
req.end();
}

function get_animal(type, ret)
{
const options = 
{
  'method': 'GET',
  'hostname': 'api.petfinder.com',
  'path': `/v2/animals/${type}`,
  'headers': {
    'Authorization': `Bearer ${tokken}`
  },
  'maxRedirects': 20
};

const req = https.request(options, function (res) 
{
  const chunks = [];

  res.on("data", function (chunk) 
  {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) 
  {
    const body = Buffer.concat(chunks);
    console.log(body.toString());
    ret.writeHead(200, { 'Content-Type': 'text/html' });
    ret.write(htmlDoc(body.toString()));
  });

  res.on("error", function (error) 
  {
    console.error(error);
  });
});

req.end();
}

function htmlDoc(data) 
{
  const pet = JSON.parse(data);
  const doc = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <style>
      body {
          background-color: white;
          
      }
      h1{
          color: red;
          text-align: center;
          
      }
      h2{
          color:royalblue;
          text-align: center;
          
      }
   
  </style>
  <body>
      <h1>SUCCESS</h1>
      <h2>YOUR PET FOUND</h2>

      <p>PET NAME: ${pet.animal.name}</P>
      <p>PET DESCRIPTION: ${pet.animal.description}</P>
      <p>PET TAGS: ${pet.animal.tags}</P>
      <p>PET STATUS: ${pet.animal.status}</P>
      <img src=${pet.animal.primary_photo_cropped.small} />
      <p>PET URL: ${pet.animal.url}</P>
      <a href="http://localhost:3000/">RETURN TO APP!</a>
      
  </body>
  </html>`
  return doc;
}
