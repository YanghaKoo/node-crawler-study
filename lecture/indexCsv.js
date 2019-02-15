/*
  chapter 1. CSV 파일 파싱하기  (comma seperated value) = ,랑 줄바꿈으로 구분된 값들
  csv를 parsing해주는애를 설치하자 : npm i csv-parse
*/

// CSV파일 파싱하는 법

const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync"); // 정보를 csv파일에 쓰기 위함
const fs = require("fs");
const puppeteer = require("puppeteer"); // 퍼퍼티어 시작!

const csv = fs.readFileSync("csv/data.csv"); // 얘는 읽어 오는데 버퍼임 -> 문자열로 바꿔주는 작업이 필요
const records = parse(csv.toString("utf-8")); // csv.toString으로 문자열로 만든 후 parse로 2차원 배열로 만들어줌

console.log(records);
/*
  records.forEach((r,i) =>{
    console.log(i,r) // 링크는 r[1]에 있고, r[0] : 영화제목
  }) 
*/

// 여기서부턴 퍼페티어 사용 크롤링하기
/*
    크로미움 브라우저 띄우기! (비동기)
    퍼페티어는 항상 비동기처리로 해줘야함 await
    headless 옵션 : true로 하면 화면이 없는 브라우저가 된다  
    개발모드일때만 false로 화면 보고, 실제 서버에선 true로 회면 없이 돌리면 되겠다.
    
    개발 -> {headless : false} , 배포 -> {headless : true}
  */

/*  
    퍼페티어 기본 사용법  
  const crawler = async () => {
    const browser = await puppeteer.launch({headless : false})   

    // 탭 띄우기, 이렇게하면 탭 3개
    // 3개 탭 동시에 띄워서 page, page2, page3에 저장
    const [page, page2, page3] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ])

    await Promise.all([
      page.goto('https://koostagram.xyz'), // 페이지로 이동
      page2.goto('https://naver.com'),
      page3.goto('https://instagram.com')
    ])

    await Promise.all([
      page.waitFor(3000), // 봇 아닌척 하려고 3초 대기
      page2.waitFor(2000),
      page3.waitFor(1000),
    ])

    // 페이지(탭) 끄기
    await page.close()
    await page2.close()
    await page3.close()
    
    await browser.close() // 브라우저 끄기 와 존나 신기하다 시발
   */


// 본격 퍼페티어 크롤링
const crawler = async () => {
  try {
    const result = []; // 결과 담아서 csv파일에 쓸거임


    const browser = await puppeteer.launch({ headless: false });
    
    
    // 기존 첫 커밋을 보면 promise.all로 되어있을텐데 그렇게 하면 사람같지 않자나
    // 시간을 두고 크롤링해야 티가 안남 --> for문으로 타임딜레이를 3초정도씩 두고 해야함
    // 먼저 페이지 하나를 띄우고 그 한 페이지에서 넘나들기로 (기존 10개 동시에 띄움)
    
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36")   // 유저에이전트, 크롬 f12에 navigator.userAgent 치고 복사해서 가져와, 유저에이전트를 설정해서 봇 아닌척 하는거임
    for(const [i,r] of records.entries()){
          // 링크로 접속하기
          await page.goto(r[1]);
 
          // html사용해서 태그 찾기, document 객체 사용해서 가져옴
          const text = await page.evaluate(() => {
            const score = document.querySelector(
              ".score.score_left .star_score"
            );
            // const score2 = document.querySelector(".score.score_left .star_score"); // 2개의 태그를 찾으려면 이거 추가
            if (score) {
              return score.textContent;
              // return {score : score.textContent, score2 : score2.textContent} // 2개 이상의 태그를 찾고 싶을때
            }
          });

          // 결과를 넣어줌 결과배열에, result.push 대신 인덱스를 사용해서 하면 속도와 순서 보장
          // 이게 POINT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          if (text) {
            console.log(r[0], "평점", text.trim());
            result[i] = [r[0], r[1], text.trim()];
          }

          // text.score, text.score2 // 2개이상일때는 이렇게 객체로 리턴해서 값을 가져와라
          await page.waitFor(3000); // 사람인척 연기 이런거 슬쩍
      }

    await browser.close();

    const str = stringify(result); // 2차원 배열을 csv 문자열로 변환해줌
    fs.writeFileSync("csv/result.csv", str);
  } catch (e) {
    console.log(e);
  }
};

crawler();
