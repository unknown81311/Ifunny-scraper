//hello world!
const axios = require('axios');
const {JSDOM} = require('jsdom');

const path = require('path');
const fs = require('fs');

const chalk = require('chalk');

var Jetty = require("jetty");
var jetty = new Jetty(process.stdout);

const { document } = (new JSDOM(`<html><script></script></html>`)).window

let nameList = process.argv[2].split(',');
let col = process.stdout.columns;
let row = process.stdout.rows;
let mid = Math.floor(row/2);
jetty.clear();
async function downloadImage(remoteURL, directoryName){

  let rx = /([a-z0-9]+_[0-9]\..+)/;
  let file = remoteURL.match(rx)[0];

  if(!fs.existsSync(__dirname + '/' + 'images/'))
    fs.mkdirSync(__dirname + '/' + 'images/');

  if(!fs.existsSync(__dirname + '/' + 'images/' + directoryName))
    fs.mkdirSync(__dirname + '/' + 'images/' + directoryName);

  const filePath = path.resolve(__dirname, 'images', directoryName, file);

  // Create writer. This is what dynamically stores data to the disk.
  const writer = fs.createWriteStream(filePath);

  // Get the data from ifunny.
  jetty.moveTo([0,0]);
  jetty.text(chalk.gray('-->') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${remoteURL}                                                  `));
  jetty.moveTo([3,0]);
  const response = await axios({
    url: remoteURL,
    method: 'GET',
    responseType: 'stream'
  }).then(function(res){
    //jetty.moveTo([5,0]);
    jetty.text(chalk.gray('<--') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${remoteURL}                                                  `));
    jetty.moveTo([mid,0]);
    jetty.text(printResCode(res.status));
    return res;
  }).catch(function(err){
    jetty.text(chalk.red('XXX') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${remoteURL}                                                  `));
    jetty.moveTo([mid,0]);
    jetty.text(printResCode(err.response.status));
  });
  // Start writing data to the disk
  response.data.pipe(writer);

}
// Prints the status code with some color
function printResCode(code){
  if(code >= 500)
    return chalk.red(`status ${code}`);
  if(code >= 400)
    return chalk.purple(`status ${code}`);
  if(code >= 300)
    return chalk.yellow(`status ${code}`);
  if(code >= 200)
    return chalk.green(`status ${code}`);
  if(code >= 100)
    return chalk.red(`status ${code}`);
}

async function mainFunction(address){
  // jetty.text(address);
  let nextPageKey;
  let pageAddress = address;
  let dirName = address.match(/\/([^\/]+?)$/)[1];
  let pageCounter = 0;
  let counter = 0;
  let total = 0;

  do{
      let col = process.stdout.columns;
      let row = process.stdout.rows;
      let mid = Math.floor(row/2);

    jetty.moveTo([0,0]);
    jetty.text(chalk.gray('-->') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${pageAddress}                                                  `));
    jetty.moveTo([3,0]);
    let res = await axios.get(pageAddress).then(function(res){
      jetty.text(chalk.gray('<--') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${pageAddress}                                                  `));
    jetty.moveTo([mid,0]);
    jetty.text(printResCode(res.status));
      return res;
    }).catch(function(err){
      jetty.text(chalk.red('XXX') + ' ' + chalk.white('GET') + ' ' + chalk.yellow(`${pageAddress}                                                  `));
      jetty.moveTo([mid,0]);
      jetty.text(printResCode(err.response.status));
    });

    let page = document.createElement('div');
    page.innerHTML = res.data;
    total = res.data.match(/"total_posts":(\d*),/)[1];
    // Get the next page key and address
    nextPageKey = page.querySelector('div.feed__list > ul > li').getAttribute('data-next');

    pageCounter++;
    pageAddress = `https://ifunny.co/user/${dirName}/timeline/${nextPageKey}?page=${pageCounter}&mode=list`;

    // DOM ELEMENT IMAGES
    let images = page.querySelectorAll('div.feed__list > ul > li > div > div > a > img');
    let imageUrls = [];

    for(var i = 0; i < images.length; i++){
      let img = images[i];
      let imageURL = img.getAttribute('data-src');

      imageURL = imageURL.replace(/(?<=ifunny.co\/)(crop|resize):[^\/]+(?=\/)/g, 'crop:x-20');

      imageUrls.push(imageURL);
    }
    for(var i = 0; i < imageUrls.length; i++){
      try{
        await downloadImage(imageUrls[i], dirName);
        counter ++;
        let per = counter/total*100;
        per = Number((per).toFixed(1));
        jetty.moveTo([row,0]);
        jetty.text(chalk.green(`(${i+1}/10)|(${counter}/${total})|${per}%   `));
        //jetty.text('\n');
        if (counter == total) {
          jetty.moveTo([row,0]);
          jetty.text("\ndone!       ")
        }
      }
      catch(ex){
        console.log(ex);
      }
    }
  }
  while(nextPageKey)
}
jetty.clear();
(async() => {
  let nameList = process.argv[2].split(',');
  for(var i = 0; i < nameList.length; i++){
    await mainFunction("https://ifunny.co/user/" + nameList[i]);
    jetty.clear();
  }
})()