'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server({ load: { sampleInterval: 1000 } });

console.log(server.load.rss);
