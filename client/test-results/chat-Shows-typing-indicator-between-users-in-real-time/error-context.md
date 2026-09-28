# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.js >> Shows typing indicator between users in real time
- Location: e2e\chat.spec.js:86:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Miku is typing...')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Miku is typing...') with timeout 5000ms
  - waiting for getByText('Miku is typing...')

```

```yaml
- banner:
  - link "OkuTask":
    - /url: /dashboard
  - link "Chat":
    - /url: /chat
  - text: CH Chiikawa
- main:
  - complementary:
    - heading "Online" [level=3]
    - text: "7"
    - list:
      - listitem: N neoma
      - listitem: V Valeria Jimenez
      - listitem: M Miku
      - listitem: C Chiikawa
      - listitem: M Miku
      - listitem: M Miku
      - listitem: C Chiikawa
  - link "↩ Dashboard":
    - /url: /dashboard
  - heading "Team Chat" [level=2]
  - text: Connected Chiikawa joined the chat 01:19 AM
  - button "Image Icon":
    - img "Image Icon"
  - textbox "Write a message... (Enter to send)"
  - button "Send" [disabled]
```

# Test source

```ts
  27  |     ).toBeVisible();
  28  | 
  29  |     // sends msg from
  30  |     await page1.fill(
  31  |         '.chat-input',
  32  |         'Hello Chiikawa! This is Miku :3'
  33  |     );
  34  | 
  35  |     await page1.click('.chat-send-btn');
  36  | 
  37  |     // gets msg from
  38  |     await expect(
  39  |         page2.getByText('Hello Chiikawa! This is Miku :3')
  40  |     ).toBeVisible();
  41  | });
  42  | 
  43  | test('Show system messages for when users joins/leaves', async ({ browser }) => {
  44  | 
  45  |     const email1 = `join1_${Date.now()}@test.com`;
  46  |     const email2 = `join2_${Date.now()}@test.com`;
  47  | 
  48  |     const page1 = await browser.newPage();
  49  | 
  50  |     // registers user 1
  51  |     await register(
  52  |         page1,
  53  |         'Miku',
  54  |         email1,
  55  |         'Test1234'
  56  |     );
  57  | 
  58  |     await page1.goto('http://localhost:5173/chat');
  59  | 
  60  |     // registers user 2
  61  |     const page2 = await browser.newPage();
  62  | 
  63  |     await register(
  64  |         page2,
  65  |         'Chiikawa',
  66  |         email2,
  67  |         'Test1234'
  68  |     );
  69  | 
  70  |     await page2.goto('http://localhost:5173/chat');
  71  | 
  72  |     // verifies input msg
  73  |     await expect(
  74  |         page1.getByText('Chiikawa joined the chat')
  75  |     ).toBeVisible();
  76  | 
  77  |     // user 2 leaves chat
  78  |     await page2.close();
  79  | 
  80  |     // verifies output msg
  81  |     await expect(
  82  |         page1.getByText('Chiikawa left the chat')
  83  |     ).toBeVisible();
  84  | });
  85  | 
  86  | test('Shows typing indicator between users in real time', async ({ browser }) => {
  87  | const email1 = `typing1_${Date.now()}@test.com`;
  88  | const email2 = `typing2_${Date.now()}@test.com`;
  89  | 
  90  | const page1 = await browser.newPage();
  91  | const page2 = await browser.newPage();
  92  | 
  93  | await register(
  94  |     page1,
  95  |     'Miku',
  96  |     email1,
  97  |     'Test1234'
  98  | );
  99  | 
  100 | await register(
  101 |     page2,
  102 |     'Chiikawa',
  103 |     email2,
  104 |     'Test1234'
  105 | );
  106 | 
  107 | await page1.goto('http://localhost:5173/chat');
  108 | await page2.goto('http://localhost:5173/chat');
  109 | 
  110 | await expect(
  111 |     page1.locator('.connection-status.online')
  112 | ).toBeVisible();
  113 | 
  114 | await expect(
  115 |     page2.locator('.connection-status.online')
  116 | ).toBeVisible();
  117 | 
  118 | // user 1 starts typing
  119 | await page1.fill(
  120 |     '.chat-input',
  121 |     'Hello, I am typing...'
  122 | );
  123 | 
  124 | // user 2 should see the typing indicator
  125 | await expect(
  126 |     page2.getByText('Miku is typing...')
> 127 | ).toBeVisible();
      |   ^ Error: expect(locator).toBeVisible() failed
  128 | 
  129 | // user 1 stops typing
  130 | await page1.fill(
  131 |     '.chat-input',
  132 |     ''
  133 | );
  134 | 
  135 | // the indicator should disappear
  136 | await expect(
  137 |     page2.getByText('Miku is typing...')
  138 | ).not.toBeVisible();
  139 | 
  140 | });
```