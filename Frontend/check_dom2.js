const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000");
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => {
    const hero = document.getElementById("hero");
    if(!hero) return "No hero";
    let output = "HERO CHILDREN:\n";
    for(let i = 0; i < hero.children.length; i++) {
        let c = hero.children[i];
        let style = window.getComputedStyle(c);
        let rect = c.getBoundingClientRect();
        output += `[${c.tagName}] pos:${style.position} d:${style.display} flex:${style.flex} w:${rect.width} h:${rect.height} x:${rect.x} y:${rect.y} cls:${c.className.substring(0, 30)}\n`;
    }
    return output;
  });
  console.log(html);
  await browser.close();
})();
