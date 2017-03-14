import {
  jamFetch,
} from './api';
import Bot from './bot';

const games = [
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/gcfc-v-wb', gameSlug: 'CD_M20171010401'},
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/wce-v-melb', gameSlug: 'CD_M20171010402'},
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/gws-v-nmfc', gameSlug: 'CD_M20171010403'},
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/fre-v-carl', gameSlug: 'CD_M20171010404'},
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/rich-v-coll', gameSlug: 'CD_M20171010405'},
  {upcomming: false, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/adel-v-bl', gameSlug: 'CD_M20171010406'},
  {upcomming: true, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/port-v-haw', gameSlug: 'CD_M20171010407'},
  {upcomming: true, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/geel-v-ess', gameSlug: 'CD_M20171010408'},
  {upcomming: true, url:'http://www.afl.com.au/match-centre/jlt-community-series/2017/4/stk-v-syd', gameSlug: 'CD_M20171010409'},
]

const bots = [];

const watcher = setInterval( () =>
  gameWatcher()
, 15*60*1000);

const gameWatcher = () => {
  games.forEach((game) =>{
    if(game.upcomming){
      jamFetch(game.url, (json) => {
        const startingSoon = json.comments.length > 0 && json.comments.length < 10;
        console.log('starting soon =', startingSoon, " - " ,json.hometeam, " V ", json.awayteam, );
        if(startingSoon || game.forceStart)
          startGame(game);
      });
    }
  });
}

const startGame = (game) => {
  game.upcomming = false;
  const bot = new Bot(game);
}

gameWatcher();

