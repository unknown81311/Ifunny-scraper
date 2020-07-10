const axios = require('axios');
const {JSDOM} = require('jsdom');

const path = require('path');
const fs = require('fs');

const chalk = require('chalk');

const { document } = (new JSDOM(`<html><script></script></html>`)).window

async function downloadImage(remoteURL, directoryName){

  let rx = /([a-z0-9]+_[0-9]\..+)/;
  let file = remoteURL.match(rx)[0];

  if(!fs.existsSync(__dirname + '/' + 'images/' + directoryName))
    fs.mkdirSync(__dirname + '/' + 'images/' + directoryName);

  const filePath = path.resolve(__dirname, 'images', directoryName, file);

  // Create writer. This is what dynamically stores data to the disk.
  const writer = fs.createWriteStream(filePath);

  // Get the data from ifunny.
  console.log(chalk.gray('-->') + ' ' + chalk.white('GET') + ' ' + chalk.gray(remoteURL));
  const response = await axios({
    url: remoteURL,
    method: 'GET',
    responseType: 'stream'
  }).then(function(res){
    console.log(chalk.gray('<--') + ' ' + chalk.white('GET') + ' ' + chalk.gray(remoteURL) + ' ' + printResCode(res.status) + ' ' + chalk.gray());
    return res;
  }).catch(function(err){
    console.log(chalk.red('XXX') + ' ' + chalk.white('GET') + ' ' + chalk.gray(remoteURL) + ' ' + printResCode(res.error.status) + ' ' + chalk.gray());
  });

  // Start writing data to the disk
  response.data.pipe(writer);

}

// Prints the status code with some color
function printResCode(code){
  if(code >= 500)
    return chalk.red(code);
  if(code >= 400)
    return chalk.purple(code);
  if(code >= 300)
    return chalk.yellow(code);
  if(code >= 200)
    return chalk.green(code);
  if(code >= 100)
    return chalk.red(code);
}

async function mainFunction(address){
  // console.log(address);
  let nextPageKey;
  let pageAddress = address;
  let dirName = address.match(/\/([^\/]+?)$/)[1];
  let pageCounter = 0;
  do{
    console.log(chalk.gray('-->') + ' ' + chalk.white('GET') + ' ' + chalk.gray(pageAddress));
    let res = await axios.get(pageAddress).then(function(res){
      console.log(chalk.gray('<--') + ' ' + chalk.white('GET') + ' ' + chalk.gray(pageAddress) + ' ' + printResCode(res.status) + ' ' + chalk.gray());
      return res;
    }).catch(function(err){
      console.log(chalk.red('XXX') + ' ' + chalk.white('GET') + ' ' + chalk.gray(pageAddress) + ' ' + printResCode(err.response.status) + ' ' + chalk.gray());
    });

    let page = document.createElement('div');
    page.innerHTML = res.data;

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
        downloadImage(imageUrls[i], dirName);
      }
      catch(ex){
        console.log(ex);
      }
    }
  }
  while(nextPageKey)
}

(async() => {
  await mainFunction(`https://ifunny.co/user/${process.argv[2]}`);
})()
