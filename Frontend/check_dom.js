const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);
  const rect = await page.evaluate(() => {
    const hero = document.getElementById("hero");
    const motionDiv = hero.querySelector(".max-w-4xl");
    const heroRect = hero.getBoundingClientRect();
    const mdRect = motionDiv ? motionDiv.getBoundingClientRect() : null;
    const children = Array.from(hero.children).map(c => ({
      tag: c.tagName,
      cls: c.className,
      x: c.getBoundingClientRect().x,
      y: c.getBoundingClientRect().y,
      w: c.getBoundingClientRect().width,
      h: c.getBoundingClientRect().height,
      isAbs: window.getComputedStyle(c).position === "absolute"
    }));
    return { hero: heroRect, md: mdRect, children };
  });
  console.log(JSON.stringify(rect, null, 2));
  await browser.close();
})();
