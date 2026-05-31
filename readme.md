# Easy Email Pro Demo - React Email Editor

Easy Email Pro is a drag-and-drop email template editor for building responsive HTML emails, marketing campaigns, newsletters, and transactional email templates. It combines the editing experience of SlateJS with MJML email rendering, so teams can create professional email templates with inline editing, reusable blocks, keyboard shortcuts, preview, and mobile-friendly output.

Visit the official website for product details, pricing, and integration guides: [https://www.easyemail.pro/](https://www.easyemail.pro/)

## Live Demo

Try the hosted email editor demo: [https://demo.easyemail.pro/full](https://demo.easyemail.pro/full)

Documentation: [https://docs.easyemail.pro/docs/intro](https://docs.easyemail.pro/docs/intro)

<div style="font-size:0">
  <img src="./desktop.png" alt="Easy Email Pro desktop email editor demo" style="display:inline-block;width:48%;margin-right:2%" />
  <img src="./mobile.png" alt="Easy Email Pro responsive mobile email preview" style="display:inline-block;width:48%" />
</div>
<br/>
<div>
  <img src="./templates.png" alt="Easy Email Pro email template gallery" style="display:inline-block;width:98%"/>
</div>

## Why Easy Email Pro

- Build responsive HTML email templates with MJML compatibility.
- Use a React email editor with drag-and-drop blocks and inline content editing.
- Create marketing emails, newsletters, product emails, and transactional email templates.
- Preview desktop and mobile layouts while editing.
- Integrate the editor into React, Vue, Next.js, iframe, or pure JavaScript projects.

## Run This Demo Locally

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open the simple demo:

```text
http://localhost:3000/simple
```

## Update Client ID

For the free demo client, use `FREE`. To use your own client ID, update `vite.config.ts`:

```ts
"process.env.CLIENT_ID": JSON.stringify("your client id"),
```

## Pure JavaScript Integration

If you want to integrate Easy Email Pro without a framework, build the standalone version first:

```bash
npm run build:iife
```

This generates two files in the `build` directory:

- `easy-email-pro.js`
- `style.css`

Copy these files to your project's assets directory, then include them in your HTML:

```html
<link rel="stylesheet" href="./build/style.css" />
<script src="./build/easy-email-pro.js"></script>
```

Initialize the editor:

```html
<div id="editor"></div>
<script>
  const editor = EasyEmailPro.initEditor("editor", {
    clientId: "your-client-id",
    height: "calc(100vh - 50px)",
    initialValues: yourTemplate,
    onUpload: (file) => {
      return Promise.resolve(uploadedFileUrl);
    },
  });
</script>
```

For a complete example, see the [pure HTML implementation](./pure.html).

## More Examples

Easy Email Pro also includes examples for Vue, Next.js, iframe integration, and other embedding patterns:

[https://github.com/orgs/Easy-Email-Pro/repositories](https://github.com/orgs/Easy-Email-Pro/repositories)

## Official Website

Learn more about the Easy Email Pro responsive email editor, MJML email builder, and email template design workflow at [https://www.easyemail.pro/](https://www.easyemail.pro/).
