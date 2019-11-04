'use strict';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const LCUConnector = require('lcu-connector');
const fetch = require('node-fetch');
const http = require('https');
const path = require('path');

const express = require('express');
const app = express();

const {ChampionMinimal} = require('./champion');


const lcu = new LCUConnector();

const summonerUri = 'lol-summoner/v1/current-summoner';
const championsUri = id => `lol-champions/v1/inventories/${id}/champions-minimal`;

function getUri(data, uri) {
    return `${data.protocol}://${data.address}:${data.port}/${uri}`;
}

function getChampSquare(patch, championName) {
    return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championName}.png`;
}

let data;
const headers = {
    'Accept': 'application/json'
};

const agent = new http.Agent({
    keepAlive: true
});

const options = {
    agent: () => agent
};

let championData = [];

lcu.on('connect', async (lcuData) => {
    data = lcuData;
    headers['Authorization'] = `Basic ${Buffer.from(`${data.username}:${data.password}`).toString('base64')}`;
    
    options['headers'] = headers;

    const summonerRes = await fetch(getUri(data, summonerUri), options);
    const summonerJson = await summonerRes.json();

    const championRes = await fetch(getUri(data, championsUri(summonerJson.summonerId)), options);
    const championJson = await championRes.json();

    if (championJson.errorCode) {
        console.error('Could not detect champions!');
        console.error(championJson.message);
        process.exit(1);
    }

    let champs = [];

    for (const champ of championJson) {
        champs.push(new ChampionMinimal(champ));
    }

    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versionJson = await versionsRes.json();

    const currentPatch = versionJson[0];

    for (const champ of champs) {
        if (champ.ownership.owned) {
            let imgName = champ.alias;

            // Misformed champ aliases
            switch(champ.alias) {
                case 'FiddleSticks': imgName = 'Fiddlesticks'; break;
            }

            championData.push({
                name: champ.name,
                image: getChampSquare(currentPatch, imgName)
            });
        }
    }

    // sort a-z
    championData.sort(function(a, b) {
        var textA = a.name;
        var textB = b.name;
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/championSquaresOwned', (req, res) => {
    res.send(championData);
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});

lcu.start();
