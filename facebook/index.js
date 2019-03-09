const puppeteer = require('puppeteer')
const db = require('./models')
require('dotenv').config()


const crawler = async () => {
  try{
    await db.sequelize.sync()
    const browser = await puppeteer.launch({headless : false, args : ['--window-size=1920,1080', '--disable-notifications']})
    const page = await browser.newPage()
    await page.setViewport({
      width : 1080,
      height : 1080
    })
    await page.goto('https://facebook.com')
    
    // 페북 아이디 비번
    const id = process.env.ID
    const password = process.env.PASSWORD

    await page.type('#email', id)
    await page.type("#pass", password)    
    await page.click("#loginbutton")
    
    // feed 뜨길 기다리는 것
    await page.waitForResponse( response => {
      return response.url().includes('login_attempt')
    })




    // await page.waitFor(1000)
    // await page.close()
    // await browser.close()
  }catch(e){
    console.error(e)
  }
}
crawler()