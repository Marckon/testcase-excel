#!/usr/bin/env node

import Excel from "exceljs";
import { input } from "@inquirer/prompts";
import { glob } from "glob";
import fs from "fs";
import { extractCaseDesc } from "./extract-case-desc";
import chalk from "chalk";

(async () => {
  const testfilePattern = await input({
    message: "请输入测试文件glob匹配方式",
    default: "{**/*/*,*}.{vitest,test,jest}.{js,ts}",
  });
  const e2ePattern = await input({
    message: "请输入e2e测试文件的位置",
    default: "e2e/",
  });
  const tagDir = await input({
    message:
      "指定文件目录，按照其次级目录名创建用例标签，如果未匹配到直接以文件名作为用例标签",
    default: "plugins,framework",
  });

  const filePaths = await glob(testfilePattern);
  console.log(filePaths);
  if (filePaths.length) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("sheet1");

    worksheet.columns = [
      { header: "所属模块", key: "label" },
      { header: "用例描述", key: "desc" },
      { header: "等级", key: "rank" },
      { header: "测试方法", key: "approach" },
      { header: "测试文件", key: "path" },
    ];

    for (const filePath of filePaths) {
      const path = filePath;
      // TODO 没有表述rank的依据
      const rank = "P1";

      let approach = "jest";
      if (
        e2ePattern
          .split(",")
          .some((e2ePatternStr) => new RegExp(e2ePatternStr).test(filePath))
      ) {
        approach = "e2e";
      }

      let label = /(.*\/)*([^\.]+)\./.exec(filePath)?.[2];
      for (const dir of tagDir.split(",")) {
        if (new RegExp(dir + "/").test(filePath)) {
          label =
            new RegExp(`${dir}\/([^\.\/]+)\/`).exec(filePath)?.[1] || label;
          break;
        }
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const descs = extractCaseDesc(content, /\.ts$/.test(filePath));

      for (const desc of descs) {
        worksheet.addRow({
          label,
          rank,
          approach,
          path,
          desc,
        });
      }
      // 通过文件流写文件
      await workbook.xlsx.writeFile("testcase.xlsx");
      console.log(chalk.green("文件已创建"));
      process.exit(0);
    }
  }
})();
