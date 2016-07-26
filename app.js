var Crawler = require("crawler");
var url = require('url');
var colors = require('colors');
var http = require('http');
var fs = require('fs');
var mkdirp = require('mkdirp');
var S = require('string');

var config = {
  target: 'http://www.asx.com.au/asx/statistics/todayAnns.do'
};
var _global = [];
var counter = 0;
var date = S(new Date()).replaceAll(' ', '-').s;
console.log(date);
mkdirp(date, function(err){ if(err){
  console.log(err);
}});
var savePDF = function(url, filename){
  var file = fs.createWriteStream(date + '/' + filename);
  var request = http.get(url, function(response){
    response.pipe(file);
  });
};

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, result, $) {
        // $ is Cheerio by default
        switch(result.uri){
          case config.target:
            $('td.pricesens').each(function(index, cell){
              var $parent = $(cell).parent();
              var pdfConf = 'http://www.asx.com.au' + $parent.find('td:nth-child(6) > a').attr('href');

              _global.push({
                conf: pdfConf,
                name: S($parent.find('td:nth-child(4)').html()).replaceAll(' ', '-').s,
                code: $parent.find('th').text(),
                time: S($parent.find('td:nth-child(2)').text()).replaceAll(' ', '').s,
              });

              console.log((pdfConf).green);
              c.queue(pdfConf);

            });
            break;
          default:
            var pdf = ('http://www.asx.com.au') + ($("input[name='pdfURL']").val() || $("input[name='pdfURL']").attr('value'));
            if(pdf){
              for(var key in _global){
                if(_global.hasOwnProperty(key)){
                  if(_global[key].conf == result.uri){

                    var filename = _global[key].time + '~' + _global[key].code + '~'
                      + S(S(S(_global[key].name).replaceAll('&amp;', '&').s).replaceAll('/', '\'').s).replaceAll(':', '-').s
                      + '.pdf';
                    savePDF(pdf, filename);
                    console.log(pdf + ' - '+ date +'/' + filename);

                  }
                }
              }
            }else{
              console.log('error on pdfconf'.red);
            }
            break;
        }

        //console.log(result.uri);
    },
    onDrain : function(){
      process.exit();
    }
});
c.queue(config.target);
console.log('Crawler started...'.green);
