const puppeteer = require('puppeteer');
const express = require('express');
require('fetch-everywhere');

require('../js/core.js');


async function takeScreenshot(sketchId) {
    const res = await fetch(`https://emrg-pcg.firebaseio.com/sketch/${sketchId}.json`);
    const json = await res.json();
    return json;
}

async function getIndex(req, res) {
    const sketch = await takeScreenshot('-L4uLB99JzFHMPcVoiTm');
    res.end(JSON.stringify(sketch));
}

const app = express();

app.get('/', getIndex);
app.listen(3000, () => console.log('Listening on http://localhost:3000/'));

// (async() => {
//     const browser = await puppeteer.launch()
//     const page = await browser.newPage();
//     await page.goto('https://seed.emrg.be/sketch/-L4uLB99JzFHMPcVoiTm');
//     await page.screenshot({path: 'seed.png'});
//     await browser.close();
// })();
