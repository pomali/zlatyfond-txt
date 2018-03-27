const fetch = require('node-fetch')
const url = require('url')
const FeedParser = require('feedparser')
const cheerio = require('cheerio')



const indexRoute = async () => 
  fetch('https://feeds2.feedburner.com/zlatyfond')
    .then(x => x.text())
    .then( 
      text => {
        return new Promise(
          (resolve, reason) => {
            const feedparser = new FeedParser()
            let output = []
            const done = () => {
              resolve(output)
            }

            feedparser.on('error', () => reject('hohoho') );
            feedparser.on('end', done);
            feedparser.on('readable', function() {
              let post;
              while (post = this.read()) {
                output.push({
                  title: post.title,
                  url: post.origlink,
                });
              }
            });
            feedparser.end(text)
          }
        )
      }
    )
    .then(x => {
      console.log(x)
      return x
    })
    .then( books => {
      let out = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ZlatyFond txt</title>
          <style>
            body { font-size: 20pt}
          </style>
        </head>
        <body><ul>`
      out += books.map(
        b => `<li><a href="/?url=${encodeURIComponent(b.url)}">${b.title}</a></li>`
      ).join('')

      out += "</ul></body></html>"
      return out
    })

const fetchRoute = async (bookUrl) => {
  return fetch(bookUrl)
    .then( 
      x => {
        //console.log(x)
        return x.text()
      }, 
      res => console.error(res)
    )
    .then( html => {
      const $ = cheerio.load(html)('#sub2>div')
      const reg = (x) => x.split('\n').map(x => x.trim()).join('\n')
      const nadpis = reg($.find('h2').text())
      const text = reg($.find('.chapter').text())
      return `
      ${nadpis}
      ${text}
      `
    }).catch(e => console.error(e))
}

module.exports = async (request, response) => {
  const reqUrl =  url.parse(request.url, true)
  const query = reqUrl.query
  console.log(request.url, reqUrl, query)
  if (query && query.url){
    const bookUrl = query.url
    response.setHeader('Content-Type', 'text/plain; charset=utf8')
    return fetchRoute(bookUrl)
  } if (reqUrl.path == '/favicon.ico' ){
    return null
  }else {
    return indexRoute()
  }
}
