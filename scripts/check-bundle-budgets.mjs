import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST = path.resolve('dist');
const KIB = 1024;
// Limits sit ~3% above the measured sizes so a regression fails the build (perf/speed-pass:
// storefront 131.6 KiB, dashboard entry 22.9 KiB, dashboard initial JS 138.0 KiB).
const budgets = {
    storefrontInitial: 136 * KIB,
    themeStudioInitial: 200 * KIB,
    dashboardEntry: 24 * KIB,
    // Everything index.html loads before the first render (entry + modulepreloads): the login page
    // must not regrow to include the signed-in shell or the translation bundles.
    dashboardInitial: 142 * KIB,
    routeChunk: 200 * KIB,
};

function gzipBytes(file) {
    return zlib.gzipSync(fs.readFileSync(file), { level: 9 }).byteLength;
}

function javascriptReferences(htmlFile) {
    const html = fs.readFileSync(path.join(DIST, htmlFile), 'utf8');
    return [...new Set(
        [...html.matchAll(/(?:src|href)="\/(assets\/[^"?]+\.js)"/g)].map((match) => match[1]),
    )];
}

function initialBytes(htmlFile) {
    return javascriptReferences(htmlFile)
        .reduce((total, file) => total + gzipBytes(path.join(DIST, file)), 0);
}

function enforce(label, actual, budget) {
    if (actual <= budget) return;
    throw new Error(`${label}: ${(actual / KIB).toFixed(2)} KiB exceeds ${(budget / KIB).toFixed(0)} KiB gzip`);
}

const storefront = initialBytes('storefront.html');
const studio = initialBytes('theme-studio.html');
const dashboardScript = javascriptReferences('index.html')[0];

if (!dashboardScript) throw new Error('Dashboard entry script was not found in dist/index.html');

const dashboard = gzipBytes(path.join(DIST, dashboardScript));
const dashboardInitial = initialBytes('index.html');
enforce('Storefront initial JavaScript', storefront, budgets.storefrontInitial);
enforce('Theme Studio initial JavaScript', studio, budgets.themeStudioInitial);
enforce('Dashboard entry JavaScript', dashboard, budgets.dashboardEntry);
enforce('Dashboard initial JavaScript', dashboardInitial, budgets.dashboardInitial);

for (const file of fs.readdirSync(path.join(DIST, 'assets'))) {
    if (!file.endsWith('.js')) continue;
    enforce(`Route chunk ${file}`, gzipBytes(path.join(DIST, 'assets', file)), budgets.routeChunk);
}

console.log(
    `[budgets] storefront ${(storefront / KIB).toFixed(2)} KiB; `
    + `studio ${(studio / KIB).toFixed(2)} KiB; `
    + `dashboard entry ${(dashboard / KIB).toFixed(2)} KiB; `
    + `dashboard initial ${(dashboardInitial / KIB).toFixed(2)} KiB gzip`,
);
