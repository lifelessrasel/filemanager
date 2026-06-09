# File Manager plugin for VitoDeploy

Site-scoped file manager for browsing and editing website files over SSH.

URL pattern: `/servers/{server}/sites/{site}/filemanager`

## Features

- Browse directories with breadcrumbs
- Create files and folders
- Upload and download files
- Edit files in the Monaco editor
- Rename, copy, delete, compress, and extract archives
- Responsive layout using VitoDeploy UI components
- Path access restricted to the site root directory

## Requirements

- VitoDeploy with the plugins system enabled
- Site must be in `ready` status
- SSH access to the server as configured by VitoDeploy

## Local development

Per the [plugin documentation](https://vitodeploy.com/docs/plugins):

1. Copy this folder to `app/Vito/Plugins/Lifelessrasel/Filemanager`
2. Namespace must be `App\Vito\Plugins\Lifelessrasel\Filemanager`
3. Go to **Admin → Plugins → Discover**, then install and enable the plugin

For GitHub publishing, add the `vitodeploy-plugin` topic to https://github.com/lifelessrasel/filemanager

## Install from GitHub

1. In VitoDeploy go to **Admin → Plugins**
2. Install from: `https://github.com/lifelessrasel/filemanager`
3. **Discover** (if developing locally) or install directly from GitHub
4. **Install → Enable**
5. On your VitoDeploy server, run `npm run build` (required for the sidebar link and UI)

If `/filemanager` returns **500 Server Error**, the plugin frontend was not published yet. Disable and re-enable the plugin, then run `npm run build`.

If the **File Manager** sidebar item is missing after enabling, run `npm run build` on the server. The sidebar patch updates `layout.tsx`, which only appears in the UI after a frontend rebuild.

## Installation hooks

When the plugin is **installed** or **enabled**, it:

- Publishes the React page to `resources/js/pages/filemanager`
- Adds a **File Manager** item to the site sidebar (reverted on disable/uninstall)

When **disabled** or **uninstalled**, published assets and sidebar changes are removed.

After install or enable, rebuild frontend assets if you use a production build:

```bash
npm run build
```

## Security

File operations run as the site SSH user and are limited to the site path. Write actions require site update permission.

Use with caution on production servers.

## Documentation

- [VitoDeploy Plugins](https://vitodeploy.com/docs/plugins)
