import { graphql } from "@octokit/graphql";
import fs from "node:fs/promises";
import process from "node:process";
import xml2js from "xml2js";

const { user } = await graphql(
  `
    {
      user(login: "NysoS") {
        repositories(last: 50) {
          nodes {
            name
            devRef: ref(qualifiedName: "dev") {
              name
              target {
                ... on Commit {
                  history(first: 100) {
                    totalCount
                  }
                }
              }
            }
            mainRef: ref(qualifiedName: "main") {
              name
              target {
                ... on Commit {
                  history(first: 100) {
                    totalCount
                  }
                }
              }
            }
          }
        }
      }
    }
  `,
  {
    headers: {
      authorization: process.env.TOKEN,
    },
  },
);

var maxDevTotalCommit = 0;
var maxMainTotalCommit = 0;

user.repositories.nodes.forEach((element) => {
  maxDevTotalCommit += element?.devRef?.target?.history?.totalCount ?? 0;
  maxMainTotalCommit += element?.mainRef?.target?.history?.totalCount ?? 0;
});

try {
  const svgData = await fs.readFile("./Counter_svg_commit.svg", "utf-8");

  const parser = new xml2js.Parser();
  const jsonRes = await parser.parseStringPromise(svgData);

  jsonRes.svg.text[0]._ = `${maxMainTotalCommit}`;
  jsonRes.svg.text[2]._ = `${maxDevTotalCommit}`;

  const builder = new xml2js.Builder({
    xmldec: { version: "1.0", encoding: "UTF-8", standalone: false },
    renderOpts: { pretty: true, indent: "  ", newline: "\n" },
  });
  const newSvgContent = builder.buildObject(jsonRes);
  await fs.writeFile("Counter_svg_commit.svg", newSvgContent);
  console.log(`Fichier généré avec succès`);
} catch (e) {
  console.error("Le script a planté avant ou pendant l'écriture du SVG :", e);
  process.exit(1);
}
