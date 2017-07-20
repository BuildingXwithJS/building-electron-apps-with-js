/* eslint-env node, mocha */
const assert = require('assert');
const path = require('path');
const {Application} = require('spectron');

// construct paths
const baseDir = path.join(__dirname, '..');
const electronBinary = path.join(baseDir, 'node_modules', '.bin', 'electron');

// utility functions
const sleep = time => new Promise(r => setTimeout(r, time));

describe('Application launch', function() {
  this.timeout(30000);

  const app = new Application({
    path: electronBinary,
    args: [baseDir],
  });

  before(() => app.start());

  after(() => app.stop());

  it('Shows an initial window', async () => {
    await app.client.waitUntilWindowLoaded();
    const count = await app.client.getWindowCount();
    assert.equal(count, 1);
  });

  it('Navigates to settings', async () => {
    app.client.click('#settings');
    await app.client.waitUntilWindowLoaded();
    const crSettings = await app.client.getHTML('#crunchyroll');
    assert.ok(crSettings);
  });

  it('Login using crunchyroll', async () => {
    await app.client.click('#crLogin');
    // check that login window has been created
    const count = await app.client.getWindowCount();
    assert.equal(count, 2);
    // set login window as active
    await app.client.windowByIndex(1);
    await app.client.waitUntilWindowLoaded();
    // check login form and sleep if we hit bot protection
    try {
      await app.client.getHTML('#login_form');
    } catch (e) {
      await sleep(6000);
    }
    // get login form again
    const loginFormTwo = await app.client.getHTML('#login_form');
    assert.ok(loginFormTwo);
    // fill out login form
    await app.client.setValue('#login_form_name', process.env.CR_LOGIN);
    await app.client.setValue('#login_form_password', process.env.CR_PASS);
    await app.client.click('button=Log In');
    await app.client.waitUntilWindowLoaded();
    await sleep(2000);
    // check that login window has been closed
    const finalCount = await app.client.getWindowCount();
    assert.equal(finalCount, 1);
    // switch back to main window
    await app.client.windowByIndex(0);
    // go back to settings page
    app.client.click('#settings');
    await app.client.waitUntilWindowLoaded();
    // check that button is now logout
    const crLogout = await app.client.getHTML('#crLogout');
    assert.ok(crLogout);
  });
});
