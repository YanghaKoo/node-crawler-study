const puppeteer = require('puppeteer')
const db = require('./models')

// proxy 변경해서 크롤링 하기
const crawler = async () => {
  await db.sequelize.sync()
  try{
    let browser = await puppeteer.launch({headless : false, args : ['--window-size=1920,1080']})
    let page = await browser.newPage()
    await page.setViewport({
      width : 1080,
      height : 1080
    })
    await page.goto('http://spys.one/free-proxy-list/KR/')
    
    const proxies = await page.evaluate(() => {
      const ips = Array.from(document.querySelectorAll('tr > td:first-of-type > .spy14')).map((v) => v.textContent.replace(/document\.write\(.+\)/, ''));
      const types = Array.from(document.querySelectorAll('tr > td:nth-of-type(2)')).slice(5).map((v) => v.textContent);
      const latencies = Array.from(document.querySelectorAll('tr > td:nth-of-type(6) .spy1')).map((v) => v.textContent);
      return ips.map((v, i) => {
        return {
          ip: v,
          type: types[i],
          latency: latencies[i],
        }
      });
    });
    // http로 시작하는애 중 latency가 제일 낮은애 순으로 정렬 해서 latency가 제일 낮고, http로 시작하는 proxiy의 ip를 골라오는 것
    const filtered = proxies.filter(v =>  v.type.startsWith('HTTP')).sort((p,c)=> p.latency - c.latency)
    
    // 크롤링한 ip정보들을 dp에 넣어줌
    await Promise.all(
      filtered.map( async v => {
        return db.Proxy.create({
          ip : v.ip,
          type : v.type,
          latency : v.latency
        })
      })
    )

    await page.close()
    await browser.close() // 바꿀 ip찾고 브라우저를 닫음!! 이제 ip 바꿔서 새로 브라우저를 띄워봐야겠지?

    // proxy중에서 latency가 가장 적은 애를 하나 select해줌
    const fastestProxy = await db.Proxy.findOne({
      order : [["latency", "ASC"]],     // 괄호 [[]] 임에 주의, 시퀄라이즈는 where 도 이렇고 다 이런식이었지
    })

    
    // 브라우저 다시 띄우자, args에 proxy옵션에 위에서 찾아낸 아이피 넣어주기!!!!!!!!!!!!!!!!!!
    // filtered[0] [1]이 왜인지 안됨.. 2로 했음 그래서.. 
    browser = await puppeteer.launch({headless : false, args : ['--window-size=1920,1080', '--disable-notifications', `--proxy-server=${fastestProxy.ip}`]})  
    page = await browser.newPage()
    await page.goto('https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%EB%82%B4%EC%95%84%EC%9D%B4%ED%94%BC')
    await page.waitFor(10000)
    await page.close()
    await browser.close()
    
    await db.sequelize.close() // ??? 

  }catch(e){
    console.error(e)
  }
}
crawler()