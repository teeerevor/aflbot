import { expect }  from 'chai';
import Bot from '../bot';
import {returned} from '../returned';
import _ from 'lodash';
import moment from 'moment';


describe('aflbot', function() {
  let aflbot = new Bot();


  describe('grabScore', function() {
    it('should see super goals', function() {
      const homescore = [
        {stat:'/n          1'},
        {stat:'/n          2'},
        {stat:'/n          3'},
        {stat:'/n          4'},
      ];
      expect(aflbot.parseScore(homescore)).to.equal('1-2-3-4');
    });

    it('should clean a afle score', function() {
      const homescore = [
        {stat:'/n          1'},
        {stat:'/n          2'},
        {stat:'/n          3'},
      ];
      expect(aflbot.parseScore(homescore)).to.equal('1-2-3');
    });
  });
});
