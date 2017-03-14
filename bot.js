import {
  aflFetch,
  slackPost,
} from './api';
import {returned} from './returned';
import _ from 'lodash';
import moment from 'moment';
import {EMOJIS} from './constants';

export default class Bot {
  constructor(game, commentCount = 1, live=true){
    this.game = {
      title: '',
      commentCount,
      homeTeam: '',
      awayTeam: '',
      homeEmoji: '',
      awayEmoji: '',
      homeScore: '',
      awayScore: '',
      previousComment: '',
    }
    _.merge(this.game, game);
    this.thread = {};

    if(live){
      this.processGame();
      this.start();
    }
  }


  grabScore(stats){
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

  grabGameData(game, data){
    game.homeTeam = data.homeTeam.teamName.teamName;
    game.awayTeam = data.awayTeam.teamName.teamName;
    game.title = game.homeTeam+ ' v ' + game.awayTeam;

    game.homeEmoji = _.find(EMOJIS, {longName : game.homeTeam}).emoji;
    game.awayEmoji = _.find(EMOJIS, {longName : game.awayTeam}).emoji;

    game.homeScore = this.grabScore(data.homeTeam.stats);
    game.awayScore = this.grabScore(data.awayTeam.stats);

  }

  replaceEmoji(msg){
    for (var index in EMOJIS) {
      const {team, emoji} = EMOJIS[index];
      if (msg.indexOf(team) !== -1){
        const reg = new RegExp(team, 'g');
        return msg.replace(reg, ' ' + emoji);
      }
    }
  }

  formatStat(msg, time) {
    return time + '  ' + this.replaceEmoji(msg);
  }

  scoreMessage() {
    let {homeEmoji, homeScore, awayEmoji, awayScore} = this.game;
    return`${homeEmoji} ${homeScore}  v  ${awayEmoji} ${awayScore}`;
  }

  matchupMessage() {
    let {homeEmoji, awayEmoji} = this.game;
    return`${homeEmoji}  v  ${awayEmoji}`;
  }

  processMessage(msg, time) {
    let start = /is now underway/;
    let end = /The siren has sounded to end/;
    let goal = /GOAL/;
    let behind = /BEHIND/;

    if(msg.match(goal) || msg.match(behind)){
      msg = this.formatStat(msg, time)
      slackPost(msg);
    } else if(msg.match(start))
      slackPost(this.matchupMessage() + '  '+ msg);
    else if(msg.match(end))
      this.processGame(msg);
    else
      slackPost('> ' + msg);
  }

  processGame(msg='') {
    const game = this.game;
    const bot = this;
    aflFetch('TEAM', game.gameSlug, game.url, (json) => {
      console.log('game data recieved');
      bot.grabGameData(game, json);
      if(msg) {
        slackPost(msg + '  ==>  ' + bot.scoreMessage());
        if(msg.match(/Q4/))
          bot.stop();
      }
    });
  }

  getFormattedTime(quarter, seconds) {
    let min = Math.floor(seconds / 60);
    min = min < 10 ? '0' + min : min;
    let sec = seconds % 60;
    sec = sec < 10 ? '0' + sec : sec;
    return `Q${quarter} ${min}:${sec}`;
  }


  gameSlice() {
    const game = this.game;
    const bot = this;

    aflFetch('COMMENTARY', game.gameSlug, game.url, (json) => {
      let commentIndex = json.commentaryEvent.length - game.commentCount;
      if(commentIndex === -1){
        console.log('noop');
        console.log('comments='+game.commentCount);
      }

      while(commentIndex >= 0 ){
        let {comment, periodNumber, periodSeconds} = json.commentaryEvent[commentIndex];
        game.commentCount++;
        commentIndex = json.commentaryEvent.length - game.commentCount;
        if(comment !== game.previousComment){
          game.previousComment = comment;
          const time = bot.getFormattedTime(periodNumber, periodSeconds);
          bot.processMessage(comment, time);
        } else {
          console.log('Repeat - '+comment);
        }
      }
    });
  }

  start() {
    const bot = this;
    console.log('bot started');
    console.log(this.game.url);
    this.thread = setInterval( () =>
      bot.gameSlice()
    , 30000);
  }

  stop(){
    console.log('bot stoped');
    clearInterval(this.thread);
  }
}
