const puppeteer = require('puppeteer')


// 페이스북보다 로그인 시키고 상호작용 하는 예제임
const crawler = async () => {
  try{
    const browser = await puppeteer.launch({headless : false, args : ['--window-size=1920,1080', '--disable-notifications']})
    const page = await browser.newPage()
    await page.setViewport({
      width : 1080,
      height : 1080
    })
    await page.goto('https:')

    await page.close()
    await browser.close()
  }catch(e){
    console.error(e)
  }
}
crawler()