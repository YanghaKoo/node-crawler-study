require("dotenv").config();
const puppeteer = require("puppeteer");

// 페이스북보다 로그인 시키고 상호작용 하는 예제임
const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size=1920,1080", "--disable-notifications"]
    }); // 여기 args에 disable notification 하면 알림허용하겠습니까? 이거 자체가 안뜸
    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080
    });

    await page.goto("https://facebook.com");

    // 이거는 그냥 마우스 위치 css적으로 보여주는 코드, 복붙
    await page.evaluate(() => {
      (() => {
        const box = document.createElement("div");
        box.classList.add("mouse-helper");
        const styleElement = document.createElement("style");
        styleElement.innerHTML = `
          .mouse-helper {
            pointer-events: none;
            position: absolute;
            z-index: 100000;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            background: rgba(0,0,0,.4);
            border: 1px solid white;
            border-radius: 10px;
            margin-left: -10px;
            margin-top: -10px;
            transition: background .2s, border-radius .2s, border-color .2s;
          }
          .mouse-helper.button-1 {
            transition: none;
            background: rgba(0,0,0,0.9);
          }
          .mouse-helper.button-2 {
            transition: none;
            border-color: rgba(0,0,255,0.9);
          }
          .mouse-helper.button-3 {
            transition: none;
            border-radius: 4px;
          }
          .mouse-helper.button-4 {
            transition: none;
            border-color: rgba(255,0,0,0.9);
          }
          .mouse-helper.button-5 {
            transition: none;
            border-color: rgba(0,255,0,0.9);
          }
          `;
        document.head.appendChild(styleElement);
        document.body.appendChild(box);
        document.addEventListener(
          "mousemove",
          event => {
            box.style.left = event.pageX + "px";
            box.style.top = event.pageY + "px";
            updateButtons(event.buttons);
          },
          true
        );
        document.addEventListener(
          "mousedown",
          event => {
            updateButtons(event.buttons);
            box.classList.add("button-" + event.which);
          },
          true
        );
        document.addEventListener(
          "mouseup",
          event => {
            updateButtons(event.buttons);
            box.classList.remove("button-" + event.which);
          },
          true
        );
        function updateButtons(buttons) {
          for (let i = 0; i < 5; i++)
            box.classList.toggle("button-" + i, !!(buttons & (1 << i)));
        }
      })();
    });

    // process.env를 사용하려면 이렇게 사용해야함
    // page.evaluate 내에서는 자바스크립트의 스코프를 사용하지 않기 때문에 넘겨줘야함 인자로!!!!!!!!!!!!!! 중요
    const id = process.env.fb_id;
    const password = process.env.fb_pw;

    // 방법 1) value입력하고 click시켜서 로그인 시키기
    /*
      await page.evaluate((id,password)=>{
        document.querySelector('#email').value = id
        document.querySelector('#pass').value = password
        document.querySelector('#loginbutton').click()      
      }, id, password)
    */



    // 방법 2) 퍼페티어가 제공하는 API 활용, 이 방법은 키보드로 직접 입력하는 효과를 줌!!
    // await page.focus("#email") // 이건그냥 tab같은걸로 포커스 잡는거, 근데 페이스북에선 안되네
    /*
      await page.click("#email") // 포커스가 안먹으니까 클릭해서 포커싱을 주자
      await page.keyboard.down('ShiftLeft') // 쉬프트를 누른상태에서 ㅇ비력하면 대문자가 입력되지 , down으로 계속 누르고 있는 상태
      await page.keyboard.press('KeyY')
      await page.keyboard.press('KeyA')
      await page.keyboard.press('KeyN')
      await page.keyboard.press('KeyG')
      await page.keyboard.press('KeyH')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('ShiftLeft')
      
      await page.waitFor(5000)
     */

    await page.type("#email", process.env.fb_id);
    await page.type("#pass", process.env.fb_pw);
    await page.hover("#loginbutton"); // 마우스 올리기
    await page.click("#loginbutton"); // 실제 클릭

    // 최후의 방법, 마우스로 조작하기
    await page.mouse.move(1000, 40); // 로그인 버튼에 마우스 위치, 좌표
    await page.waitFor(1000); // 1초대기
    await page.mouse.click() // 마우스로!! 해당 좌표 클릭

    
    // 여기까지 하면 로그인 성공!
    // 근데 들어가면 알림 권한 요청때문에 화면이 까매지지, 이걸 없애야지 원활하게 할 수 있음, esc버튼을 누르면 사라짐
    await page.waitFor(10000); // 10초정도 대기, 이렇게 하는건 별로고(인터넷 상황에따라 달라질수 있으니까 대기시간이)

    /*
      이렇게 부정확하게 10초기다리는거 말고 정확한 방법!
      network탭을 분석해보면 login-attemp를 기다리면 되는것
      await page.waitForResponse( response => {
        response.url().includes('login_attempt')
      })
      await page.waitFor(3000)
    */


    await page.keyboard.press("Escape"); // Esc 클릭, 근데 앞에서 args에 notification을 꺼서 사실상 없어도 됨 이제, 알림허용하시겠습니까? 모달을 탈피하기 위함
    await page.waitFor(3000);
    // 여기서 뭐 할것들 작업 하고

    // 로그아웃
    await page.click("#userNavigationLabel"); // 네비게이션 열고
    await page.waitForSelector("li.navSubmenu:last-child"); // 선택자 뜨길 기다렸다가 ( 여기가 포인트!! )
    await page.click("li.navSubmenu:last-child"); // 페이지 태그 분석해서 로그아웃 버튼 클릭시키기

    await page.close()
    await browser.close()
  } catch (e) {
    console.error(e);
  }
};
crawler();
