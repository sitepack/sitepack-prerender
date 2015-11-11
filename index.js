'use strict';

const path = require('path');
const fs = require('fs');

const dist = 'dist';
const assets = 'assets';
const distPath = path.join(process.cwd(), dist);
const assetsPath = path.join(distPath, assets);

const routes = require(path.join(process.cwd(), 'config', 'route.js'));
const renderHtml = require(path.join(process.cwd(), 'base', 'html.js'));
const renderLayout = require(path.join(assetsPath, 'layout.js'));

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

const mainScript = `<script src="/${assets}/main.js"></script>`;
const layoutCssExist = fileExist(path.join(assetsPath, 'layout.css'));
const layoutCssTag = `<link rel="stylesheet" href="/${assets}/layout.css">`;

function renderRoute(route) {
  const page = require(path.join(assetsPath, `${route.name}.js`));
  const pageHtml = page.render(route);

  if (!pageHtml) {
    return null;
  }

  const latout = renderLayout(pageHtml);

  let cssTags = '';
  if (layoutCssExist) {
    cssTags += layoutCssTag;
  }

  if (fileExist(path.join(assetsPath, `${route.name}.css`))) {
    cssTags += `<link rel="stylesheet" href="/${assets}/${route.name}.css">`;
  }

  const html = renderHtml(route.title, latout + mainScript)
    .replace('</head>', `${cssTags}</head>`);

  return html;
}

function render404() {
  const latout = renderLayout('');
  let html = renderHtml(null, latout + mainScript);

  if (layoutCssExist) {
    html = html.replace('</head>', `${layoutCssTag}</head>`);
  }

  return html;
}

function write(fileName, content) {
  fs.writeFile(fileName, content, (err) => {
    if (err) throw err;
    console.log(`[Done] ${fileName}`);
  });
}

routes.forEach(function(route) {
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

write(path.join(distPath, '404.html'), render404());
