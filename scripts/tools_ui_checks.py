"""Rendered House Tools contracts; simulation and WebGL are tested separately."""
from pathlib import Path
import os


def run_tools_ui_checks(page, results):
    output = os.environ.get('TOOLS_UI_EVIDENCE')
    if output:
        Path(output).mkdir(parents=True, exist_ok=True)
    for locale in ('en', 'ar'):
        for width, height, large in ((320,568,False),(390,844,False),(844,390,False),(1440,900,False),(320,568,True),(390,844,True),(844,390,True),(1440,900,True)):
            case = f'{locale} {width}x{height} '+('200% text' if large else 'normal text')+' House Tools'
            page.set_viewport_size({'width': width, 'height': height})
            page.evaluate('''({locale,large}) => {
                fixtureUI.close(); fixtureUI.collapseTools();
                fixtureState.settings.locale=locale;
                fixtureState.settings.largeText=large;
                document.documentElement.style.fontSize=large?'32px':'16px';
                fixtureState.paused=false;
                fixtureUI.refresh(); fixtureViews.update();
                fixtureObjects.update(); fixtureStory.clear();
            }''', {'locale':locale,'large':large})
            toggle = page.locator('[data-action="toggle-tools"]')
            toggle.click()
            dock = page.locator('.dock')
            observed = dock.evaluate('''dock => {
                const rect=dock.getBoundingClientRect();
                const buttons=[...dock.querySelectorAll('[data-action^="panel-"]')];
                const labels=buttons.map(button=>{
                    const label=button.querySelector('span');
                    const r=label.getBoundingClientRect(), s=getComputedStyle(label);
                    return {action:button.dataset.action,text:label.textContent,
                        visible:r.width>1&&r.height>1&&s.visibility!=='hidden'&&s.display!=='none',
                        font:parseFloat(getComputedStyle(button).fontSize),
                        fits:label.scrollWidth<=label.clientWidth+1};
                });
                const hit=document.elementFromPoint(rect.x+4,rect.y+4);
                return {labels, width:rect.width,height:rect.height,
                    inView:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth+1&&rect.bottom<=innerHeight+1,
                    catchesPointer:hit===dock||dock.contains(hit),
                    pageOverflow:document.documentElement.scrollWidth-innerWidth};
            }''')
            results.append({'name':case+' keeps all five destinations visibly named',
                            'passed':len(observed['labels'])==5 and all(x['visible'] and x['font']>=14 and x['fits'] for x in observed['labels']),
                            'observed':observed})
            results.append({'name':case+' stays onscreen and stops taps reaching the house',
                            'passed':observed['inView'] and observed['catchesPointer'] and observed['pageOverflow']<=1,
                            'observed':observed})
            if output and width==390 and not large:
                page.screenshot(path=str(Path(output)/f'tools-{locale}.png'))
            settings=page.locator('[data-action="panel-settings"]')
            settings.click()
            results.append({'name':case+' opens settings through its real command router',
                            'passed':page.locator('#sheet').is_visible() and toggle.get_attribute('aria-expanded')=='false'})
            page.locator('#sheet [data-action="close"]').click()
            results.append({'name':case+' returns to the same single collapsed tools entry',
                            'passed':toggle.is_visible() and page.locator('[data-action^="panel-"]:visible').count()==0})


if __name__ == '__main__':
    import json
    import mimetypes
    import re
    from urllib.parse import urlparse
    from playwright.sync_api import sync_playwright

    root = Path(__file__).resolve().parents[1]
    styles = re.findall(r'<link[^>]+href="\./(src/[^"<>]+\.css)"', (root/'index.html').read_text())
    markup = '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#fff">'
    markup += ''.join(f'<link rel="stylesheet" href="/{name}">' for name in styles)
    markup += '''</head><body><div id="app"><canvas id="world"></canvas><div id="ui"></div></div>
<script type="module">
import {createState} from '/src/simulation.js';
import {createUI} from '/src/ui.js';
import {createRoomViews} from '/src/room-views.js';
import {createStoryUI} from '/src/story-ui.js';
import {createObjectControls} from '/src/object-controls.js';
const host=document.querySelector('#ui');
window.fixtureState=createState();
window.fixtureUI=createUI(host,()=>fixtureState,(action,value)=>{
 if(action==='panel-state')fixtureState.paused=Boolean(value&&value!=='activities');
 if(action==='inspect-object')fixtureUI.openObject(value);
});
window.fixtureViews=createRoomViews(host,()=>fixtureState,()=>{});
window.fixtureStory=createStoryUI(host,()=>fixtureState,()=>{});
window.fixtureObjects=createObjectControls(host,()=>fixtureState,()=>{});
window.fixtureReady=true;
</script></body></html>'''

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={'width':390,'height':844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))

        def serve(route):
            path = urlparse(route.request.url).path
            if path == '/':
                route.fulfill(status=200, content_type='text/html', body=markup)
                return
            file = (root/path.lstrip('/')).resolve()
            if root not in file.parents or not file.is_file():
                route.fulfill(status=404, body='Not found')
                return
            mime = 'text/javascript' if file.suffix == '.js' else mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
            route.fulfill(status=200, content_type=mime, body=file.read_bytes())

        page.route('http://house-tools.test/**', serve)
        page.goto('http://house-tools.test/')
        page.wait_for_function('window.fixtureReady===true')
        results = []
        run_tools_ui_checks(page, results)
        results.append({'name':'actual UI modules report no browser errors','passed':not errors,'errors':errors})
        print(json.dumps(results, indent=2))
        browser.close()
        raise SystemExit(0 if all(result['passed'] for result in results) else 1)
