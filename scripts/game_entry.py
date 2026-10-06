"""Genuine Home entry for native scripts, separate from read-only scene readiness.

Call once after a real game navigation/reload, never between scene gestures.
A blocked entry fails the test; there is no state injection, retry or auto-skip.
"""


def enter_game(page):
    page.wait_for_function('window.dollhouse && !document.querySelector("#loading")',
                           timeout=60000)
    page.locator('#home [data-home-action="play"]').click(timeout=60000)
    page.wait_for_function('''() => {
        const app = document.querySelector('#app'), ui = document.querySelector('#ui');
        return app?.dataset.screen === 'play' && ui && !ui.hidden && !ui.inert;
    }''', timeout=60000)
