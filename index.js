'use strict';

const path = require('path');
const fs = require('fs');

const dist = 'dist';
const assets = 'assets';
const distPath = path.join(process.cwd(), dist);
const assetsPath = path.join(distPath, assets);

const routes = require(path.join(process.cwd(), 'config', 'route.js'));
const renderHtml = require(path.join(process.cwd(), 'base', 'html.js'));
let renderLayout = require(path.join(assetsPath, 'layout.js'));

if (renderLayout.__esModule) {
  renderLayout = renderLayout['default'];
}

function fileExist(file) {
  let exist = true;
  try {
    fs.statSync(file);
  } catch(e) {
    if (e.errno === -2) {
      exist = false;
    }
  }

  return exist;
}

const scriptSrcs = [ `/${assets}/main.js` ];
const layoutCssExist = fileExist(path.join(assetsPath, 'layout.css'));


function renderRoute(route) {
  let page = require(path.join(assetsPath, `${route.name}.js`));
  if (page.__esModule) {
    page = page['default'];
  }

  const pageHtml = page.render(route);

  if (!pageHtml) {
    return null;
  }

  const content = renderLayout(pageHtml);

  const csshrefs = [];
  if (layoutCssExist) {
    csshrefs.push(`/${assets}/layout.css`);
  }

  if (fileExist(path.join(assetsPath, `${route.name}.css`))) {
    csshrefs.push(`/${assets}/${route.name}.css`);
  }

  const html = renderHtml(
    route.path,
    content,
    csshrefs,
    scriptSrcs
  );

  return html;
}

function render404() {
  const content = renderLayout('');

  const cssHrefs = [];
  if (layoutCssExist) {
    cssHrefs.push(`/${assets}/layout.css`);
  }

  const html = renderHtml(
    null,
    content,
    cssHrefs,
    scriptSrcs
  );

  return html;
}

function write(fileName, content) {
  fs.writeFile(fileName, content, (err) => {
    if (err) throw err;
    console.log(`[Done] ${fileName}`);
  });
}


// prerender each route
routes.forEach((route) => {
  if (route.skipPrerender) {
    console.log(`[Skip] ${route.name}`);
    return;
  }

  const html = renderRoute(route);
  if (html) {
    const filePath = path.join(distPath, route.path);
    if (!fileExist(filePath)) {
      fs.mkdirSync(filePath);
    }

    const fileName = path.join(filePath, 'index.html');
    write(fileName, html);
  } else {
    console.log(`[Skip] ${route.name}`);
  }

});


// generate 404.html
write(path.join(distPath, '404.html'), render404());
