#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import path from "path";
import { Logger } from "./utils/logger";
import { parseAndGenerate, Options } from "./index";
import packageJson from "../package.json";

const conf = yargs(hideBin(process.argv))
    .version(packageJson.version)
    .usage("wsdl-tsclient [options] [path|url]")
    .example("", "wsdl-tsclient file.wsdl -o ./generated/")
    .example("", "wsdl-tsclient ./res/**/*.wsdl -o ./generated/")
    .example("", "wsdl-tsclient https://example.com/service.wsdl -o ./generated/")
    .demandOption(["o"])
    .option("o", {
        type: "string",
        description: "Output directory",
    })
    .option("emitDefinitionsOnly", {
        type: "boolean",
        description: "Generate only Definitions",
    })
    .option("modelNamePreffix", {
        type: "string",
        description: "Prefix for generated interface names",
    })
    .option("modelNameSuffix", {
        type: "string",
        description: "Suffix for generated interface names",
    })
    .option("caseInsensitiveNames", {
        type: "boolean",
        description: "Case-insensitive name while parsing definition names",
    })
    .option("folderFromWsdl2LowerCase", {
        type: "boolean",
        description: "To lower case folders from wdsl files",
    })
    .option("maxRecursiveDefinitionName", {
        type: "number",
        description: "Maximum count of definition's with same name but increased suffix. Will throw an error if exceed",
    })
    .option("quiet", {
        type: "boolean",
        description: "Suppress all logs",
    })
    .option("verbose", {
        type: "boolean",
        description: "Print verbose logs",
    })
    .option("no-color", {
        type: "boolean",
        description: "Logs without colors",
    })
    .parseSync();

// Logger section

if (conf["no-color"] || process.env.NO_COLOR) {
    Logger.colors = false;
}

if (conf.verbose || process.env.DEBUG) {
    Logger.isDebug = true;
}

if (conf.quiet) {
    Logger.isDebug = false;
    Logger.isLog = false;
    Logger.isInfo = false;
    Logger.isWarn = false;
    Logger.isError = false;
}

// Options override section

const options: Partial<Options> = {};

if (conf["no-color"] || process.env.NO_COLOR) {
    options.colors = false;
}

if (conf.verbose || process.env.DEBUG) {
    options.verbose = true;
}

if (conf.quiet) {
    options.quiet = true;
}

if (conf.emitDefinitionsOnly) {
    options.emitDefinitionsOnly = true;
}

if (conf.modelNamePreffix) {
    options.modelNamePreffix = conf.modelNamePreffix;
}

if (conf.modelNameSuffix) {
    options.modelNameSuffix = conf.modelNameSuffix;
}

if (conf.maxRecursiveDefinitionName || conf.maxRecursiveDefinitionName == 0) {
    options.maxRecursiveDefinitionName = conf.maxRecursiveDefinitionName;
}

if (conf.caseInsensitiveNames) {
    options.caseInsensitiveNames = conf.caseInsensitiveNames;
}
if (conf.folderFromWsdl2LowerCase) {
    options.folderFromWsdl2LowerCase = conf.folderFromWsdl2LowerCase;
}

Logger.debug("Options");
Logger.debug(JSON.stringify(options, null, 2));

//

if (conf._ === undefined || conf._.length === 0) {
    Logger.error("No WSDL files or URLs provided");
    Logger.debug(`Arguments: ${conf._}`);
    process.exit(1);
}

(async function () {
    if (conf.o === undefined || conf.o.length === 0) {
        Logger.error("You forget to pass path to Output directory -o");
        process.exit(1);
    } else {
        const outDir = path.resolve(conf.o);

        let errorsCount = 0;
        const matches = conf._ as string[];

        if (matches.length > 1) {
            Logger.debug(matches.map((m) => path.resolve(m)).join("\n"));
            Logger.log(`Found ${matches.length} wsdl files`);
        }
        for (const match of matches) {
            let wsdlPath: string;
            let wsdlName: string;

            // Check if it's a URL or file path
            if (match.startsWith("http://") || match.startsWith("https://")) {
                wsdlPath = match;
                wsdlName = new URL(match).pathname.split("/").pop() || "remote-wsdl";
                Logger.log(`Generating soap client from URL "${wsdlPath}"`);
            } else {
                wsdlPath = path.resolve(match);
                wsdlName = path.basename(wsdlPath);
                Logger.log(`Generating soap client from file "${wsdlName}"`);
            }

            try {
                await parseAndGenerate(wsdlPath, path.join(outDir), options);
            } catch (err) {
                Logger.error(`Error occured while generating client from "${wsdlName}"`);
                Logger.error(`\t${err}`);
                errorsCount += 1;
            }
        }
        if (errorsCount) {
            Logger.error(`${errorsCount} Errors occured!`);
            process.exit(1);
        }
    }
})();
