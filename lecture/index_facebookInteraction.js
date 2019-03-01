require('dotenv').config()
const puppeteer = require('puppeteer')


// 페이스북보다 로그인 시키고 상호작용 하는 예제임
const crawler = async () => {
  try{
    const browser = await puppeteer.launch({headless : false, args : ['--window-size=1920,1080']})
    const page = await browser.newPage()
    await page.setViewport({
      width : 1080,
      height : 1080
    })
    
    await page.goto('https://facebook.com')


    // process.env를 사용하려면 이렇게 사용해야함
    // page.evaluate 내에서는 자바스크립트의 스코프를 사용하지 않기 때문에 넘겨줘야함 인자로!!!!!!!!!!!!!! 중요
    const id = process.env.fb_id
    const password = process.env.fb_pw

    // 방법 1) value입력하고 click시켜서 로그인 시키기
    /*
      await page.evaluate((id,password)=>{
        document.querySelector('#email').value = id
        document.querySelector('#pass').value = password
        document.querySelector('#loginbutton').click()      
      }, id, password)
    */

    // 방법 2) 퍼페티어가 제공하는 API 활용, 이 방법은 키보드로 직접 입력하는 효과를 줌!!
    await page.type('#email', process.env.fb_id)
    await page.type('#pass', process.env.fb_pw)
    await page.hover('#loginbutton')    // 마우스 올리기
    await page.waitFor(1000) // 1초대기
    await page.click('#loginbutton')    // 실제 클릭
    
    // 여기까지 하면 로그인 성공! 
    // 근데 들어가면 알림 권한 요청때문에 화면이 까매지지, 이걸 없애야지 원활하게 할 수 있음, esc버튼을 누르면 사라짐
    await page.waitFor(10000) // 10초정도 대기, 이렇게 하는건 별로고(인터넷 상황에따라 달라질수 있으니까 대기시간이)
    await page.keyboard.press('Escape') // Esc 클릭
    await page.waitFor(3000)
    // 여기서 뭐 할것들 작업 하고

    
    // 로그아웃
    await page.click('#userNavigationLabel') // 네비게이션 열고
    await page.waitForSelector('li.navSubmenu:last-child') // 선택자 뜨길 기다렸다가 ( 여기가 포인트!! )
    await page.click('li.navSubmenu:last-child') // 페이지 태그 분석해서 로그아웃 버튼 클릭시키기
        
    // await page.close()
    // await browser.close()
  }catch(e){
    console.error(e)
  }
}
crawler()