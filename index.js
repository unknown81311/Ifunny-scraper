const axios = require('axios');
const {JSDOM} = require('jsdom');

const path = require('path');
const fs = require('fs');


const { document } = (new JSDOM(`<html><script></script></html>`)).window

async function downloadImage(remoteURL, directoryName){

  // Save  file here.
  // const path = path.(__dirname, 'images', remoteURL;
  // let file = remoteURL.replace(/(?=.(jpg|png|gif|jpeg|tiff))/, '');

  // console.log(remoteURL);

  let rx = /([a-z0-9]+_[0-9]\..+)/;
  let file = remoteURL.match(rx)[0];
  // console.log(file);

  if(!fs.existsSync(__dirname + '/' + 'images/' + directoryName))
    fs.mkdirSync(__dirname + '/' + 'images/' + directoryName);

  const filePath = path.resolve(__dirname, 'images', directoryName, file);

  // Create writer. This is what dynamically stores data to the disk.
  const writer = fs.createWriteStream(filePath);

  // Get the data from ifunny.
  const response = await axios({
    url: remoteURL,
    method: 'GET',
    responseType: 'stream'
  });

  // Start writing data to the disk
  response.data.pipe(writer);
}

async function mainFunction(address){
  // console.log(address);
  let res = await axios.get(address);

  let page = document.createElement('div');
  page.innerHTML = res.data;

  // DOM ELEMENT IMAGES
  let images = page.querySelectorAll('div.feed__list > ul > li > div > div > a > img');
  let imageUrls = [];

  for(var i = 0; i < images.length; i++){
    let img = images[i];
    let imageURL = img.getAttribute('data-src');

    imageURL = imageURL.replace(/imageproxy/g, 'img');
    imageURL = imageURL.replace(/(?<=ifunny.co)\/(crop|resize):[^\/]+(?=\/)/g, '');

    imageUrls.push(imageURL);
  }

  // console.log(address);
  let dirName = address.match(/\/([^\/]+?)$/)[1];
  // console.log(dirName);
  for(var i = 0; i < imageUrls.length; i++){
    try{
      await downloadImage(imageUrls[i], dirName);
    }
    catch(ex){
      console.log(ex);
    }
  }
}

// console.log(process.argv);
(async() => {
  await mainFunction(process.argv[2]);
})()
