const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

fs.readdir('imgs', (e)=>{
  if(e) fs.mkdirSync('imgs')
})

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://unsplash.com");

    // 크롤링 핵심 evaluate 함수. DOM BOM 사용가능
    // 인피니트 스크롤 -> 스크롤을 내려야 새 컨텐츠가 뜸 -> 크롤링 하고 이미 크롤링한 DOM은 delete 해버리고 스크롤을 내려서 새 컨텐츠를 가져오고 또 지우고.. 반복\
    let result = [];
    while (result.length <= 30) {
      const srcs = await page.evaluate(() => {
        window.scrollTo(0,0) // 크롤링 시작시 스크롤을 제일 위로 올림
        let imgs = [];

        const imgEls = document.querySelectorAll("._1pn7R"); // 이미지를 담든 컨테이너 (태그분석)
        if (imgEls.length) {
          
          // evaluate에선 map사용이 안됨
          imgEls.forEach(v => {
            let src = v.querySelector("img._2zEKz").src; // 이미지
            if (src) imgs.push(src);

            // 여기서 이제 태그를 지울거임
            // v는 이미지임, v가 아닌 _1pn7R(컨테이너)를 지워야함
            // 컨테이너의 부모로 들어가서 v를 지워서 지움
            v.parentElement.removeChild(v);
          });
        }

        // 스크롤  내린 효과 주기 두번에 나눠서, 원래는 한번에 해도 되어야하는데 뭐 사이트마다 다른거
        window.scrollBy(0, 100); // 세로로 100px 내리는 효과
        setTimeout(()=>{
          window.scrollBy(0, 200); // 세로로 200px 내리는 효과
        },500)
        
        return imgs;
      });
      result = result.concat(srcs);

      // 위에서 ipn7R을 지웠는데 새로운 셀렉터 1pn7R을 기다리는 것, 30초간 기다린 후 선택자를 못찾으면 timeout 에러
      await page.waitForSelector("._1pn7R");
    }

    console.log(result); // 여기에 30개의 링크가 다 담겼으니까 파일로 저장하면 되지 axios + arraybuffer
    result.forEach( async src => {
      const imgResult = await axios.get(src.replace(/\?.*$/, ''), {responseType : 'arraybuffer'})
      fs.writeFileSync(`imgs/${new Date().valueOf()}.jpeg`, imgResult.data)
    })

    await page.close()
    await browser.close()
  } catch (e) {
    console.log(e);
  }
};

crawler();
