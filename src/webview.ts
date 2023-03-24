"use strict";

import * as vscode from "vscode";
import { posix } from "path";

export async function getWebviewContent(projectFolder: string): Promise<string> {
    const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(projectFolder));
    const projectFolderName = posix.basename(projectFolder);

    const style = `
    <style>
    .content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      height: 100%;
      max-height: 100vh;
      width: 100%;
      max-width: 100vw;
      margin: 0 auto;
      text-align: center;
    }
    #projectsList {
      max-height: 80vh;
    }
    h1 {
      font-size: 30px;
      margin-bottom: 30px;
    }
    .heading {
      width: 100%;
      max-width: 90vw;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      column-gap: 10px;
      row-gap: 10px;
    }
    .settings-icon {
      user-select: none;
      cursor: pointer;
    }
    ul {
      list-style: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      column-gap: 10px;
      row-gap: 10px;
    }
    li {
      width: 100%;
      min-width: 80px;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      border-radius: 5px;
      transition: all 0.2s ease-in-out;
      overflow: hidden;
      user-select: none;
      cursor: pointer;
      padding: 1px;
      margin: 2px;
    }
    li:hover {
      box-shadow: 0px 0px 5px 0px #ccc;
    }
   .icon {
    font-size: 20px;
    margin-right: 5px;
   }
    .name {
      width: auto;
      font-size: 16px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 150px;
    }
  </style>
  `;

  const infodFiles = await Promise.all(files.map(async file => {
    const [name, type] = file;
    const stype = type === vscode.FileType.Directory ? "folder" : "file";

    const path = posix.join(projectFolder, name);
    const fileinfo = await vscode.workspace.fs.stat(vscode.Uri.file(path));
    // const name = posix.basename(path);
    const fileObj = {
        path: path,
        name: name,
        type: type,
        stype: stype,
        info: fileinfo,
    };
    return fileObj;
    }));
    const filesSorted = infodFiles.sort((a, b) => {
      if (b.type !== a.type) {
        return b.stype.localeCompare(a.stype);
      }
      if (b.type === vscode.FileType.Directory) { // if both are folders, sort by mtime
        return b.info.mtime - a.info.mtime;
      }
      return b.info.mtime - a.info.mtime;
    });

  const listItems = filesSorted.map((file) => {
    const icon = file.stype === "folder" ? "📁" : "📄";
    const name = file.name;
    return `
      <li class="proj-item ${file.stype}-item" title="Open ${file.stype === "folder" ? "project" : "file"}: ${file.path}" x-project-path="${file.path}">
        <div class="icon">${icon}</div>
        <span class="name">${name}</span>
      </li>
    `;
  }).join("");

  const content = `
    <div class="content">
      <div class="heading">
        <h1>Projects (${projectFolderName})</h1> <div class="icon settings-icon">⚙️</div>
      </div>
      <ul id="projectsList">
        ${listItems}
      </ul>
    </div>
  `;

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Projects</title>
        ${style}
    </head>
    <body>
        ${content}

        <script>
        (function() {
          const vscode = acquireVsCodeApi();
          document.querySelector(".settings-icon")
            .addEventListener("click", e => {
              e.preventDefault()
              vscode.postMessage({
                command: "openSettings"
              })
            })

          const items = [...document.querySelectorAll(".proj-item")];
          items.forEach(item => {
            item.addEventListener("click", (event) => {
              event.preventDefault();
              const t = event.target
              console.log("event", t)
              const path = item.getAttribute("x-project-path")
              console.log(path)
              vscode.postMessage({
                command: "openItem",
                itemPath: path
              })
            })
          })
        }());

        </script>
    </body>
    </html>`;
}