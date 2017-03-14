import {
  aflFetch,
  slackPost,
} from './api';
import {returned} from './returned';
import _ from 'lodash';
import moment from 'moment';

const emojis = [
  {team:'Blues'     , longName: 'Carlton'           , emoji:':blues:'}    ,
  {team:'Bombers'   , longName: 'Essendon'          , emoji:':dons:'}     ,
  {team:'Bulldogs'  , longName: 'Western Bulldogs'  , emoji:':bulldogs:'} ,
  {team:'Cats'      , longName: 'Geelong Cats'      , emoji:':cats:'}     ,
  {team:'Crows'     , longName: 'Adelaide Crows'    , emoji:':crows:'}    ,
  {team:'Demons'    , longName: 'Melbourne'         , emoji:':dees:'}     ,
  {team:'Dockers'   , longName: 'Fremantle'         , emoji:':freo:'}     ,
  {team:'Eagles'    , longName: 'West Coast Eagles' , emoji:':eagles:'}   ,
  {team:'Giants'    , longName: 'GWS Giants'        , emoji:':gaints:'}   ,
  {team:'Hawks'     , longName: 'Hawthorn'          , emoji:':hawks:'}    ,
  {team:'Kangaroos' , longName: 'North Melbourne'   , emoji:':kangas:'}   ,
  {team:'Lions'     , longName: 'Brisbane Lions'    , emoji:':lions:'}    ,
  {team:'Magpies'   , longName: 'Collingwood'       , emoji:':pies:'}     ,
  {team:'Power'     , longName: 'Port Adelaide'     , emoji:':port:'}     ,
  {team:'Saints'    , longName: 'St Kilda'          , emoji:':saints:'}   ,
  {team:'Suns'      , longName: 'Gold Coast Suns'   , emoji:':suns:'}     ,
  {team:'Swans'     , longName: 'Sydney Swans'      , emoji:':swans:'}    ,
  {team:'Tigers'    , longName: 'Richmond'          , emoji:':tigers:'}   ,
];

let gameData;
let game = {
  title: '',
  commentCount: 1,
  homeTeam: '',
  awayTeam: '',
  homeEmoji: '',
  awayEmoji: '',
  homeScore: '',
  awayScore: '',
};


export const grabScore = (stats) => {
  const {superGoals, goals, behinds} = stats;
  const scoreTotal = (superGoals * 9) + (goals * 6) + behinds;
  const scoreArray = [
    Math.floor(superGoals),
    Math.floor(goals),
    Math.floor(behinds),
    Math.floor(scoreTotal),
  ];
  return scoreArray.join('-');
}

export const grabGameData = (game, data) => {
  game.homeTeam = data.homeTeam.teamName.teamName;
  game.awayTeam = data.awayTeam.teamName.teamName;
  game.title = game.homeTeam+ ' v ' + game.awayTeam;

  game.homeEmoji = _.find(emojis, {longName : game.homeTeam}).emoji;
  game.awayEmoji = _.find(emojis, {longName : game.awayTeam}).emoji;

  game.homeScore = grabScore(data.homeTeam.stats);
  game.awayScore = grabScore(data.awayTeam.stats);

}

export const replaceEmoji = (msg) => {
  for (var index in emojis) {
    const {team, emoji} = emojis[index];
    if (msg.indexOf(team) !== -1){
      const reg = new RegExp(team, 'g');
      return msg.replace(reg, ' ' + emoji);
    }
  }
}

export const formatStat = (msg, time) => {
  return time + '  ' + replaceEmoji(msg);
}

export const scoreMessage = () => {
  return`${game.homeEmoji} ${game.homeScore}  v  ${game.awayEmoji} ${game.awayScore}`;
}

export const matchupMessage = () => {
  return`${game.homeEmoji}  v  ${game.awayEmoji}`;
}

export const processMessage = (msg, time) => {
  let start = /is now underway/;
  let end = /The siren has sounded to end/;
  let goal = /GOAL/;
  let behind = /BEHIND/;

  if(msg.match(goal) || msg.match(behind)){
    msg = formatStat(msg, time)
    slackPost(msg);
  } else if(msg.match(start))
    slackPost(matchupMessage() + '  '+ msg);
  else if(msg.match(end))
    processGame(msg);
  else
    slackPost('> ' + msg);
}

export const processGame = (msg='') => {
  aflFetch('TEAM', (json) => {
    console.log('game data recieved');
    grabGameData(game, json);
    if(msg)
      slackPost(msg + '  ==>  ' + scoreMessage());
  });
}

let previousComment = '';
export const gameSlice = () => {
  aflFetch('COMMENTARY', (json) => {
    let commentIndex = json.commentaryEvent.length - game.commentCount;
    if(commentIndex === -1){
      console.log('noop');
      console.log('comments='+game.commentCount);
    }

    while(commentIndex >= 0 ){
      let {comment, periodNumber, periodSeconds} = json.commentaryEvent[commentIndex];
      game.commentCount++;
      commentIndex = json.commentaryEvent.length - game.commentCount;
      if(comment !== previousComment){
        previousComment = comment;
        let tmin = Math.floor(periodSeconds / 60);
        let tsec = periodSeconds % 60;
        let time = `Q${periodNumber} ${tmin}:${tsec}`;
        processMessage(comment, time);
      } else {
        console.log('Repeat - '+comment);
      }
    }
  });
}

processGame();
const gamethread = setInterval( () =>
  gameSlice()
, 30000);

