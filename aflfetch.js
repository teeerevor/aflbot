import https from 'https';
import fetch from 'node-fetch';


const AFLJSON = {
  'title': 'title',
   "hometeam": ".home-team",
   "awayteam": ".away-team",
  'comments': [{'elem': '.commentary-comment', 'comment': 'text'}],
};

export const jamFetch = (url, callback) => {
  fetch('https://www.jamapi.xyz', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    body: JSON.stringify({url: url, json_data: JSON.stringify(AFLJSON) })
    }).then((response) => {
      return response.json();
    }).then((json) => {
        callback(json);
    }).catch((error) => {
      console.log("Error while calling endpoint.", error);
    });
}


  sheetGet((sheet)=> {
    sheet.forEach((game) => {
      let {gameId, status, url, commentsPoint, commentry, teamStats} = game;
      sheetPut( gameId,
        {
          gameId,
          status,
          url,
          commentsPoint: parseInt(commentsPoint) + 1,
          commentry,
          teamStats,
        }
      );
    });
  })
